mod history;
mod reader;
mod watcher;

use std::sync::Mutex;
use watcher::TailWatcher;

struct AppState {
    watcher: Mutex<TailWatcher>,
}

#[tauri::command]
fn start_tail(
    state: tauri::State<'_, AppState>,
    app_handle: tauri::AppHandle,
    path: String,
) -> Result<(), String> {
    history::add_to_history(&app_handle, &path);
    let mut w = state.watcher.lock().map_err(|e| e.to_string())?;
    w.start(app_handle, path)
}

#[tauri::command]
fn stop_tail(state: tauri::State<'_, AppState>) -> Result<(), String> {
    let mut w = state.watcher.lock().map_err(|e| e.to_string())?;
    w.stop();
    Ok(())
}

#[tauri::command]
fn set_poll_interval(state: tauri::State<'_, AppState>, ms: u64) -> Result<(), String> {
    let w = state.watcher.lock().map_err(|e| e.to_string())?;
    w.set_poll_interval(ms);
    Ok(())
}

#[tauri::command]
fn get_history(app_handle: tauri::AppHandle) -> Vec<history::HistoryEntry> {
    history::get_history(&app_handle)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .manage(AppState {
            watcher: Mutex::new(TailWatcher::new()),
        })
        .invoke_handler(tauri::generate_handler![start_tail, stop_tail, set_poll_interval, get_history])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
