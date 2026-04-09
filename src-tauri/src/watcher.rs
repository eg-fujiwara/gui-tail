use crate::reader::TailReader;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

pub struct TailWatcher {
    stop_signal: Option<Arc<AtomicBool>>,
    poll_interval_ms: Arc<AtomicU64>,
    thread_handle: Option<thread::JoinHandle<()>>,
}

impl TailWatcher {
    pub fn new() -> Self {
        Self {
            stop_signal: None,
            poll_interval_ms: Arc::new(AtomicU64::new(1000)),
            thread_handle: None,
        }
    }

    pub fn set_poll_interval(&self, ms: u64) {
        self.poll_interval_ms.store(ms, Ordering::Relaxed);
    }

    pub fn start(
        &mut self,
        app_handle: AppHandle,
        file_path: String,
    ) -> Result<(), String> {
        self.stop();

        let path = PathBuf::from(&file_path);
        if !path.exists() {
            return Err(format!("File not found: {}", file_path));
        }

        let mut reader = TailReader::new(path.clone());

        let initial_lines = reader
            .init_at_end(100)
            .map_err(|e| format!("Failed to read file: {}", e))?;

        if !initial_lines.is_empty() {
            app_handle.emit("tail-lines", &initial_lines).ok();
        }

        let stop = Arc::new(AtomicBool::new(false));
        let stop_clone = stop.clone();
        let interval = self.poll_interval_ms.clone();

        let handle = thread::spawn(move || {
            loop {
                if stop_clone.load(Ordering::Relaxed) {
                    break;
                }

                let ms = interval.load(Ordering::Relaxed);
                thread::sleep(Duration::from_millis(ms));

                match reader.read_new_lines() {
                    Ok(lines) if !lines.is_empty() => {
                        app_handle.emit("tail-lines", &lines).ok();
                    }
                    Err(e) => {
                        app_handle
                            .emit("tail-error", format!("{}", e))
                            .ok();
                    }
                    _ => {}
                }
            }
        });

        self.stop_signal = Some(stop);
        self.thread_handle = Some(handle);

        Ok(())
    }

    pub fn stop(&mut self) {
        if let Some(signal) = self.stop_signal.take() {
            signal.store(true, Ordering::Relaxed);
        }
        if let Some(handle) = self.thread_handle.take() {
            handle.join().ok();
        }
    }
}
