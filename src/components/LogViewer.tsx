import { useEffect, memo, type RefObject } from "react";
import type { TaggedLine } from "../hooks/useTailLines";
import "./LogViewer.css";

interface LogViewerProps {
  lines: TaggedLine[];
  containerRef: RefObject<HTMLDivElement | null>;
  scrollToBottom: () => void;
}

const LogLine = memo(function LogLine({ text }: { text: string }) {
  return <div className="log-line">{text || "\u00A0"}</div>;
});

export function LogViewer({ lines, containerRef, scrollToBottom }: LogViewerProps) {
  useEffect(() => {
    scrollToBottom();
  }, [lines.length, scrollToBottom]);

  return (
    <div className="log-viewer" ref={containerRef}>
      {lines.map((line) => (
        <LogLine key={line.id} text={line.text} />
      ))}
      {lines.length === 0 && (
        <div className="log-empty">
          ファイルを開いてください
        </div>
      )}
    </div>
  );
}
