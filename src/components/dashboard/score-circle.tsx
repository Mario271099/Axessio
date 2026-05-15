"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreCircleProps {
  label: string;
  /** Score 0-100. `null` ⇒ aucune donnée évaluée. */
  score: number | null;
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export function ScoreCircle({ label, score }: ScoreCircleProps) {
  const target = score ?? 0;
  const [animated, setAnimated] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 800);
      setAnimated(target * easeOut(progress));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [target]);

  // Géométrie : cercle SVG 80px de diamètre, stroke 8px → rayon 36.
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - animated / 100);

  const tone =
    score === null
      ? "muted"
      : score >= 100
        ? "success"
        : score >= 50
          ? "warning"
          : "destructive";

  const strokeVar = {
    success: "hsl(var(--success))",
    warning: "hsl(var(--warning))",
    destructive: "hsl(var(--destructive))",
    muted: "hsl(var(--muted-foreground))",
  }[tone];

  return (
    <Card className="flex flex-col items-start justify-between gap-4 p-6 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex w-full items-center gap-2">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500"
          aria-hidden="true"
        >
          <TrendingUp className="h-5 w-5" />
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>

      <div className="mx-auto flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          <svg
            className="h-20 w-20 -rotate-90"
            viewBox="0 0 80 80"
            aria-hidden="true"
          >
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
            />
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke={strokeVar}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{
                transition: "stroke 200ms ease",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={cn(
                "text-base font-bold tabular-nums",
                score === null ? "text-muted-foreground" : "",
              )}
              aria-label={
                score === null ? "Score non disponible" : `${Math.round(target)} pour cent`
              }
            >
              {score === null ? "—" : `${Math.round(animated)}%`}
            </span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          <p>
            {score === null
              ? "Aucune donnée"
              : score >= 100
                ? "Conformité totale"
                : score >= 50
                  ? "Conformité partielle"
                  : "Non conforme"}
          </p>
        </div>
      </div>
    </Card>
  );
}
