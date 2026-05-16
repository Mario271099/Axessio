"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Range = "7d" | "30d" | "90d";

/**
 * Génère une série mock d'évolution de score sur N jours.
 * Tant que nous n'avons pas d'historique réel, on construit une courbe
 * cohérente (légère croissance, bruit modéré) — à remplacer plus tard par
 * une vraie agrégation côté serveur.
 */
function buildMockSeries(days: number) {
  const random = mulberry32(days); // graine stable par plage
  const startScore = 55;
  const endScore = 78;
  return Array.from({ length: days }, (_, i) => {
    const t = days === 1 ? 0 : i / (days - 1);
    const trend = startScore + (endScore - startScore) * t;
    const jitter = (random() - 0.5) * 8;
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    return {
      date: date.toISOString(),
      score: Math.max(0, Math.min(100, Math.round(trend + jitter))),
    };
  });
}

function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RANGES: { value: Range; days: number }[] = [
  { value: "7d", days: 7 },
  { value: "30d", days: 30 },
  { value: "90d", days: 90 },
];

export function EvolutionChart() {
  const [range, setRange] = useState<Range>("30d");
  const t = useTranslations("dashboard.evolution");
  const locale = useLocale();
  const intl = locale === "en" ? "en-US" : "fr-FR";

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(intl, {
        day: "2-digit",
        month: "short",
      }),
    [intl],
  );

  const data = useMemo(() => {
    const def = RANGES.find((r) => r.value === range);
    return buildMockSeries(def?.days ?? 30);
  }, [range]);

  // Sur 30/90 j, on espace les ticks pour éviter le chevauchement.
  const tickFormatter = (iso: string) => {
    const d = new Date(iso);
    return dateFormatter.format(d);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>{t("title")}</CardTitle>
        </div>
        <Tabs
          value={range}
          onValueChange={(v) => setRange(v as Range)}
          aria-label={t("title")}
        >
          <TabsList>
            {RANGES.map((r) => (
              <TabsTrigger key={r.value} value={r.value}>
                {t(`ranges.${r.value}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={tickFormatter}
                tickLine={false}
                axisLine={false}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                minTickGap={32}
              />
              <YAxis
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                width={32}
              />
              <Tooltip
                content={<EvolutionTooltip intl={intl} label={t("tooltipScore")} />}
                cursor={{ stroke: "hsl(var(--border))" }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorScore)"
                isAnimationActive
                animationDuration={500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface TooltipPayloadEntry {
  value: number;
  payload?: { date: string };
}

function EvolutionTooltip({
  active,
  payload,
  intl,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  intl: string;
  label: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  if (!entry?.payload) return null;
  const d = new Date(entry.payload.date);
  return (
    <div className="rounded-md border border-border bg-card p-3 text-xs shadow-md">
      <p className="font-medium text-foreground">
        {new Intl.DateTimeFormat(intl, {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }).format(d)}
      </p>
      <p className="mt-1 text-muted-foreground">
        {label}{" "}
        <span className="font-semibold text-foreground tabular-nums">
          {entry.value}%
        </span>
      </p>
    </div>
  );
}
