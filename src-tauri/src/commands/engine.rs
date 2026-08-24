use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use tauri_plugin_shell::process::Command;
use tauri_plugin_shell::ShellExt;

/// Get the path to the user-writable yt-dlp binary inside app_data_dir/bin
pub fn get_user_ytdlp_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Cannot get app data dir: {e}"))?;
    let bin_dir = dir.join("bin");
    let exe_name = if cfg!(windows) { "yt-dlp.exe" } else { "yt-dlp" };
    Ok(bin_dir.join(exe_name))
}

/// Returns a Command instance for yt-dlp.
/// Checks if an updated user-level binary exists in app_data_dir/bin;
/// if so, executes it via shell command. Otherwise falls back to the bundled sidecar.
pub fn get_ytdlp_command(app: &AppHandle) -> Result<Command, String> {
    if let Ok(user_bin) = get_user_ytdlp_path(app) {
        if user_bin.exists() {
            log::info!("Using user-updated yt-dlp binary at: {:?}", user_bin);
            return Ok(app.shell().command(user_bin.to_string_lossy().to_string()));
        }
    }

    log::info!("Using bundled yt-dlp sidecar");
    app.shell()
        .sidecar("yt-dlp")
        .map_err(|e| format!("Failed to resolve yt-dlp sidecar: {e}"))
}

/// Resolve ffmpeg directory across user AppData, bundled resources, and dev environments
pub fn get_ffmpeg_dir(app: &AppHandle) -> Result<String, String> {
    let exe_name = if cfg!(windows) { "ffmpeg.exe" } else { "ffmpeg" };

    // 1. Check user AppData/bin folder first
    if let Ok(app_data) = app.path().app_data_dir() {
        let user_bin = app_data.join("bin");
        if user_bin.join(exe_name).exists() {
            return Ok(user_bin.to_string_lossy().to_string());
        }
    }

    // 2. Check bundled resources directory
    if let Ok(resource_dir) = app.path().resource_dir() {
        let resources_sub = resource_dir.join("resources");
        if resources_sub.join(exe_name).exists() {
            return Ok(resources_sub.to_string_lossy().to_string());
        }
        if resource_dir.join(exe_name).exists() {
            return Ok(resource_dir.to_string_lossy().to_string());
        }
    }

    Ok(String::new())
}

/// Returns a Command instance for ffmpeg
pub fn get_ffmpeg_command(app: &AppHandle) -> Result<Command, String> {
    let ffmpeg_dir = get_ffmpeg_dir(app).unwrap_or_default();
    let exe_name = if cfg!(windows) { "ffmpeg.exe" } else { "ffmpeg" };
    if !ffmpeg_dir.is_empty() {
        let full_path = std::path::Path::new(&ffmpeg_dir).join(exe_name);
        if full_path.exists() {
            return Ok(app.shell().command(full_path.to_string_lossy().to_string()));
        }
    }

    // Fallback to system ffmpeg command
    Ok(app.shell().command("ffmpeg"))
}
