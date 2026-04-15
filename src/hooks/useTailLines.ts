import { useEffect, useRef, useState, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";

export interface TaggedLine {
  id: number;
  text: string;
}

let nextLineId = 0;

export function useTailLines(maxLines: number) {
  const [lines, setLines] = useState<TaggedLine[]>([]);
  const linesRef = useRef<TaggedLine[]>([]);
  const pendingRef = useRef<string[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const flush = () => {
      rafRef.current = null;
      const pending = pendingRef.current;
      if (pending.length === 0) return;
      pendingRef.current = [];

      const tagged = pending.map((text) => ({ id: nextLineId++, text }));
      const current = linesRef.current;
      const merged = [...current, ...tagged];

      const trimmed =
        merged.length > maxLines
          ? merged.slice(merged.length - maxLines)
          : merged;

      linesRef.current = trimmed;
      setLines(trimmed);
    };

    const unlisten = listen<string[]>("tail-lines", (event) => {
      pendingRef.current.push(...event.payload);
      // Batch updates: schedule a single render per animation frame
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(flush);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [maxLines]);

  const clearLines = useCallback(() => {
    linesRef.current = [];
    pendingRef.current = [];
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setLines([]);
  }, []);

  return { lines, clearLines };
}
