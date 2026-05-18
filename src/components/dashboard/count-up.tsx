"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { intlLocale } from "@/lib/intl";

interface CountUpProps {
  to: number;
  durationMs?: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export function CountUp({
  to,
  durationMs = 800,
  decimals = 0,
  suffix = "",
  className,
}: CountUpProps) {
  const locale = useLocale();
  const [value, setValue] = useState(0);
  const frame = useRef<number | null>(null);

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(intlLocale(locale), {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }),
    [locale, decimals],
  );

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

  return (
    <span className={className} aria-label={`${to}${suffix}`}>
      {formatter.format(value)}
      {suffix}
    </span>
  );
}
