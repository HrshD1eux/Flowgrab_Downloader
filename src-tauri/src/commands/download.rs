use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_shell::ShellExt;

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

fn sanitize_filename(filename: &str) -> String {
    let re = regex::Regex::new(r#"[<>:"/\\|?*]"#).unwrap();
    re.replace_all(filename, "").to_string()
}

/// Build yt-dlp args from download options
fn build_args(_download_id: &str, opts: &DownloadOptions, ffmpeg_dir: &str) -> Vec<String> {
    let mut args: Vec<String> = Vec::new();

    // Progress output format we can parse
    args.push("--newline".to_string());
    args.push("--progress".to_string());
    args.push("--progress-template".to_string());
    args.push("%(progress._percent_str)s|%(progress._speed_str)s|%(progress._eta_str)s|%(progress.filename)s".to_string());
    args.push("--no-warnings".to_string());

    // Parallel concurrent fragment downloads (higher = faster, especially for YouTube)
    args.push("-N".to_string());
    args.push("16".to_string());
    args.push("--concurrent-fragments".to_string());
    args.push("16".to_string());

    // Larger HTTP chunk size for faster throughput on high-bandwidth connections
    args.push("--http-chunk-size".to_string());
    args.push("10M".to_string());
    
    // Better robustness for fragments
    args.push("--fragment-retries".to_string());
    args.push("10".to_string());

    // Filename sanitization
    args.push("--restrict-filenames".to_string());

    // Format selection
    if opts.is_audio {
        args.push("-x".to_string());
        args.push("--audio-format".to_string());
        args.push("mp3".to_string());
        args.push("--audio-quality".to_string());
        args.push("0".to_string());
    } else if opts.format_id == "bestvideo+bestaudio/best" || opts.format_id == "best" {
        args.push("-f".to_string());
        args.push("bestvideo+bestaudio/best".to_string());
        args.push("--merge-output-format".to_string());
        args.push(opts.output_format.clone());
    } else {
        args.push("-f".to_string());
        args.push(format!("{}+bestaudio/best", opts.format_id));
        args.push("--merge-output-format".to_string());
        args.push(opts.output_format.clone());
    }

    // Sanitize custom filename if provided
    let custom_name = if opts.custom_filename.is_empty() {
        String::new()
    } else {
        sanitize_filename(&opts.custom_filename)
    };

    // Output path with Video ID for uniqueness to prevent parallel download collisions
    let output_template = if custom_name.is_empty() {
        if opts.output_path.is_empty() {
            "%(title)s [%(id)s].%(ext)s".to_string()
        } else {
            format!("{}\\%(title)s [%(id)s].%(ext)s", opts.output_path.trim_end_matches('\\'))
        }
    } else {
        if opts.output_path.is_empty() {
            format!("{}.%(ext)s", custom_name)
        } else {
            format!(
                "{}\\{}.%(ext)s",
                opts.output_path.trim_end_matches('\\'),
                custom_name
            )
        }
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
    args.push("--ffmpeg-location".to_string());
    args.push(ffmpeg_dir.to_string());

    args.push(opts.url.clone());

    args
}

#[allow(dead_code)]
fn parse_progress_line(line: &str) -> Option<(f64, String, String, String)> {
    // Expected format: "  42.0%|1.23MiB/s|00:42|/path/to/file.mp4"
    let parts: Vec<&str> = line.splitn(4, '|').collect();
    if parts.len() < 3 {
        return None;
    }
    let percent_str = parts[0].trim().trim_end_matches('%');
    let percent = percent_str.parse::<f64>().ok()?;
    let speed = parts[1].trim().to_string();
    let eta = parts[2].trim().to_string();
    let filename = if parts.len() > 3 {
        std::path::Path::new(parts[3].trim())
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or(parts[3].trim())
            .to_string()
    } else {
        String::new()
    };
    Some((percent, speed, eta, filename))
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

    let resolver = app.path();
    let resource_dir = resolver
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {e}"))?;
    
    // Resolve ffmpeg path
    let mut ffmpeg_path = resource_dir.clone();
    ffmpeg_path.push("resources");
    let ffmpeg_dir = ffmpeg_path.to_string_lossy().to_string();

    let args = build_args(&download_id, &opts, &ffmpeg_dir);

    tokio::spawn(async move {
        // Hold permit until finished
        let _permit = permit;

        let res = app_handle
            .shell()
            .sidecar("yt-dlp")
            .map_err(|e| format!("Failed to spawn sidecar: {e}"))
            .and_then(|sidecar| {
                Ok(sidecar.args(args))
            });

        match res {
            Ok(sidecar) => {
                let (mut rx, child_handle) = match sidecar.spawn() {
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

                // Progress regex: 42.0%|1.23MiB/s|00:42|filename
                let progress_re = regex::Regex::new(r"([\d.]+)%\|([\w./s]+)\|([\d:]+)\|(.*)").unwrap();

                let mut final_filename = String::new();
                let mut success = true;
                let mut error_msg = String::new();

                while let Some(event) = rx.recv().await {
                    match event {
                        tauri_plugin_shell::process::CommandEvent::Stdout(line_bytes) => {
                            let line = String::from_utf8_lossy(&line_bytes);
                            if let Some(caps) = progress_re.captures(&line) {
                                let percent = caps[1].parse::<f64>().unwrap_or(0.0);
                                let speed = caps[2].to_string();
                                let eta = caps[3].to_string();
                                let filename = caps[4].to_string();
                                final_filename = filename.clone();

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
                        }
                        tauri_plugin_shell::process::CommandEvent::Terminated(payload) => {
                            if payload.code != Some(0) {
                                success = false;
                                error_msg = format!("Exit code {}", payload.code.unwrap_or(-1));
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
                            filename: final_filename,
                        },
                    );

                    // Save to history
                    let history_item = crate::commands::settings::HistoryItem {
                        id: download_id_for_event.clone(),
                        title: opts_for_history.title.clone(),
                        url: opts_for_history.url.clone(),
                        format: if opts_for_history.is_audio { "audio".to_string() } else { "video".to_string() },
                        output_path: Some(opts_for_history.output_path.clone()),
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
        let child: tauri_plugin_shell::process::CommandChild = child;
        child.kill().map_err(|e| format!("Failed to kill process: {e}"))?;
        Ok(())
    } else {
        Err("Download not found".to_string())
    }
}

