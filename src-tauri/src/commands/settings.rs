use serde::{Deserialize, Serialize};
use std::fs;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct AppSettings {
    pub default_output_path: String,
    pub default_format: String,
    pub embed_thumbnail: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct HistoryItem {
    pub id: String,
    pub url: String,
    pub title: String,
    pub format: String,
    pub output_path: Option<String>,
    #[serde(alias = "completedAt", default = "default_timestamp")]
    pub timestamp: String,
}

fn default_timestamp() -> String {
    "1970-01-01T00:00:00Z".to_string()
}

fn history_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Cannot get app data dir: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| format!("Cannot create app data dir: {e}"))?;
    Ok(dir.join("history.json"))
}

fn settings_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Cannot get app data dir: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| format!("Cannot create app data dir: {e}"))?;
    Ok(dir.join("settings.json"))
}

/// Persist the in-memory history to disk
pub fn persist_history(app: &AppHandle) -> Result<(), String> {
    let state = app
        .try_state::<crate::AppState>()
        .ok_or("AppState not found")?;
    let history = state.download_history.lock().unwrap();
    let path = history_path(app)?;
    let json = serde_json::to_string_pretty(&*history)
        .map_err(|e| format!("Serialize error: {e}"))?;
    fs::write(&path, json).map_err(|e| format!("Write error: {e}"))?;
    Ok(())
}

#[tauri::command]
pub async fn get_download_history(app: AppHandle) -> Result<Vec<HistoryItem>, String> {
    let path = history_path(&app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let content = fs::read_to_string(&path).map_err(|e| format!("Read error: {e}"))?;
    
    // Try strict parse first
    if let Ok(items) = serde_json::from_str::<Vec<HistoryItem>>(&content) {
        return Ok(items);
    }
    
    // Fallback: parse as raw JSON array and skip malformed entries
    let raw_arr: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Parse error: {e}"))?;
    
    if let Some(arr) = raw_arr.as_array() {
        let items: Vec<HistoryItem> = arr
            .iter()
            .filter_map(|entry| {
                // Try to deserialize each entry, silently skip bad ones
                serde_json::from_value::<HistoryItem>(entry.clone()).ok()
            })
            .collect();
        Ok(items)
    } else {
        Ok(Vec::new())
    }
}

#[tauri::command]
pub async fn clear_download_history(app: AppHandle) -> Result<(), String> {
    let state = app
        .try_state::<crate::AppState>()
        .ok_or("AppState not found")?;
    let mut history = state.download_history.lock().unwrap();
    history.clear();
    drop(history);
    persist_history(&app)
}

/// Save a single history item and persist to disk
pub fn save_history_item(app: AppHandle, item: HistoryItem) -> Result<(), String> {
    let state = app
        .try_state::<crate::AppState>()
        .ok_or("AppState not found")?;
    let mut history = state.download_history.lock().unwrap();
    history.push(item);
    drop(history);
    persist_history(&app)
}

#[tauri::command]
pub async fn get_settings(app: AppHandle) -> Result<AppSettings, String> {
    let path = settings_path(&app)?;
    if !path.exists() {
        return Ok(AppSettings::default());
    }
    let content = fs::read_to_string(&path).map_err(|e| format!("Read error: {e}"))?;
    let settings: AppSettings =
        serde_json::from_str(&content).map_err(|e| format!("Parse error: {e}"))?;
    Ok(settings)
}

#[tauri::command]
pub async fn save_settings(app: AppHandle, settings: AppSettings) -> Result<(), String> {
    let path = settings_path(&app)?;
    let json =
        serde_json::to_string_pretty(&settings).map_err(|e| format!("Serialize error: {e}"))?;
    fs::write(&path, json).map_err(|e| format!("Write error: {e}"))?;
    Ok(())
}
