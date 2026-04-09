import { useEffect, useRef, useCallback, useState } from "react";

export function useTailFollow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const lastScrollTopRef = useRef(0);
  const programmaticScrollRef = useRef(false);

  // Detect upward scroll to auto-pause
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      // Skip if this scroll was triggered by our scrollToBottom
      if (programmaticScrollRef.current) {
        programmaticScrollRef.current = false;
        lastScrollTopRef.current = el.scrollTop;
        return;
      }

      const currentTop = el.scrollTop;
      const prevTop = lastScrollTopRef.current;
      lastScrollTopRef.current = currentTop;

      // User scrolled up → pause
      if (currentTop < prevTop) {
        setIsPaused(true);
      }
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (!isPaused && containerRef.current) {
      programmaticScrollRef.current = true;
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [isPaused]);

  const togglePause = useCallback((paused: boolean) => {
    setIsPaused(paused);
    // When unpausing, immediately scroll to bottom
    if (!paused && containerRef.current) {
      programmaticScrollRef.current = true;
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  return { containerRef, scrollToBottom, isPaused, togglePause };
}
