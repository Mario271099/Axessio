"use client";

import { useTranslations } from "next-intl";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface StatusBreakdown {
  pending: number;
  inProgress: number;
  completed: number;
  archived: number;
}

const COLORS = {
  pending: "hsl(var(--muted))",
  inProgress: "hsl(var(--warning))",
  completed: "hsl(var(--success))",
  archived: "hsl(var(--muted-foreground))",
} as const;

type Key = keyof StatusBreakdown;

export function StatusPie({ breakdown }: { breakdown: StatusBreakdown }) {
  const t = useTranslations("dashboard.statusPie");

  const labelFor = (k: Key): string => t(`labels.${k}`);

  const total =
    breakdown.pending +
    breakdown.inProgress +
    breakdown.completed +
    breakdown.archived;

  const data: { key: Key; value: number }[] = (
    Object.keys(breakdown) as Key[]
  ).map((k) => ({ key: k, value: breakdown[k] }));

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {total === 0 ? (
          <div className="flex flex-1 items-center justify-center py-8 text-sm text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          <>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="key"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    strokeWidth={0}
                    isAnimationActive
                    animationDuration={600}
                  >
                    {data.map((entry) => (
                      <Cell key={entry.key} fill={COLORS[entry.key]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={
                      <PieTooltip
                        total={total}
                        labelFor={labelFor}
                        countText={(value) =>
                          t("auditCount", { count: value })
                        }
                      />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-4 space-y-2">
              {data.map((entry) => {
                const pct = total > 0 ? (entry.value / total) * 100 : 0;
                return (
                  <li
                    key={entry.key}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: COLORS[entry.key] }}
                      />
                      <span className="text-muted-foreground">
                        {labelFor(entry.key)}
                      </span>
                    </span>
                    <span className="tabular-nums">
                      <span className="font-semibold">{entry.value}</span>
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({pct.toFixed(0)}%)
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface TooltipPayloadEntry {
  value: number;
  payload?: { key: Key };
}

function PieTooltip({
  active,
  payload,
  total,
  labelFor,
  countText,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  total: number;
  labelFor: (k: Key) => string;
  countText: (count: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  if (!entry?.payload) return null;
  const pct = total > 0 ? (entry.value / total) * 100 : 0;
  return (
    <div className="rounded-md border border-border bg-card p-3 text-xs shadow-md">
      <p className="font-medium text-foreground">
        {labelFor(entry.payload.key)}
      </p>
      <p className="mt-1 tabular-nums text-muted-foreground">
        {countText(entry.value)} · {pct.toFixed(0)}%
      </p>
    </div>
  );
}
