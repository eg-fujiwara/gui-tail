import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { HistoryEntry } from "../types";
import "./FileSelector.css";

interface FileSelectorProps {
  onFileSelected: (path: string) => void;
  currentFile: string | null;
}

export function FileSelector({ onFileSelected, currentFile }: FileSelectorProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const loadHistory = async () => {
    const entries = await invoke<HistoryEntry[]>("get_history");
    setHistory(entries);
  };

  useEffect(() => {
    loadHistory();
  }, [currentFile]);

  const handleOpen = async () => {
    const selected = await open({
      multiple: false,
      filters: [
        { name: "All Files", extensions: ["*"] },
        { name: "Log Files", extensions: ["log", "txt"] },
      ],
    });
    if (selected) {
      onFileSelected(selected as string);
    }
  };

  const handleHistoryClick = (path: string) => {
    setShowHistory(false);
    onFileSelected(path);
  };

  return (
    <div className="file-selector">
      <button className="btn btn-primary" onClick={handleOpen}>
        Open File
      </button>

      <div className="history-wrapper">
        <button
          className="btn btn-secondary"
          onClick={() => {
            setShowHistory(!showHistory);
            if (!showHistory) loadHistory();
          }}
        >
          History ({history.length})
        </button>

        {showHistory && history.length > 0 && (
          <div className="history-dropdown">
            {history.map((entry, i) => (
              <div
                key={i}
                className="history-item"
                onClick={() => handleHistoryClick(entry.path)}
                title={entry.path}
              >
                {entry.path.split(/[/\\]/).pop() || entry.path}
                <span className="history-path">{entry.path}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {currentFile && (
        <span className="current-file" title={currentFile}>
          {currentFile}
        </span>
      )}
    </div>
  );
}
