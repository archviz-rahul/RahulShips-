import { useState, useLayoutEffect, useEffect, useState as useClientState, useRef } from "react";

interface UseVirtualScrollProps {
  itemCount: number;
  itemHeight: number;
  buffer?: number;
}

export function useVirtualScroll({
  itemCount,
  itemHeight,
  buffer = 10
}: UseVirtualScrollProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600); // stable fallback

  // Use useEffect to prevent layout jump or flash
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Set initial size
    setContainerHeight(el.clientHeight || 600);

    const handleScroll = () => {
      setScrollTop(el.scrollTop);
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height || el.clientHeight || 600);
      }
    });

    el.addEventListener("scroll", handleScroll, { passive: true });
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
    };
  }, []);

  // Adjust scroll if item count shrinks significantly to prevent empty screen
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, itemCount * itemHeight - containerHeight);
    if (el.scrollTop > maxScroll) {
      el.scrollTop = maxScroll;
      setScrollTop(maxScroll);
    }
  }, [itemCount, itemHeight, containerHeight]);

  // Calculations
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
  const endIndex = Math.min(itemCount, Math.floor((scrollTop + containerHeight) / itemHeight) + buffer);
  
  const offsetY = startIndex * itemHeight;
  const totalHeight = itemCount * itemHeight;

  return {
    containerRef,
    startIndex,
    endIndex,
    offsetY,
    totalHeight,
    scrollTop
  };
}
