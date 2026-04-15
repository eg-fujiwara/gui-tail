use std::fs::File;
use std::io::{self, Read, Seek, SeekFrom};
use std::path::PathBuf;

pub struct TailReader {
    path: PathBuf,
    offset: u64,
    file: Option<File>,
}

impl TailReader {
    pub fn new(path: PathBuf) -> Self {
        Self {
            path,
            offset: 0,
            file: None,
        }
    }

    /// Open (or reopen) the file handle.
    fn open_file(&mut self) -> io::Result<()> {
        let file = File::open(&self.path)?;
        self.file = Some(file);
        Ok(())
    }

    /// Read the last `initial_lines` lines from the file and set offset to the end.
    /// Uses a seek-from-end approach to avoid reading the entire file.
    pub fn init_at_end(&mut self, initial_lines: usize) -> io::Result<Vec<String>> {
        self.open_file()?;
        let file = self.file.as_ref().unwrap();
        let file_len = file.metadata()?.len();

        if file_len == 0 {
            self.offset = 0;
            return Ok(Vec::new());
        }

        // Read a chunk from the end of the file to find the last N lines.
        // Start with 8KB and double if we don't find enough lines.
        let mut chunk_size: u64 = 8 * 1024;
        let mut lines: Vec<String>;

        loop {
            let start = if file_len > chunk_size {
                file_len - chunk_size
            } else {
                0
            };

            let file = self.file.as_mut().unwrap();
            file.seek(SeekFrom::Start(start))?;

            let mut buf = Vec::with_capacity(chunk_size as usize);
            file.read_to_end(&mut buf)?;

            let text = String::from_utf8_lossy(&buf);
            lines = text.lines().map(|l| l.to_string()).collect();

            // If we started mid-file, the first "line" may be partial — drop it
            if start > 0 && !lines.is_empty() {
                lines.remove(0);
            }

            // If we have enough lines or already read the whole file, stop
            if lines.len() >= initial_lines || start == 0 {
                break;
            }

            // Double the chunk and retry
            chunk_size = (chunk_size * 2).min(file_len);
        }

        self.offset = file_len;

        // Take only the last N lines
        if lines.len() > initial_lines {
            lines = lines.split_off(lines.len() - initial_lines);
        }

        Ok(lines)
    }

    /// Read only new lines appended since last read.
    /// Reuses the open file handle to avoid triggering antivirus scans on every poll.
    pub fn read_new_lines(&mut self) -> io::Result<Vec<String>> {
        // Reopen if we don't have a handle (first call or after error)
        if self.file.is_none() {
            self.open_file()?;
        }

        let file = self.file.as_ref().unwrap();
        let file_len = file.metadata()?.len();

        // File was truncated or replaced — reopen and reset
        if file_len < self.offset {
            self.open_file()?;
            self.offset = 0;
        }

        if file_len == self.offset {
            return Ok(Vec::new());
        }

        let file = self.file.as_mut().unwrap();
        file.seek(SeekFrom::Start(self.offset))?;

        let mut new_data = Vec::new();
        file.read_to_end(&mut new_data)?;

        // Only process complete lines (ending with \n)
        // Keep incomplete data for next read
        let last_newline = new_data.iter().rposition(|&b| b == b'\n');

        let process_len = match last_newline {
            Some(pos) => pos + 1,
            None => {
                // No complete line yet — don't advance offset
                return Ok(Vec::new());
            }
        };

        self.offset += process_len as u64;

        let text = String::from_utf8_lossy(&new_data[..process_len]);
        let lines: Vec<String> = text
            .lines()
            .map(|l| l.to_string())
            .collect();

        Ok(lines)
    }
}
