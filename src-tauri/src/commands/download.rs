use std::collections::HashMap;
use std::path::Path;
use std::sync::{Arc, LazyLock, Mutex};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DownloadOptions {
    pub title: String,
    pub url: String,
    pub format_id: String,
    pub is_audio: bool,
    pub output_path: String,
    pub custom_filename: String,
    pub output_format: String,
    pub embed_thumbnail: bool,
    pub download_subtitles: bool,
    pub subtitle_language: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DownloadProgress {
    pub download_id: String,
    pub percent: f64,
    pub speed: String,
    pub eta: String,
    pub filename: String,
    pub status: String,
}

/// Global state: map of download_id -> process handle (for cancel)
pub type ActiveDownloads = Arc<Mutex<HashMap<String, ()>>>;

static SANITIZE_RE: LazyLock<regex::Regex> = LazyLock::new(|| {
    regex::Regex::new(r#"[<>:"/\\|?*]"#).unwrap()
});

static PROGRESS_RE: LazyLock<regex::Regex> = LazyLock::new(|| {
    regex::Regex::new(r"^([\d.]+)%\|([^|]*)\|([^|]*)\|(.*)$").unwrap()
});

pub fn sanitize_filename(filename: &str) -> String {
    SANITIZE_RE.replace_all(filename, "").to_string()
}

/// Build yt-dlp args from download options
pub fn build_args(_download_id: &str, opts: &DownloadOptions, ffmpeg_dir: &str) -> Vec<String> {
    let mut args: Vec<String> = Vec::new();

    // Progress output format we can parse
    args.push("--newline".to_string());
    args.push("--progress".to_string());
    args.push("--progress-template".to_string());
    args.push("%(progress._percent_str)s|%(progress._speed_str)s|%(progress._eta_str)s|%(progress.filename)s".to_string());
    args.push("--no-warnings".to_string());
    args.push("--no-check-certificates".to_string());

    // YouTube extractor args to prevent HTTP 403 Forbidden on video fragment streams
    args.push("--extractor-args".to_string());
    args.push("youtube:player_client=android,web,ios".to_string());

    // Safe fragment concurrency
    args.push("-N".to_string());
    args.push("4".to_string());
    
    // Robustness for fragments
    args.push("--fragment-retries".to_string());
    args.push("10".to_string());
    args.push("--retries".to_string());
    args.push("10".to_string());

    // Filename sanitization
    args.push("--restrict-filenames".to_string());

    // Format selection
    if opts.is_audio {
        args.push("-x".to_string());
        args.push("--audio-format".to_string());
        
        let valid_audio_formats = ["mp3", "m4a", "opus", "flac", "wav", "aac", "vorbis"];
        
        let format_from_id = if let Some(stripped) = opts.format_id.strip_prefix("audio-") {
            if stripped == "best" {
                None
            } else {
                Some(stripped.to_lowercase())
            }
        } else {
            None
        };

        let audio_format = if let Some(fmt) = format_from_id.filter(|f| valid_audio_formats.contains(&f.as_str())) {
            fmt
        } else if valid_audio_formats.contains(&opts.output_format.to_lowercase().as_str()) {
            opts.output_format.to_lowercase()
        } else {
            "opus".to_string()
        };
        
        args.push(audio_format);
        args.push("--audio-quality".to_string());
        args.push("0".to_string()); // 0 = best quality in yt-dlp
    } else if opts.format_id == "bestvideo+bestaudio/best" || opts.format_id == "best" {
        args.push("-f".to_string());
        args.push("bestvideo+bestaudio/best".to_string());
        args.push("--merge-output-format".to_string());
        args.push(opts.output_format.clone());
    } else {
        args.push("-f".to_string());
        if opts.format_id.contains('+') || opts.format_id.contains('/') {
            args.push(opts.format_id.clone());
        } else {
            args.push(format!("{}+bestaudio/best", opts.format_id));
        }
        args.push("--merge-output-format".to_string());
        args.push(opts.output_format.clone());
    }

    // Sanitize custom filename if provided
    let custom_name = if opts.custom_filename.is_empty() {
        String::new()
    } else {
        sanitize_filename(&opts.custom_filename)
    };

    // Cross-platform output path construction using std::path::Path
    let template_name = if custom_name.is_empty() {
        "%(title)s [%(id)s].%(ext)s".to_string()
    } else {
        format!("{}.%(ext)s", custom_name)
    };

    let output_template = if opts.output_path.trim().is_empty() {
        template_name
    } else {
        Path::new(&opts.output_path).join(template_name).to_string_lossy().to_string()
    };

    args.push("-o".to_string());
    args.push(output_template);

    // Embed thumbnail
    if opts.embed_thumbnail {
        args.push("--embed-thumbnail".to_string());
    }

    // Subtitles
    if opts.download_subtitles {
        args.push("--write-sub".to_string());
        args.push("--sub-lang".to_string());
        args.push(opts.subtitle_language.clone());
    }

    // ffmpeg location
    if !ffmpeg_dir.is_empty() {
        args.push("--ffmpeg-location".to_string());
        args.push(ffmpeg_dir.to_string());
    }

    args.push(opts.url.clone());

    args
}

#[tauri::command]
pub async fn start_download(
    app: AppHandle,
    state: tauri::State<'_, crate::AppState>,
    download_id: String,
    opts: DownloadOptions,
) -> Result<(), String> {
    let app_handle = app.clone();
    let download_id_for_event = download_id.clone();
    let opts_for_history = opts.clone();

    // Check availability and emit queued status if needed
    if state.download_semaphore.available_permits() == 0 {
        let _ = app.emit(
            "download://progress",
            DownloadProgress {
                download_id: download_id.clone(),
                percent: 0.0,
                speed: "Queued...".to_string(),
                eta: "".to_string(),
                status: "queued".to_string(),
                filename: "".to_string(),
            },
        );
    }

    // Acquire permit (blocks until slot available)
    let permit = state.download_semaphore.clone().acquire_owned().await
        .map_err(|e| format!("Failed to acquire download slot: {e}"))?;

    let ffmpeg_dir = crate::commands::engine::get_ffmpeg_dir(&app).unwrap_or_default();
    let args = build_args(&download_id, &opts, &ffmpeg_dir);

    tokio::spawn(async move {
        // Hold permit until finished
        let _permit = permit;

        let cmd_res = crate::commands::engine::get_ytdlp_command(&app_handle)
            .map(|cmd| cmd.args(args));

        match cmd_res {
            Ok(cmd) => {
                let (mut rx, child_handle) = match cmd.spawn() {
                    Ok(pair) => pair,
                    Err(e) => {
                        let _ = app_handle.emit(
                            "download://progress",
                            DownloadProgress {
                                download_id: download_id_for_event.clone(),
                                percent: 0.0,
                                speed: "".to_string(),
                                eta: "".to_string(),
                                status: format!("error: {}", e),
                                filename: "".to_string(),
                            },
                        );
                        return;
                    }
                };
                
                // Track active download
                {
                    let state = app_handle.state::<crate::AppState>();
                    let mut downloads = state.active_downloads.lock().unwrap();
                    downloads.insert(download_id_for_event.clone(), child_handle);
                }

                let mut final_filename = String::new();
                let mut success = true;
                let mut error_msg = String::new();

                while let Some(event) = rx.recv().await {
                    match event {
                        tauri_plugin_shell::process::CommandEvent::Stdout(line_bytes) => {
                            let line = String::from_utf8_lossy(&line_bytes);
                            let trimmed = line.trim();
                            if let Some(caps) = PROGRESS_RE.captures(trimmed) {
                                let percent = caps[1].parse::<f64>().unwrap_or(0.0);
                                let speed = caps[2].trim().to_string();
                                let eta = caps[3].trim().to_string();
                                let filename = caps[4].trim().to_string();
                                if !filename.is_empty() {
                                    final_filename = filename.clone();
                                }

                                let _ = app_handle.emit(
                                    "download://progress",
                                    DownloadProgress {
                                        download_id: download_id_for_event.clone(),
                                        percent,
                                        speed,
                                        eta,
                                        status: "downloading".to_string(),
                                        filename,
                                    },
                                );
                            }
                        }
                        tauri_plugin_shell::process::CommandEvent::Stderr(line_bytes) => {
                            let line = String::from_utf8_lossy(&line_bytes);
                            log::warn!("[yt-dlp stderr] {line}");
                            if line.contains("HTTP Error 403") {
                                error_msg = "HTTP 403 Forbidden: YouTube stream access denied".to_string();
                            }
                        }
                        tauri_plugin_shell::process::CommandEvent::Terminated(payload) => {
                            if payload.code != Some(0) {
                                success = false;
                                if error_msg.is_empty() {
                                    error_msg = format!("Exit code {}", payload.code.unwrap_or(-1));
                                }
                            }
                            break;
                        }
                        _ => {}
                    }
                }

                // Cleanup handle
                {
                    let state = app_handle.state::<crate::AppState>();
                    let mut downloads = state.active_downloads.lock().unwrap();
                    downloads.remove(&download_id_for_event);
                }

                if success {
                    let _ = app_handle.emit(
                        "download://progress",
                        DownloadProgress {
                            download_id: download_id_for_event.clone(),
                            percent: 100.0,
                            speed: String::new(),
                            eta: String::new(),
                            status: "completed".to_string(),
                            filename: final_filename.clone(),
                        },
                    );

                    // Resolve exact output file path for history
                    let resolved_path = if !final_filename.is_empty() {
                        let f_path = Path::new(&final_filename);
                        if f_path.is_absolute() {
                            final_filename.clone()
                        } else if !opts_for_history.output_path.trim().is_empty() {
                            Path::new(&opts_for_history.output_path)
                                .join(&final_filename)
                                .to_string_lossy()
                                .to_string()
                        } else {
                            final_filename.clone()
                        }
                    } else if !opts_for_history.output_path.trim().is_empty() {
                        opts_for_history.output_path.clone()
                    } else {
                        String::new()
                    };

                    // Save to history (safe persistence guaranteed)
                    let history_item = crate::commands::settings::HistoryItem {
                        id: download_id_for_event.clone(),
                        title: opts_for_history.title.clone(),
                        url: opts_for_history.url.clone(),
                        format: if opts_for_history.is_audio { "audio".to_string() } else { "video".to_string() },
                        output_path: if !resolved_path.is_empty() { Some(resolved_path) } else { None },
                        timestamp: chrono::Utc::now().to_rfc3339(),
                    };
                    let _ = crate::commands::settings::save_history_item(app_handle.clone(), history_item);
                } else {
                    let _ = app_handle.emit(
                        "download://progress",
                        DownloadProgress {
                            download_id: download_id_for_event.clone(),
                            percent: 0.0,
                            speed: String::new(),
                            eta: String::new(),
                            status: format!("error: {}", error_msg),
                            filename: String::new(),
                        },
                    );
                }
            }
            Err(e) => {
                let _ = app_handle.emit(
                    "download://progress",
                    DownloadProgress {
                        download_id: download_id_for_event.clone(),
                        percent: 0.0,
                        speed: String::new(),
                        eta: String::new(),
                        status: format!("error: {}", e),
                        filename: String::new(),
                    },
                );
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn cancel_download(
    state: tauri::State<'_, crate::AppState>,
    download_id: String,
) -> Result<(), String> {
    let mut downloads = state.active_downloads.lock().unwrap();
    if let Some(child) = downloads.remove(&download_id) {
        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            let pid = child.pid();
            let _ = std::process::Command::new("taskkill")
                .args(["/F", "/T", "/PID", &pid.to_string()])
                .creation_flags(0x08000000)
                .output();
        }
        let _ = child.kill();
        Ok(())
    } else {
        Err("Download not found or already stopped".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitize_filename() {
        assert_eq!(sanitize_filename("valid_filename"), "valid_filename");
        assert_eq!(sanitize_filename("file/with\\bad:chars*?\"<>|"), "filewithbadchars");
        assert_eq!(sanitize_filename("cool-song (2024) [feat. artist]"), "cool-song (2024) [feat. artist]");
    }

    #[test]
    fn test_progress_regex_parsing() {
        let line = "45.6%|12.3MiB/s|00:15|video.mp4";
        let caps = PROGRESS_RE.captures(line).expect("Should match valid progress line");
        assert_eq!(&caps[1], "45.6");
        assert_eq!(&caps[2], "12.3MiB/s");
        assert_eq!(&caps[3], "00:15");
        assert_eq!(&caps[4], "video.mp4");
    }

    #[test]
    fn test_build_args_audio_opus() {
        let opts = DownloadOptions {
            title: "Test Track".to_string(),
            url: "https://example.com/watch".to_string(),
            format_id: "bestaudio".to_string(),
            is_audio: true,
            output_path: "C:\\Downloads".to_string(),
            custom_filename: "".to_string(),
            output_format: "opus".to_string(),
            embed_thumbnail: true,
            download_subtitles: false,
            subtitle_language: "en".to_string(),
        };
        let args = build_args("test_id", &opts, "");
        assert!(args.contains(&"-x".to_string()));
        assert!(args.contains(&"--audio-format".to_string()));
        assert!(args.contains(&"opus".to_string()));
        assert!(args.contains(&"--extractor-args".to_string()));
    }

    #[test]
    fn test_build_args_video_custom_name() {
        let opts = DownloadOptions {
            title: "Awesome Video".to_string(),
            url: "https://example.com/watch".to_string(),
            format_id: "137".to_string(),
            is_audio: false,
            output_path: "".to_string(),
            custom_filename: "my_custom_clip".to_string(),
            output_format: "mp4".to_string(),
            embed_thumbnail: false,
            download_subtitles: true,
            subtitle_language: "es".to_string(),
        };
        let args = build_args("test_id", &opts, "/usr/bin/ffmpeg");
        assert!(args.contains(&"-f".to_string()));
        assert!(args.contains(&"137+bestaudio/best".to_string()));
        assert!(args.contains(&"--merge-output-format".to_string()));
        assert!(args.contains(&"mp4".to_string()));
        assert!(args.contains(&"--write-sub".to_string()));
        assert!(args.contains(&"es".to_string()));
        assert!(args.contains(&"--ffmpeg-location".to_string()));
    }
}
