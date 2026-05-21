import { getTranslations } from "next-intl/server";
import { Check } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface TimelineEvent {
  /** Clé i18n du libellé (sous `audits.timeline.events`). */
  labelKey: string;
  /** Date prévue / réelle. Null = non planifié. */
  date: string | null;
  /** Date considérée "passée" (= dans le passé OU explicitement marquée
   *  comme réalisée). */
  isPast: boolean;
}

interface AuditTimelineVerticalProps {
  expectedStartAt: string | null;
  expectedEndAt: string | null;
  restitutionAt: string | null;
  counterAuditAt: string | null;
  deliveredAt: string | null;
  onlineAt: string | null;
}

/**
 * Timeline verticale des dates clés de l'audit. Plus moderne et plus lisible
 * qu'un chevron horizontal multicolore : la verticalité permet d'afficher la
 * date au-dessous du libellé sans contrainte de largeur, et le contraste
 * past/future est immédiat (puce remplie vs creuse).
 *
 * Ordre fixe par convention métier : Démarrage → Fin → Restitution →
 * Contre-audit → Livraison → Mise en ligne. Le rendu suit cet ordre, peu
 * importe que les dates soient renseignées ou non.
 */
export async function AuditTimelineVertical(props: AuditTimelineVerticalProps) {
  const t = await getTranslations("audits.timeline");
  const now = Date.now();

  const isPast = (iso: string | null): boolean => {
    if (!iso) return false;
    return new Date(iso).getTime() <= now;
  };

  const events: TimelineEvent[] = [
    {
      labelKey: "events.start",
      date: props.expectedStartAt,
      isPast: isPast(props.expectedStartAt),
    },
    {
      labelKey: "events.end",
      date: props.expectedEndAt,
      isPast: isPast(props.expectedEndAt),
    },
    {
      labelKey: "events.restitution",
      date: props.restitutionAt,
      isPast: isPast(props.restitutionAt),
    },
    {
      labelKey: "events.counterAudit",
      date: props.counterAuditAt,
      isPast: isPast(props.counterAuditAt),
    },
    {
      labelKey: "events.delivered",
      date: props.deliveredAt,
      isPast: Boolean(props.deliveredAt), // une livraison réelle = toujours dans le passé
    },
    {
      labelKey: "events.online",
      date: props.onlineAt,
      isPast: Boolean(props.onlineAt),
    },
  ];

  return (
    <ol className="relative space-y-4" aria-label={t("ariaLabel")}>
      {/* Trait de fond vertical */}
      <span
        aria-hidden="true"
        className="absolute left-[7px] top-2 bottom-2 w-px bg-border"
      />
      {events.map((ev) => {
        const labelText = t(ev.labelKey);
        return (
          <li key={ev.labelKey} className="relative flex items-start gap-3">
            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                ev.isPast
                  ? "border-success bg-success text-success-foreground"
                  : "border-border bg-card",
              )}
            >
              {ev.isPast && <Check className="h-2.5 w-2.5" />}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p
                className={cn(
                  "text-sm font-medium",
                  !ev.isPast && "text-muted-foreground",
                )}
              >
                {labelText}
              </p>
              <p className="text-xs tabular-nums text-muted-foreground">
                {ev.date ? formatDate(ev.date) : t("notPlanned")}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
