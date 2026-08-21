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

/// Resolve ffmpeg directory across dev and production environments
pub fn get_ffmpeg_dir(app: &AppHandle) -> Result<String, String> {
    let resolver = app.path();
    let resource_dir = resolver
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {e}"))?;

    let mut ffmpeg_dir = resource_dir.clone();
    ffmpeg_dir.push("resources");

    let exe_name = if cfg!(windows) { "ffmpeg.exe" } else { "ffmpeg" };
    let mut exe_test = ffmpeg_dir.clone();
    exe_test.push(exe_name);

    if !exe_test.exists() {
        let mut alt_test = resource_dir.clone();
        alt_test.push(exe_name);
        if alt_test.exists() {
            ffmpeg_dir = resource_dir;
        }
    }

    Ok(ffmpeg_dir.to_string_lossy().to_string())
}
