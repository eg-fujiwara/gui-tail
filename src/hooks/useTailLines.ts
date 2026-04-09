import { useEffect, useRef, useState, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";

export function useTailLines(maxLines: number) {
  const [lines, setLines] = useState<string[]>([]);
  const linesRef = useRef<string[]>([]);

  useEffect(() => {
    const unlisten = listen<string[]>("tail-lines", (event) => {
      const newLines = event.payload;
      const current = linesRef.current;
      const merged = [...current, ...newLines];

      // Trim from the front if over limit
      const trimmed =
        merged.length > maxLines
          ? merged.slice(merged.length - maxLines)
          : merged;

      linesRef.current = trimmed;
      setLines(trimmed);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [maxLines]);

  const clearLines = useCallback(() => {
    linesRef.current = [];
    setLines([]);
  }, []);

  return { lines, clearLines };
}
