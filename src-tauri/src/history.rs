use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Serialize, Deserialize, Default)]
struct History {
    entries: Vec<HistoryEntry>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct HistoryEntry {
    pub path: String,
    pub last_opened: String,
}

const MAX_HISTORY: usize = 50;

fn history_file_path(app_handle: &AppHandle) -> PathBuf {
    let dir = app_handle
        .path()
        .app_data_dir()
        .expect("failed to get app data dir");
    fs::create_dir_all(&dir).ok();
    dir.join("history.json")
}

fn load_history(app_handle: &AppHandle) -> History {
    let path = history_file_path(app_handle);
    match fs::read_to_string(&path) {
        Ok(data) => serde_json::from_str(&data).unwrap_or_default(),
        Err(_) => History::default(),
    }
}

fn save_history(app_handle: &AppHandle, history: &History) {
    let path = history_file_path(app_handle);
    if let Ok(data) = serde_json::to_string_pretty(history) {
        fs::write(path, data).ok();
    }
}

pub fn add_to_history(app_handle: &AppHandle, file_path: &str) {
    let mut history = load_history(app_handle);

    // Remove existing entry for this path (dedup)
    history.entries.retain(|e| e.path != file_path);

    // Prepend new entry
    let now = chrono_now();
    history.entries.insert(
        0,
        HistoryEntry {
            path: file_path.to_string(),
            last_opened: now,
        },
    );

    // Cap at max entries
    history.entries.truncate(MAX_HISTORY);

    save_history(app_handle, &history);
}

pub fn get_history(app_handle: &AppHandle) -> Vec<HistoryEntry> {
    load_history(app_handle).entries
}

fn chrono_now() -> String {
    // Simple ISO 8601 without external crate
    use std::time::SystemTime;
    let duration = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default();
    let secs = duration.as_secs();
    // Format as Unix timestamp string (sufficient for ordering)
    format!("{secs}")
}
