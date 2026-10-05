import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Play, Square, FileText, RefreshCw } from "lucide-react";
import { StatusDot } from "@/components/ui/status-dot";
import { cn } from "@/lib/utils";

export type PlanningEventType =
  | "start"
  | "end"
  | "restitution"
  | "counter_audit";

export interface PlanningEvent {
  /** ISO string */
  date: string;
  type: PlanningEventType;
  audit: {
    id: string;
    projectName: string;
    clientName: string | null;
    /** Liste des prénoms+noms des assignees (admin "all" view). */
    assigneeNames: string[];
  };
}

interface PlanningCalendarProps {
  /** ISO string du 1er du mois affiché. */
  monthStart: string;
  events: PlanningEvent[];
  /** Affiche le nom de l'auditeur sur chaque pastille (admin tous). */
  showAssignees?: boolean;
}

const TYPE_STYLES: Record<
  PlanningEventType,
  { color: string; bg: string; text: string; icon: React.ElementType }
> = {
  start: {
    color: "hsl(var(--primary))",
    bg: "bg-primary-muted",
    text: "text-primary",
    icon: Play,
  },
  end: {
    color: "hsl(var(--secondary-foreground))",
    bg: "bg-secondary",
    text: "text-secondary-foreground",
    icon: Square,
  },
  restitution: {
    color: "hsl(var(--warning))",
    bg: "bg-warning-bg",
    text: "text-warning-text",
    icon: FileText,
  },
  counter_audit: {
    color: "hsl(var(--success))",
    bg: "bg-success-bg",
    text: "text-success-text",
    icon: RefreshCw,
  },
};

/** Renvoie la clé "YYYY-MM-DD" d'une date en zone locale. */
function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Lundi de la semaine de `d` (ISO 8601, lundi-dimanche). */
function startOfWeekMonday(d: Date): Date {
  const dow = d.getDay(); // 0 = dimanche, 1 = lundi…
  const delta = (dow + 6) % 7; // nombre de jours à reculer pour atteindre lundi
  const r = new Date(d);
  r.setDate(d.getDate() - delta);
  r.setHours(0, 0, 0, 0);
  return r;
}

export async function PlanningCalendar({
  monthStart: monthStartIso,
  events,
  showAssignees,
}: PlanningCalendarProps) {
  const t = await getTranslations("planning");
  const monthStart = new Date(monthStartIso);
  monthStart.setHours(0, 0, 0, 0);

  // Construction d'une grille 6 lignes × 7 jours partant du lundi avant ou
  // égal au 1er du mois - couvre tous les cas où le mois ne commence pas un
  // lundi.
  const gridStart = startOfWeekMonday(monthStart);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }

  // Indexation des events par jour pour un rendu O(1) par cellule.
  const eventsByDay = new Map<string, PlanningEvent[]>();
  for (const ev of events) {
    const d = new Date(ev.date);
    const key = dayKey(d);
    const existing = eventsByDay.get(key);
    if (existing) existing.push(ev);
    else eventsByDay.set(key, [ev]);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = dayKey(today);
  const monthIdx = monthStart.getMonth();

  const weekdays = [
    t("weekdays.mon"),
    t("weekdays.tue"),
    t("weekdays.wed"),
    t("weekdays.thu"),
    t("weekdays.fri"),
    t("weekdays.sat"),
    t("weekdays.sun"),
  ];

  return (
    <div className="space-y-4">
      {/* Légende */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {(["start", "end", "restitution", "counter_audit"] as const).map(
          (type) => (
            <StatusDot
              key={type}
              color={TYPE_STYLES[type].color}
              className="text-muted-foreground"
            >
              {t(`eventType.${type}`)}
            </StatusDot>
          ),
        )}
      </div>

      {/* En-tête jours de la semaine */}
      <div className="grid grid-cols-7 gap-1 text-center text-sm font-bold text-muted-foreground">
        {weekdays.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grille */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const key = dayKey(d);
          const dayEvents = eventsByDay.get(key) ?? [];
          const inMonth = d.getMonth() === monthIdx;
          const isToday = key === todayKey;

          return (
            <div
              key={key}
              className={cn(
                "flex min-h-[5.5rem] flex-col gap-1 rounded-row border border-border p-1.5 text-xs",
                inMonth ? "bg-card" : "bg-secondary/60",
                isToday &&
                  "border-primary shadow-[inset_0_0_0_2px_hsl(var(--primary))]",
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-between",
                  inMonth ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "tabular font-semibold",
                    isToday && "font-black text-primary",
                  )}
                >
                  {d.getDate()}
                </span>
              </div>

              {dayEvents.length > 0 && (
                <ul className="flex flex-col gap-0.5">
                  {dayEvents.slice(0, 4).map((ev, idx) => {
                    const s = TYPE_STYLES[ev.type];
                    const Icon = s.icon;
                    const subtitle = ev.audit.clientName
                      ? `${ev.audit.projectName} · ${ev.audit.clientName}`
                      : ev.audit.projectName;
                    const assigneeLabel =
                      showAssignees && ev.audit.assigneeNames.length > 0
                        ? ev.audit.assigneeNames.join(", ")
                        : null;
                    return (
                      <li key={`${ev.audit.id}-${ev.type}-${idx}`}>
                        <Link
                          href={`/audits/${ev.audit.id}`}
                          className={cn(
                            "group block truncate rounded-md px-1.5 py-1 text-[11px] font-bold leading-tight",
                            s.bg,
                            s.text,
                            "hover:opacity-80",
                          )}
                          title={`${t(`eventType.${ev.type}`)} - ${subtitle}${
                            assigneeLabel ? ` (${assigneeLabel})` : ""
                          }`}
                        >
                          <span className="inline-flex items-center gap-1">
                            <Icon className="h-2.5 w-2.5" aria-hidden="true" />
                            <span className="truncate">
                              {ev.audit.projectName}
                            </span>
                          </span>
                          {assigneeLabel && (
                            <span className="block truncate text-[9px]">
                              {assigneeLabel}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                  {dayEvents.length > 4 && (
                    <li className="text-[10px] text-muted-foreground">
                      {t("moreEvents", { count: dayEvents.length - 4 })}
                    </li>
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {events.length === 0 && (
        <p className="rounded-card border border-dashed border-border-strong p-6 text-center text-sm text-muted-foreground">
          {t("emptyMonth")}
        </p>
      )}
    </div>
  );
}
