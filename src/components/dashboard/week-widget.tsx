"use client";

import { Sparkles } from "lucide-react";
import { CountUp } from "@/components/dashboard/count-up";

interface WeekWidgetProps {
  ncThisWeek: number;
  /** Objectif hebdomadaire — fallback à 20 si on n'a pas encore d'objectif paramétré. */
  goal?: number;
}

export function WeekWidget({ ncThisWeek, goal = 20 }: WeekWidgetProps) {
  const ratio = Math.min(1, ncThisWeek / Math.max(goal, 1));
  return (
    <div className="rounded-xl border border-primary/15 bg-card/60 px-5 py-4 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Cette semaine
        </div>
      </div>
      <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight">
        <CountUp to={ncThisWeek} />
      </p>
      <p className="text-xs text-muted-foreground">NC créées</p>

      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={ncThisWeek}
        aria-label={`${ncThisWeek} sur un objectif de ${goal} NC`}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground tabular-nums">
        Objectif {goal}
      </p>
    </div>
  );
}
