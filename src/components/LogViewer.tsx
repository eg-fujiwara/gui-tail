import { useEffect, type RefObject } from "react";
import "./LogViewer.css";

interface LogViewerProps {
  lines: string[];
  containerRef: RefObject<HTMLDivElement | null>;
  scrollToBottom: () => void;
}

export function LogViewer({ lines, containerRef, scrollToBottom }: LogViewerProps) {
  useEffect(() => {
    scrollToBottom();
  }, [lines.length, scrollToBottom]);

  return (
    <div className="log-viewer" ref={containerRef}>
      {lines.map((line, i) => (
        <div className="log-line" key={i}>
          {line || "\u00A0"}
        </div>
      ))}
      {lines.length === 0 && (
        <div className="log-empty">
          ファイルを開いてください
        </div>
      )}
    </div>
  );
}
