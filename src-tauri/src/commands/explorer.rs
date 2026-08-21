use std::path::Path;

#[tauri::command]
pub async fn open_in_file_explorer(path: String) -> Result<(), String> {
    let p = Path::new(&path);

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        if p.is_file() {
            // Select the file in explorer
            std::process::Command::new("explorer")
                .args(["/select,", &path])
                .creation_flags(CREATE_NO_WINDOW)
                .spawn()
                .map_err(|e| format!("Failed to open file in explorer: {e}"))?;
        } else if p.is_dir() {
            // Open the directory
            std::process::Command::new("explorer")
                .arg(&path)
                .creation_flags(CREATE_NO_WINDOW)
                .spawn()
                .map_err(|e| format!("Failed to open folder in explorer: {e}"))?;
        } else if let Some(parent) = p.parent() {
            if parent.exists() {
                std::process::Command::new("explorer")
                    .arg(parent)
                    .creation_flags(CREATE_NO_WINDOW)
                    .spawn()
                    .map_err(|e| format!("Failed to open folder in explorer: {e}"))?;
            } else {
                return Err("Path does not exist on disk".to_string());
            }
        } else {
            return Err("Path does not exist on disk".to_string());
        }
    }

    #[cfg(target_os = "macos")]
    {
        if p.exists() {
            std::process::Command::new("open")
                .args(["-R", &path])
                .spawn()
                .map_err(|e| format!("Failed to open file in Finder: {e}"))?;
        } else {
            return Err("Path does not exist on disk".to_string());
        }
    }

    #[cfg(target_os = "linux")]
    {
        let target = if p.is_file() {
            p.parent().unwrap_or(p)
        } else {
            p
        };
        std::process::Command::new("xdg-open")
            .arg(target)
            .spawn()
            .map_err(|e| format!("Failed to open file manager: {e}"))?;
    }

    Ok(())
}
