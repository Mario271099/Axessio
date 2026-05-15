"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  to: number;
  durationMs?: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}

// Easing : ease-out cubic — démarrage rapide, fin douce.
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export function CountUp({
  to,
  durationMs = 800,
  decimals = 0,
  suffix = "",
  className,
}: CountUpProps) {
  const [value, setValue] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      setValue(to * easeOut(progress));
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      }
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [to, durationMs]);

  const formatted =
    decimals > 0
      ? value.toFixed(decimals)
      : Math.round(value).toLocaleString("fr-FR");

  return (
    <span className={className} aria-label={`${to}${suffix}`}>
      {formatted}
      {suffix}
    </span>
  );
}
