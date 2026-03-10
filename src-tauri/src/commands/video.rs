use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VideoFormat {
    pub format_id: String,
    pub label: String,
    pub quality: String,
    pub ext: String,
    pub filesize: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AudioFormat {
    pub format_id: String,
    pub label: String,
    pub quality: String,
    pub ext: String,
    pub bitrate: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlaylistItem {
    pub title: String,
    pub url: String,
    pub thumbnail_url: String,
    pub duration: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VideoInfo {
    pub title: String,
    pub thumbnail_url: String,
    pub duration: String,
    pub author: String,
    pub url: String,
    pub is_playlist: bool,
    pub playlist_count: Option<u32>,
    pub video_formats: Vec<VideoFormat>,
    pub audio_formats: Vec<AudioFormat>,
    pub entries: Option<Vec<PlaylistItem>>,
}

/// Formats duration from seconds to HH:MM:SS or MM:SS
fn format_duration(secs: f64) -> String {
    let total = secs as u64;
    let hours = total / 3600;
    let minutes = (total % 3600) / 60;
    let seconds = total % 60;
    if hours > 0 {
        format!("{:02}:{:02}:{:02}", hours, minutes, seconds)
    } else {
        format!("{:02}:{:02}", minutes, seconds)
    }
}

/// Get video info and available formats from a URL using yt-dlp
#[tauri::command]
pub async fn get_video_info(app: AppHandle, url: String) -> Result<VideoInfo, String> {
    // ── Step 1: flat-playlist pass to detect if URL is a playlist ──
    let flat_output = app
        .shell()
        .sidecar("yt-dlp")
        .map_err(|e| format!("Failed to find yt-dlp sidecar: {e}"))?
        .args([
            "--dump-json",
            "--flat-playlist",
            "--no-warnings",
            "--quiet",
            &url,
        ])
        .output()
        .await
        .map_err(|e| format!("Failed to run yt-dlp: {e}"))?;

    if !flat_output.status.success() {
        let stderr = String::from_utf8_lossy(&flat_output.stderr).to_string();
        return Err(format!("yt-dlp error: {stderr}"));
    }

    let flat_stdout = String::from_utf8_lossy(&flat_output.stdout).to_string();
    let flat_lines: Vec<&str> = flat_stdout.lines().filter(|l| !l.trim().is_empty()).collect();

    let first_json: serde_json::Value = serde_json::from_str(flat_lines.first().ok_or("No output from yt-dlp")?)
        .map_err(|e| format!("Failed to parse yt-dlp output: {e}"))?;

    let is_playlist_type = first_json["_type"].as_str() == Some("playlist");
    let has_playlist_count = first_json["playlist_count"].is_number();
    let is_playlist = is_playlist_type || has_playlist_count || flat_lines.len() > 1;

    // ── If single video: do a FULL dump-json (no --flat-playlist) to get thumbnail + formats ──
    let json: serde_json::Value = if !is_playlist {
        let full_output = app
            .shell()
            .sidecar("yt-dlp")
            .map_err(|e| format!("Failed to find yt-dlp sidecar: {e}"))?
            .args([
                "--dump-json",
                "--no-playlist",
                "--no-warnings",
                "--quiet",
                &url,
            ])
            .output()
            .await
            .map_err(|e| format!("Failed to run yt-dlp (full): {e}"))?;

        if full_output.status.success() {
            let full_stdout = String::from_utf8_lossy(&full_output.stdout).to_string();
            serde_json::from_str(full_stdout.lines().find(|l| !l.trim().is_empty()).unwrap_or("{}"))
                .unwrap_or(first_json.clone())
        } else {
            first_json.clone()
        }
    } else {
        first_json.clone()
    };

    let mut title = json["playlist_title"].as_str().or_else(|| json["title"].as_str()).unwrap_or("Unknown Title").to_string();
    if title == "Unknown Title" && json["playlist"].is_string() {
        title = json["playlist"].as_str().unwrap().to_string();
    }

    // For thumbnail, prefer the best quality from the "thumbnails" array
    let thumbnail_url = {
        let mut best = json["thumbnail"].as_str().unwrap_or("").to_string();
        if best.is_empty() {
            if let Some(thumbs) = json["thumbnails"].as_array() {
                // Find the highest resolution thumbnail
                best = thumbs.iter()
                    .filter_map(|t| t["url"].as_str())
                    .last()
                    .unwrap_or("")
                    .to_string();
            }
        }
        best
    };

    let duration_secs = json["duration"].as_f64().unwrap_or(0.0);
    let duration = format_duration(duration_secs);
    let author = json["uploader"]
        .as_str()
        .or_else(|| json["channel"].as_str())
        .or_else(|| json["uploader_id"].as_str())
        .unwrap_or("Unknown")
        .to_string();
    let actual_url = json["webpage_url"].as_str().unwrap_or(&url).to_string();
    let playlist_count = json["playlist_count"].as_u64().map(|n| n as u32);

    let mut items = Vec::new();

    if is_playlist {
        // Harvest items from all flat-playlist lines
        for line in &flat_lines {
            if let Ok(e) = serde_json::from_str::<serde_json::Value>(line) {
                let item_url = e["url"].as_str().or_else(|| e["webpage_url"].as_str()).unwrap_or("");
                if !item_url.is_empty() && (e["_type"].as_str() == Some("url") || e["_type"].is_null()) {
                    // Prefer the first good thumbnail from the thumbnails array
                    let item_thumb = {
                        let mut t = e["thumbnail"].as_str().unwrap_or("").to_string();
                        if t.is_empty() {
                            if let Some(thumbs) = e["thumbnails"].as_array() {
                                t = thumbs.iter().filter_map(|x| x["url"].as_str()).last().unwrap_or("").to_string();
                            }
                        }
                        t
                    };
                    items.push(PlaylistItem {
                        title: e["title"].as_str().unwrap_or("Unknown").to_string(),
                        url: item_url.to_string(),
                        thumbnail_url: item_thumb,
                        duration: format_duration(e["duration"].as_f64().unwrap_or(0.0)),
                    });
                }
            }
        }
    }

    // If playlist thumbnail is still missing, fall back to first item's thumb
    let mut final_thumbnail_url = thumbnail_url;
    if final_thumbnail_url.is_empty() && !items.is_empty() {
        final_thumbnail_url = items.iter().find(|i| !i.thumbnail_url.is_empty())
            .map(|i| i.thumbnail_url.clone())
            .unwrap_or_default();
    }

    let final_playlist_count = playlist_count.or_else(|| if is_playlist { Some(items.len() as u32) } else { None });
    let entries = if is_playlist { Some(items) } else { None };

    // Build format lists from yt-dlp's "formats" array (only if it's NOT a flat playlist, or if it has them)
    let mut video_formats: Vec<VideoFormat> = Vec::new();
    let mut audio_formats: Vec<AudioFormat> = Vec::new();

    if let Some(formats) = json["formats"].as_array() {
        // ... (rest of format parsing logic remains same)
        for f in formats.iter().rev() {
            let format_id = f["format_id"].as_str().unwrap_or("").to_string();
            let ext = f["ext"].as_str().unwrap_or("").to_string();
            let vcodec = f["vcodec"].as_str().unwrap_or("none");
            let acodec = f["acodec"].as_str().unwrap_or("none");

            if vcodec == "none" && acodec != "none" {
                let abr = f["abr"].as_f64();
                let tbr = f["tbr"].as_f64();
                let bitrate = abr.or(tbr);
                let label = if let Some(br) = bitrate {
                    format!("{} ~{}kbps", ext.to_uppercase(), br as u32)
                } else {
                    format!("{} audio", ext.to_uppercase())
                };
                let quality = format!("audio-{format_id}");
                if audio_formats.len() < 6 && !audio_formats.iter().any(|a: &AudioFormat| a.label == label) {
                    audio_formats.push(AudioFormat {
                        format_id: format_id.clone(),
                        label,
                        quality,
                        ext: ext.clone(),
                        bitrate,
                    });
                }
            }
            if vcodec != "none" {
                let height = f["height"].as_u64();
                let fps = f["fps"].as_f64();
                if let Some(h) = height {
                    let fps_label = fps.map(|fr| if fr > 30.0 { format!("{}fps", fr as u32) } else { String::new() }).unwrap_or_default();
                    let label = if fps_label.is_empty() { format!("{}p · {}", h, ext.to_uppercase()) } else { format!("{}p{} · {}", h, fps_label, ext.to_uppercase()) };
                    let quality = format!("{h}p");
                    let filesize = f["filesize"].as_u64().or_else(|| f["filesize_approx"].as_u64());
                    if video_formats.len() < 8 && !video_formats.iter().any(|v: &VideoFormat| v.quality == quality) {
                        video_formats.push(VideoFormat { format_id, label, quality, ext, filesize });
                    }
                }
            }
        }
    }

    // For playlists, yt-dlp --flat-playlist doesn't expose individual format lists,
    // so we inject generic height-preference options that yt-dlp understands at download time.
    if is_playlist {
        let preset_heights: &[u64] = &[2160, 1440, 1080, 720, 480, 360];
        for &h in preset_heights {
            let quality = format!("{h}p");
            if !video_formats.iter().any(|v| v.quality == quality) {
                video_formats.push(VideoFormat {
                    format_id: format!("bestvideo[height<={h}]+bestaudio/best[height<={h}]"),
                    label: format!("{h}p (max)"),
                    quality: quality.clone(),
                    ext: "mp4".to_string(),
                    filesize: None,
                });
            }
        }
    }

    // Sort by resolution descending (treat 'best' as highest)
    video_formats.sort_by(|a, b| {
        let parse = |s: &str| -> u32 {
            if s == "best" { 99999 }
            else { s.trim_end_matches('p').parse().unwrap_or(0) }
        };
        parse(&b.quality).cmp(&parse(&a.quality))
    });

    // Always prepend "Best Available" and "Best Audio" options
    video_formats.insert(0, VideoFormat {
        format_id: "bestvideo+bestaudio/best".to_string(),
        label: "Best Available".to_string(),
        quality: "best".to_string(),
        ext: "mp4".to_string(),
        filesize: None,
    });
    audio_formats.insert(0, AudioFormat {
        format_id: "bestaudio".to_string(),
        label: "Best Audio (auto)".to_string(),
        quality: "audio-best".to_string(),
        ext: "mp3".to_string(),
        bitrate: None,
    });

    Ok(VideoInfo {
        title,
        thumbnail_url: final_thumbnail_url,
        duration,
        author,
        url: actual_url,
        is_playlist,
        playlist_count: final_playlist_count,
        video_formats,
        audio_formats,
        entries,
    })
}
