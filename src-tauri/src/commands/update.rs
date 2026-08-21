use std::fs;
use tauri::{AppHandle, Manager};
use tauri_plugin_shell::ShellExt;
use crate::commands::engine::{get_ffmpeg_dir, get_user_ytdlp_path};

#[tauri::command]
pub async fn get_ytdlp_version(app: AppHandle) -> Result<String, String> {
    let output = crate::commands::engine::get_ytdlp_command(&app)?
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
pub async fn update_yt_dlp(app: AppHandle) -> Result<String, String> {
    let ffmpeg_dir = get_ffmpeg_dir(&app).unwrap_or_default();
    let user_ytdlp = get_user_ytdlp_path(&app)?;

    // Ensure bin folder in AppData exists
    if let Some(parent) = user_ytdlp.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create bin dir: {e}"))?;
    }

    // If user-level binary doesn't exist yet, attempt to bootstrap from bundled sidecar
    if !user_ytdlp.exists() {
        if let Ok(resource_dir) = app.path().resource_dir() {
            let possible_sidecar_names = [
                "binaries/yt-dlp-x86_64-pc-windows-msvc.exe",
                "yt-dlp-x86_64-pc-windows-msvc.exe",
                "binaries/yt-dlp",
                "yt-dlp",
            ];
            for name in possible_sidecar_names {
                let candidate = resource_dir.join(name);
                if candidate.exists() {
                    let _ = fs::copy(&candidate, &user_ytdlp);
                    break;
                }
            }
        }
    }

    // Execute update on the user-writable binary if available
    let output = if user_ytdlp.exists() {
        log::info!("Updating yt-dlp at: {:?}", user_ytdlp);
        let mut args = vec!["-U".to_string()];
        if !ffmpeg_dir.is_empty() {
            args.push("--ffmpeg-location".to_string());
            args.push(ffmpeg_dir.clone());
        }

        app.shell()
            .command(user_ytdlp.to_string_lossy().to_string())
            .args(args)
            .output()
            .await
            .map_err(|e| format!("Failed to run update on user binary: {e}"))?
    } else {
        // Fallback to sidecar invocation
        log::info!("Updating yt-dlp via sidecar");
        let mut args = vec!["-U".to_string()];
        if !ffmpeg_dir.is_empty() {
            args.push("--ffmpeg-location".to_string());
            args.push(ffmpeg_dir.clone());
        }

        app.shell()
            .sidecar("yt-dlp")
            .map_err(|e| format!("Failed to find yt-dlp sidecar: {e}"))?
            .args(args)
            .output()
            .await
            .map_err(|e| format!("Failed to run sidecar update: {e}"))?
    };

    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();

    if output.status.success() {
        let msg = if !stdout.is_empty() {
            stdout
        } else {
            "yt-dlp engine updated successfully.".to_string()
        };
        Ok(msg)
    } else {
        Err(format!("Update failed: {} {}", stdout, stderr).trim().to_string())
    }
}
