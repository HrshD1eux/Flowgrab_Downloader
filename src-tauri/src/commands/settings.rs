use serde::{Deserialize, Serialize};
use std::fs;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    #[serde(default)]
    pub default_output_path: String,
    #[serde(default = "default_video_format")]
    pub default_format: String,
    #[serde(default = "default_audio_format")]
    pub default_audio_format: String,
    #[serde(default = "default_embed_thumbnail")]
    pub embed_thumbnail: bool,
    #[serde(default)]
    pub auto_reset_on_finish: bool,
}

fn default_video_format() -> String {
    "mp4".to_string()
}

fn default_audio_format() -> String {
    "opus".to_string()
}

fn default_embed_thumbnail() -> bool {
    true
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            default_output_path: String::new(),
            default_format: default_video_format(),
            default_audio_format: default_audio_format(),
            embed_thumbnail: default_embed_thumbnail(),
            auto_reset_on_finish: false,
        }
    }
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

pub fn history_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Cannot get app data dir: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| format!("Cannot create app data dir: {e}"))?;
    Ok(dir.join("history.json"))
}

pub fn settings_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Cannot get app data dir: {e}"))?;
    fs::create_dir_all(&dir).map_err(|e| format!("Cannot create app data dir: {e}"))?;
    Ok(dir.join("settings.json"))
}

/// Load history items from disk on startup or when needed
pub fn load_initial_history(app: &AppHandle) -> Vec<HistoryItem> {
    let path = match history_path(app) {
        Ok(p) => p,
        Err(e) => {
            log::warn!("Failed to resolve history path: {e}");
            return Vec::new();
        }
    };

    if !path.exists() {
        return Vec::new();
    }

    let content = match fs::read_to_string(&path) {
        Ok(c) => c,
        Err(e) => {
            log::warn!("Failed to read history file: {e}");
            return Vec::new();
        }
    };

    if let Ok(items) = serde_json::from_str::<Vec<HistoryItem>>(&content) {
        return items;
    }

    // Fallback: parse raw array and skip malformed entries
    if let Ok(raw_arr) = serde_json::from_str::<serde_json::Value>(&content) {
        if let Some(arr) = raw_arr.as_array() {
            return arr
                .iter()
                .filter_map(|entry| serde_json::from_value::<HistoryItem>(entry.clone()).ok())
                .collect();
        }
    }

    Vec::new()
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
    let disk_items = load_initial_history(&app);

    // Keep in-memory state in sync
    if let Some(state) = app.try_state::<crate::AppState>() {
        let mut history = state.download_history.lock().unwrap();
        *history = disk_items.clone();
    }

    Ok(disk_items)
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

    // If in-memory is empty, reload from disk first to prevent overwriting previous history
    if history.is_empty() {
        let disk_items = load_initial_history(&app);
        if !disk_items.is_empty() {
            *history = disk_items;
        }
    }

    // Avoid duplicate insertions for the same download ID
    if !history.iter().any(|h| h.id == item.id) {
        history.push(item);
    }

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
