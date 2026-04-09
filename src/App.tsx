import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { FileSelector } from "./components/FileSelector";
import { LogViewer } from "./components/LogViewer";
import { Settings } from "./components/Settings";
import { useTailLines } from "./hooks/useTailLines";
import { useTailFollow } from "./hooks/useTailFollow";
import "./App.css";

const DEFAULT_MAX_LINES = 10000;
const DEFAULT_POLL_INTERVAL = 1000;

function getInitialMaxLines(): number {
  const saved = localStorage.getItem("gui-tail-max-lines");
  if (saved) {
    const parsed = parseInt(saved, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return DEFAULT_MAX_LINES;
}

function getInitialPollInterval(): number {
  const saved = localStorage.getItem("gui-tail-poll-interval");
  if (saved) {
    const parsed = parseInt(saved, 10);
    if (!isNaN(parsed) && parsed >= 100) return parsed;
  }
  return DEFAULT_POLL_INTERVAL;
}

function App() {
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [maxLines, setMaxLines] = useState(getInitialMaxLines);
  const [pollInterval, setPollInterval] = useState(getInitialPollInterval);
  const { lines, clearLines } = useTailLines(maxLines);
  const { containerRef, scrollToBottom, isPaused, togglePause } = useTailFollow();

  const handleFileSelected = useCallback(
    async (path: string) => {
      await invoke("stop_tail").catch(() => {});
      clearLines();

      try {
        await invoke("set_poll_interval", { ms: pollInterval });
        await invoke("start_tail", { path });
        setCurrentFile(path);
        const filename = path.split(/[/\\]/).pop() || path;
        await getCurrentWindow().setTitle(`GUI Tail - ${filename}`);
      } catch (e) {
        console.error("Failed to start tail:", e);
      }
    },
    [clearLines, pollInterval]
  );

  return (
    <div className="app">
      <div className="toolbar">
        <FileSelector
          onFileSelected={handleFileSelected}
          currentFile={currentFile}
        />
        <Settings
          maxLines={maxLines}
          onMaxLinesChange={setMaxLines}
          pollInterval={pollInterval}
          onPollIntervalChange={setPollInterval}
          isPaused={isPaused}
          onTogglePause={togglePause}
        />
      </div>
      <LogViewer
        lines={lines}
        containerRef={containerRef}
        scrollToBottom={scrollToBottom}
      />
    </div>
  );
}

export default App;
