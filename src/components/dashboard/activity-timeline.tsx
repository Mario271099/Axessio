"use client";

import Link from "next/link";
import { Activity } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { intlLocale } from "@/lib/intl";

export type ActivityKind =
  | "nc-critical"
  | "nc-created"
  | "audit-completed"
  | "audit-update";

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  author: string;
  action: string;
  target: string;
  href?: string;
  /** ISO date string */
  at: string;
}

const dotClass: Record<ActivityKind, string> = {
  "nc-critical": "bg-destructive",
  "nc-created": "bg-warning",
  "audit-completed": "bg-success",
  "audit-update": "bg-primary",
};

function relativeTime(iso: string, locale: string): string {
  const rtf = new Intl.RelativeTimeFormat(intlLocale(locale), {
    numeric: "auto",
  });
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 60) return rtf.format(-Math.max(1, minutes), "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.round(hours / 24);
  if (days < 30) return rtf.format(-days, "day");
  const months = Math.round(days / 30);
  return rtf.format(-months, "month");
}

export function ActivityTimeline({ events }: { events: ActivityEvent[] }) {
  const t = useTranslations("dashboard.activity");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{t("title")}</CardTitle>
        <Button asChild variant="link" size="sm" className="h-auto p-0">
          <Link href="/audits">{tCommon("viewAll")}</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div
              aria-hidden="true"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
            >
              <Activity className="h-6 w-6" />
            </div>
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          </div>
        ) : (
          <ol
            className="ml-4 space-y-6 border-l-2 border-border pl-6"
            aria-label={t("title")}
          >
            {events.slice(0, 10).map((event) => (
              <li key={event.id} className="relative">
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute -left-[31px] top-1.5 h-3 w-3 rounded-full ring-4 ring-background",
                    dotClass[event.kind],
                  )}
                />
                <p className="text-sm leading-snug">
                  <span className="font-medium">{event.author}</span>{" "}
                  <span className="text-muted-foreground">{event.action}</span>{" "}
                  {event.href ? (
                    <Link
                      href={event.href}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {event.target}
                    </Link>
                  ) : (
                    <span className="font-medium">{event.target}</span>
                  )}
                </p>
                <time
                  dateTime={event.at}
                  className="mt-1 block text-xs text-muted-foreground"
                >
                  {relativeTime(event.at, locale)}
                </time>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
