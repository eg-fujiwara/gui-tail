use std::fs::File;
use std::io::{self, BufRead, BufReader, Read, Seek, SeekFrom};
use std::path::PathBuf;

pub struct TailReader {
    path: PathBuf,
    offset: u64,
}

impl TailReader {
    pub fn new(path: PathBuf) -> Self {
        Self { path, offset: 0 }
    }

    /// Read the last `initial_lines` lines from the file and set offset to the end.
    pub fn init_at_end(&mut self, initial_lines: usize) -> io::Result<Vec<String>> {
        let file = File::open(&self.path)?;
        let file_len = file.metadata()?.len();

        if file_len == 0 {
            self.offset = 0;
            return Ok(Vec::new());
        }

        // Read entire file to find last N lines (simple approach for initial load)
        let mut reader = BufReader::new(file);
        let mut all_lines = Vec::new();
        let mut line = String::new();

        while reader.read_line(&mut line)? > 0 {
            let trimmed = line.trim_end_matches(|c| c == '\n' || c == '\r').to_string();
            all_lines.push(trimmed);
            line.clear();
        }

        self.offset = file_len;

        let start = if all_lines.len() > initial_lines {
            all_lines.len() - initial_lines
        } else {
            0
        };

        Ok(all_lines.split_off(start))
    }

    /// Read only new lines appended since last read.
    pub fn read_new_lines(&mut self) -> io::Result<Vec<String>> {
        let file = File::open(&self.path)?;
        let file_len = file.metadata()?.len();

        // File was truncated — reset to beginning
        if file_len < self.offset {
            self.offset = 0;
        }

        if file_len == self.offset {
            return Ok(Vec::new());
        }

        let mut reader = BufReader::new(file);
        reader.seek(SeekFrom::Start(self.offset))?;

        let mut new_data = Vec::new();
        reader.read_to_end(&mut new_data)?;

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
