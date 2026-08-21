use serde::{Deserialize, Serialize};
use tauri::AppHandle;

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
    pub filesize: Option<u64>,
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
pub fn format_duration(secs: f64) -> String {
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

/// Calculate estimated bytes based on bitrate in kbps and duration in seconds
fn estimate_filesize(bitrate_kbps: f64, duration_secs: f64) -> Option<u64> {
    if duration_secs > 0.0 && bitrate_kbps > 0.0 {
        Some((((bitrate_kbps * 1000.0) / 8.0) * duration_secs) as u64)
    } else {
        None
    }
}

/// Get video info and available formats from a URL using a single-pass yt-dlp invocation
#[tauri::command]
pub async fn get_video_info(app: AppHandle, url: String) -> Result<VideoInfo, String> {
    // Single-pass extraction with extractor-args for maximum speed and compatibility
    let output = crate::commands::engine::get_ytdlp_command(&app)?
        .args([
            "--dump-single-json",
            "--flat-playlist",
            "--no-warnings",
            "--no-check-certificates",
            "--extractor-args",
            "youtube:player_client=android,web,ios",
            &url,
        ])
        .output()
        .await
        .map_err(|e| format!("Failed to run yt-dlp: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let err_msg = if !stderr.is_empty() { stderr } else { stdout };
        return Err(format!("yt-dlp error: {}", err_msg.trim()));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let json: serde_json::Value = serde_json::from_str(stdout.trim())
        .map_err(|e| format!("Failed to parse yt-dlp output JSON: {e}"))?;

    let is_playlist_type = json["_type"].as_str() == Some("playlist");
    let has_entries = json["entries"].as_array().map_or(false, |a| !a.is_empty());
    let is_playlist = is_playlist_type || has_entries;

    let mut title = json["playlist_title"]
        .as_str()
        .or_else(|| json["title"].as_str())
        .unwrap_or("Unknown Title")
        .to_string();

    if title == "Unknown Title" && json["playlist"].is_string() {
        title = json["playlist"].as_str().unwrap().to_string();
    }

    // Best resolution thumbnail
    let thumbnail_url = {
        let mut best = json["thumbnail"].as_str().unwrap_or("").to_string();
        if best.is_empty() {
            if let Some(thumbs) = json["thumbnails"].as_array() {
                best = thumbs
                    .iter()
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

    let mut items = Vec::new();

    if is_playlist {
        if let Some(entries_arr) = json["entries"].as_array() {
            for e in entries_arr {
                let item_url = if let Some(u) = e["webpage_url"].as_str() {
                    u.to_string()
                } else if let Some(u) = e["url"].as_str() {
                    if u.starts_with("http") {
                        u.to_string()
                    } else if let Some(id) = e["id"].as_str() {
                        format!("https://www.youtube.com/watch?v={id}")
                    } else {
                        u.to_string()
                    }
                } else if let Some(id) = e["id"].as_str() {
                    format!("https://www.youtube.com/watch?v={id}")
                } else {
                    String::new()
                };

                if !item_url.is_empty() {
                    let item_thumb = {
                        let mut t = e["thumbnail"].as_str().unwrap_or("").to_string();
                        if t.is_empty() {
                            if let Some(thumbs) = e["thumbnails"].as_array() {
                                t = thumbs
                                    .iter()
                                    .filter_map(|x| x["url"].as_str())
                                    .last()
                                    .unwrap_or("")
                                    .to_string();
                            }
                        }
                        t
                    };

                    let item_duration_secs = e["duration"].as_f64().unwrap_or(0.0);
                    items.push(PlaylistItem {
                        title: e["title"].as_str().unwrap_or("Unknown").to_string(),
                        url: item_url,
                        thumbnail_url: item_thumb,
                        duration: format_duration(item_duration_secs),
                    });
                }
            }
        }
    }

    let mut final_thumbnail_url = thumbnail_url;
    if final_thumbnail_url.is_empty() && !items.is_empty() {
        final_thumbnail_url = items
            .iter()
            .find(|i| !i.thumbnail_url.is_empty())
            .map(|i| i.thumbnail_url.clone())
            .unwrap_or_default();
    }

    let final_playlist_count = if is_playlist {
        Some(json["playlist_count"].as_u64().map(|n| n as u32).unwrap_or(items.len() as u32))
    } else {
        None
    };

    let entries = if is_playlist && !items.is_empty() {
        Some(items)
    } else {
        None
    };

    let mut video_formats: Vec<VideoFormat> = Vec::new();
    let mut audio_formats: Vec<AudioFormat> = Vec::new();

    // 1. Harvest extracted formats from json["formats"] if present
    if let Some(formats) = json["formats"].as_array() {
        for f in formats.iter().rev() {
            let format_id = f["format_id"].as_str().unwrap_or("").to_string();
            let ext = f["ext"].as_str().unwrap_or("").to_string();
            let vcodec = f["vcodec"].as_str().unwrap_or("none");
            let acodec = f["acodec"].as_str().unwrap_or("none");

            // Audio streams
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
                let filesize = f["filesize"].as_u64()
                    .or_else(|| f["filesize_approx"].as_u64())
                    .or_else(|| bitrate.and_then(|br| estimate_filesize(br, duration_secs)));

                if !audio_formats.iter().any(|a| a.label == label) {
                    audio_formats.push(AudioFormat {
                        format_id: format!("audio-stream-{format_id}"),
                        label,
                        quality,
                        ext: ext.clone(),
                        bitrate,
                        filesize,
                    });
                }
            }

            // Video streams
            if vcodec != "none" {
                let height = f["height"].as_u64();
                let fps = f["fps"].as_f64();
                if let Some(h) = height {
                    let fps_label = fps.map(|fr| if fr > 30.0 { format!("{}fps", fr as u32) } else { String::new() }).unwrap_or_default();
                    let label = if fps_label.is_empty() { format!("{}p · {}", h, ext.to_uppercase()) } else { format!("{}p{} · {}", h, fps_label, ext.to_uppercase()) };
                    let quality = format!("{h}p");
                    let default_kbps = match h {
                        2160.. => 30000.0,
                        1440.. => 14000.0,
                        1080.. => 5000.0,
                        720.. => 2800.0,
                        480.. => 1400.0,
                        360.. => 800.0,
                        _ => 400.0,
                    };
                    let filesize = f["filesize"].as_u64()
                        .or_else(|| f["filesize_approx"].as_u64())
                        .or_else(|| estimate_filesize(default_kbps + 160.0, duration_secs));

                    if !video_formats.iter().any(|v| v.quality == quality) {
                        video_formats.push(VideoFormat { format_id, label, quality, ext, filesize });
                    }
                }
            }
        }
    }

    // 2. Inject standard high-definition quality presets (4K, 2K, 1080p, 720p, 480p, 360p, 240p)
    let standard_heights: &[(u64, &str, f64)] = &[
        (2160, "4K · 2160p (Ultra HD)", 30000.0),
        (1440, "2K · 1440p (Quad HD)", 14000.0),
        (1080, "1080p (Full HD)", 5000.0),
        (720, "720p (HD)", 2800.0),
        (480, "480p (Standard)", 1400.0),
        (360, "360p (Medium)", 800.0),
        (240, "240p (Data Saver)", 400.0),
    ];

    for &(h, label, kbps) in standard_heights {
        let quality = format!("{h}p");
        if !video_formats.iter().any(|v| v.quality == quality) {
            let filesize = estimate_filesize(kbps + 160.0, duration_secs);
            video_formats.push(VideoFormat {
                format_id: format!("bestvideo[height<={h}]+bestaudio/best[height<={h}]"),
                label: label.to_string(),
                quality: quality.clone(),
                ext: "mp4".to_string(),
                filesize,
            });
        }
    }

    // Sort video formats descending by resolution
    video_formats.sort_by(|a, b| {
        let parse = |s: &str| -> u32 {
            if s == "best" { 99999 }
            else { s.trim_end_matches('p').parse().unwrap_or(0) }
        };
        parse(&b.quality).cmp(&parse(&a.quality))
    });

    // Top resolution size for "Best Available"
    let top_size = video_formats.first().and_then(|v| v.filesize);

    // Always prepend "Best Available" at top
    video_formats.insert(0, VideoFormat {
        format_id: "bestvideo+bestaudio/best".to_string(),
        label: "Best Available (Highest Quality)".to_string(),
        quality: "best".to_string(),
        ext: "mp4".to_string(),
        filesize: top_size,
    });

    // Populate Audio options with unique format IDs and estimated file sizes
    let audio_presets = [
        ("audio-best", "Best Audio (Auto Best Quality)", "audio-best", "mp3", Some(320.0), 320.0),
        ("audio-opus", "OPUS (Best Quality & Efficiency)", "audio-opus", "opus", Some(160.0), 160.0),
        ("audio-mp3", "MP3 320kbps (Universal Device Compatible)", "audio-mp3", "mp3", Some(320.0), 320.0),
        ("audio-m4a", "M4A / AAC (Apple & High Fidelity)", "audio-m4a", "m4a", Some(256.0), 256.0),
        ("audio-flac", "FLAC (Lossless Studio Master)", "audio-flac", "flac", None, 800.0),
        ("audio-wav", "WAV (Uncompressed Studio PCM)", "audio-wav", "wav", None, 1411.0),
    ];

    for (fid, label, qual, ext, br, est_kbps) in audio_presets.iter().rev() {
        if !audio_formats.iter().any(|a| a.quality == *qual) {
            let filesize = estimate_filesize(*est_kbps, duration_secs);
            audio_formats.insert(0, AudioFormat {
                format_id: fid.to_string(),
                label: label.to_string(),
                quality: qual.to_string(),
                ext: ext.to_string(),
                bitrate: *br,
                filesize,
            });
        }
    }

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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_duration_short() {
        assert_eq!(format_duration(45.0), "00:45");
        assert_eq!(format_duration(125.0), "02:05");
    }

    #[test]
    fn test_format_duration_long() {
        assert_eq!(format_duration(3665.0), "01:01:05");
        assert_eq!(format_duration(7200.0), "02:00:00");
    }

    #[test]
    fn test_estimate_filesize() {
        let size = estimate_filesize(5000.0, 60.0);
        assert!(size.is_some());
        // 5000 kbps * 60s / 8 = 37,500,000 bytes (~37.5 MB)
        assert_eq!(size.unwrap(), 37_500_000);
    }
}
