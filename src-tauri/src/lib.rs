use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use commands::settings::HistoryItem;

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};
use tauri_plugin_shell::process::CommandChild;

pub mod commands;

/// Shared application state
pub struct AppState {
    pub download_history: Arc<Mutex<Vec<HistoryItem>>>,
    pub active_downloads: Arc<Mutex<HashMap<String, CommandChild>>>,
    pub stopped_downloads: Arc<Mutex<HashMap<String, String>>>,
    pub download_semaphore: Arc<tokio::sync::Semaphore>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let state = AppState {
        download_history: Arc::new(Mutex::new(Vec::new())),
        active_downloads: Arc::new(Mutex::new(HashMap::new())),
        stopped_downloads: Arc::new(Mutex::new(HashMap::new())),
        download_semaphore: Arc::new(tokio::sync::Semaphore::new(5)),
    };

    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .filter(|metadata| !metadata.target().starts_with("tao::"))
                .build(),
        )
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();

                for arg in args {
                    if arg.starts_with("flowgrab://") || arg.starts_with("flowgrab:") {
                        let clean = arg
                            .trim_start_matches("flowgrab://")
                            .trim_start_matches("flowgrab:")
                            .trim_matches('"')
                            .trim();
                        if !clean.is_empty() {
                            let _ = window.emit("app://open-url", clean);
                            break;
                        }
                    } else if arg.starts_with("videodownloader://") || arg.starts_with("videodownloader:") {
                        let clean = arg
                            .trim_start_matches("videodownloader://")
                            .trim_start_matches("videodownloader:")
                            .trim_matches('"')
                            .trim();
                        if !clean.is_empty() {
                            let _ = window.emit("app://open-url", clean);
                            break;
                        }
                    } else if arg.starts_with("http://") || arg.starts_with("https://") {
                        let _ = window.emit("app://open-url", arg.trim_matches('"').trim());
                        break;
                    }
                }
            }
        }))
        .setup(|app| {
            // Initialize in-memory history from disk so history is never lost on restart
            let initial_history = commands::settings::load_initial_history(app.handle());
            let state = app.state::<AppState>();
            *state.download_history.lock().unwrap() = initial_history;

            // Check initial startup args for deep link
            let cli_args: Vec<String> = std::env::args().collect();
            for arg in cli_args {
                if arg.starts_with("flowgrab://")
                    || arg.starts_with("flowgrab:")
                    || arg.starts_with("videodownloader://")
                    || arg.starts_with("videodownloader:")
                {
                    let clean = arg
                        .trim_start_matches("flowgrab://")
                        .trim_start_matches("flowgrab:")
                        .trim_start_matches("videodownloader://")
                        .trim_start_matches("videodownloader:")
                        .trim_matches('"')
                        .trim()
                        .to_string();
                    if !clean.is_empty() {
                        let app_handle = app.handle().clone();
                        tauri::async_runtime::spawn(async move {
                            tokio::time::sleep(tokio::time::Duration::from_millis(800)).await;
                            if let Some(w) = app_handle.get_webview_window("main") {
                                let _ = w.emit("app://open-url", clean);
                            }
                        });
                        break;
                    }
                }
            }

            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app: &AppHandle, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            commands::video::get_video_info,
            commands::download::start_download,
            commands::download::cancel_download,
            commands::settings::get_download_history,
            commands::settings::clear_download_history,
            commands::settings::get_settings,
            commands::settings::save_settings,
            commands::update::get_ytdlp_version,
            commands::update::update_yt_dlp,
            commands::update::get_ffmpeg_version,
            commands::update::install_app_update,
            commands::explorer::open_in_file_explorer,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
