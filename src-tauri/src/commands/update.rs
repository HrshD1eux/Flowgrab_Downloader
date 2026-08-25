use std::fs;
use futures_util::StreamExt;
use serde::Serialize;
use tauri::{AppHandle, Emitter};
use tokio::io::AsyncWriteExt;
use crate::commands::engine::{get_ffmpeg_command, get_user_ytdlp_path, get_ytdlp_command};

#[derive(Debug, Serialize, Clone)]
pub struct AppUpdateProgress {
    pub percent: f64,
    pub bytes_downloaded: u64,
    pub total_bytes: u64,
    pub status: String,
}

#[tauri::command]
pub async fn get_ytdlp_version(app: AppHandle) -> Result<String, String> {
    let output = get_ytdlp_command(&app)?
        .args(["--version"])
        .output()
        .await
        .map_err(|e| format!("Failed to get yt-dlp version: {e}"))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        Ok(stdout)
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        Err(format!("Error reading version: {stderr}"))
    }
}

#[tauri::command]
pub async fn get_ffmpeg_version(app: AppHandle) -> Result<String, String> {
    let output = get_ffmpeg_command(&app)?
        .args(["-version"])
        .output()
        .await
        .map_err(|e| format!("FFmpeg not found: {e}"))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let first_line = stdout.lines().next().unwrap_or("FFmpeg Installed").trim().to_string();
        Ok(first_line)
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        Err(format!("Error reading FFmpeg version: {stderr}"))
    }
}

#[tauri::command]
pub async fn update_yt_dlp(app: AppHandle) -> Result<String, String> {
    let target_path = get_user_ytdlp_path(&app)?;

    if let Some(parent) = target_path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create bin dir: {e}"))?;
    }

    let download_url = if cfg!(target_os = "windows") {
        "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
    } else if cfg!(target_os = "macos") {
        "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos"
    } else {
        "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp"
    };

    log::info!("Downloading latest yt-dlp binary from: {download_url}");

    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) VideoDownloader/1.1.2")
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {e}"))?;

    let response = client
        .get(download_url)
        .send()
        .await
        .map_err(|e| format!("Failed to connect to GitHub releases: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("Download failed with HTTP status: {}", response.status()));
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read binary data: {e}"))?;

    if bytes.len() < 100_000 {
        return Err("Downloaded binary file is invalid or too small.".to_string());
    }

    let tmp_path = target_path.with_extension("tmp");
    fs::write(&tmp_path, &bytes).map_err(|e| format!("Failed to write temporary binary: {e}"))?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = fs::set_permissions(&tmp_path, fs::Permissions::from_mode(0o755));
    }

    if target_path.exists() {
        let _ = fs::remove_file(&target_path);
    }

    fs::rename(&tmp_path, &target_path)
        .map_err(|e| format!("Failed to save updated binary: {e}"))?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = fs::set_permissions(&target_path, fs::Permissions::from_mode(0o755));
    }

    // Verify and read the newly installed version
    let new_version = get_ytdlp_version(app).await.unwrap_or_else(|_| "latest".to_string());

    Ok(format!("Successfully updated yt-dlp engine to v{new_version}."))
}

#[tauri::command]
pub async fn install_app_update(app: AppHandle, download_url: String) -> Result<String, String> {
    if download_url.is_empty() {
        return Err("Download URL is empty.".to_string());
    }

    log::info!("Downloading official update installer from: {download_url}");

    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) VideoDownloader/Updater")
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {e}"))?;

    let response = client
        .get(&download_url)
        .send()
        .await
        .map_err(|e| format!("Failed to connect to installer URL: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("Installer download failed with HTTP status: {}", response.status()));
    }

    let total_bytes = response.content_length().unwrap_or(0);
    let mut downloaded: u64 = 0;

    let temp_dir = std::env::temp_dir();
    let file_name = if download_url.ends_with(".msi") {
        "Video_Downloader_Update_Setup.msi"
    } else if cfg!(windows) {
        "Video_Downloader_Update_Setup.exe"
    } else {
        "Video_Downloader_Update.deb"
    };
    let installer_path = temp_dir.join(file_name);

    let mut stream = response.bytes_stream();
    let mut file = tokio::fs::File::create(&installer_path)
        .await
        .map_err(|e| format!("Failed to create temporary installer file: {e}"))?;

    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result.map_err(|e| format!("Error reading download stream: {e}"))?;
        file.write_all(&chunk)
            .await
            .map_err(|e| format!("Error writing installer data: {e}"))?;

        downloaded += chunk.len() as u64;
        let percent = if total_bytes > 0 {
            (downloaded as f64 / total_bytes as f64) * 100.0
        } else {
            0.0
        };

        let _ = app.emit("app-update://progress", AppUpdateProgress {
            percent,
            bytes_downloaded: downloaded,
            total_bytes,
            status: "downloading".to_string(),
        });
    }

    file.flush()
        .await
        .map_err(|e| format!("Failed to finalize installer file: {e}"))?;

    let _ = app.emit("app-update://progress", AppUpdateProgress {
        percent: 100.0,
        bytes_downloaded: downloaded,
        total_bytes,
        status: "launching".to_string(),
    });

    log::info!("Installer downloaded successfully to {:?}. Executing...", installer_path);

    #[cfg(windows)]
    {
        if installer_path.extension().and_then(|e| e.to_str()) == Some("msi") {
            let _ = std::process::Command::new("msiexec")
                .args(["/i", &installer_path.to_string_lossy()])
                .spawn();
        } else {
            let _ = std::process::Command::new(&installer_path).spawn();
        }

        tokio::time::sleep(tokio::time::Duration::from_millis(800)).await;
        app.exit(0);
    }

    Ok("Update downloaded and installer initiated.".to_string())
}
