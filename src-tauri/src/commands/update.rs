use tauri::{AppHandle, Manager};
use tauri_plugin_shell::ShellExt;

#[tauri::command]
pub async fn update_yt_dlp(app: AppHandle) -> Result<String, String> {
    let resolver = app.path();
    let resource_dir = resolver
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {e}"))?;
    
    let mut ffmpeg_path = resource_dir.clone();
    ffmpeg_path.push("resources");
    let ffmpeg_dir = ffmpeg_path.to_string_lossy().to_string();

    let output = app
        .shell()
        .sidecar("yt-dlp")
        .map_err(|e| format!("Failed to find yt-dlp sidecar: {e}"))?
        .args(["-U", "--ffmpeg-location", &ffmpeg_dir])
        .output()
        .await
        .map_err(|e| format!("Failed to run update: {e}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if output.status.success() {
        Ok(stdout)
    } else {
        Err(format!("Update failed: {} {}", stdout, stderr))
    }
}
