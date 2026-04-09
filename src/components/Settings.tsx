import { invoke } from "@tauri-apps/api/core";
import "./Settings.css";

interface SettingsProps {
  maxLines: number;
  onMaxLinesChange: (value: number) => void;
  pollInterval: number;
  onPollIntervalChange: (value: number) => void;
  isPaused: boolean;
  onTogglePause: (paused: boolean) => void;
}

export function Settings({
  maxLines,
  onMaxLinesChange,
  pollInterval,
  onPollIntervalChange,
  isPaused,
  onTogglePause,
}: SettingsProps) {
  const handleMaxLinesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    onMaxLinesChange(value);
    localStorage.setItem("gui-tail-max-lines", String(value));
  };

  const handlePollChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 100) {
      onPollIntervalChange(value);
      localStorage.setItem("gui-tail-poll-interval", String(value));
      invoke("set_poll_interval", { ms: value }).catch(() => {});
    }
  };

  return (
    <div className="settings">
      <label className="settings-label">
        <input
          type="checkbox"
          checked={isPaused}
          onChange={(e) => onTogglePause(e.target.checked)}
        />
        Pause
      </label>

      <label className="settings-label">
        Poll:
        <input
          type="number"
          className="settings-input"
          value={pollInterval}
          min={100}
          step={100}
          onChange={handlePollChange}
        />
        ms
      </label>

      <label className="settings-label">
        Buffer:
        <select
          className="settings-select"
          value={maxLines}
          onChange={handleMaxLinesChange}
        >
          <option value={1000}>1,000</option>
          <option value={5000}>5,000</option>
          <option value={10000}>10,000</option>
          <option value={50000}>50,000</option>
          <option value={100000}>100,000</option>
        </select>
      </label>
    </div>
  );
}
