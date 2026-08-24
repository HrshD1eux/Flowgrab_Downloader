use std::fs;
use tauri::AppHandle;
use crate::commands::engine::{get_ffmpeg_command, get_user_ytdlp_path, get_ytdlp_command};

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
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) VideoDownloader/1.1.1")
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
