import { getTranslations } from "next-intl/server";
import { cn, formatDate } from "@/lib/utils";

interface AuditDeadlinesProps {
  expectedStartAt: string | null;
  expectedEndAt: string | null;
  restitutionAt: string | null;
  counterAuditAt: string | null;
  deliveredAt: string | null;
  onlineAt: string | null;
}

/**
 * Liste compacte des échéances clés de l'audit : libellé à gauche, date
 * alignée à droite, précédé d'une pastille en anneau. Une date renseignée
 * (passée ou réalisée) remplit la pastille ; sinon "Non planifié" en sourdine.
 */
export async function AuditDeadlines(props: AuditDeadlinesProps) {
  const t = await getTranslations("audits.timeline");
  // Server Component rendu à chaque requête (page dynamique) : lire l'horloge
  // ici est voulu - la règle de pureté React vise les composants client.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  const rows: Array<{ labelKey: string; date: string | null; done: boolean }> = [
    {
      labelKey: "events.start",
      date: props.expectedStartAt,
      done: isPast(props.expectedStartAt, now),
    },
    {
      labelKey: "events.end",
      date: props.expectedEndAt,
      done: isPast(props.expectedEndAt, now),
    },
    {
      labelKey: "events.restitution",
      date: props.restitutionAt,
      done: isPast(props.restitutionAt, now),
    },
    {
      labelKey: "events.counterAudit",
      date: props.counterAuditAt,
      done: isPast(props.counterAuditAt, now),
    },
    {
      labelKey: "events.delivered",
      date: props.deliveredAt,
      done: Boolean(props.deliveredAt),
    },
    {
      labelKey: "events.online",
      date: props.onlineAt,
      done: Boolean(props.onlineAt),
    },
  ];

  return (
    <ul className="space-y-2.5" aria-label={t("ariaLabel")}>
      {rows.map((row) => (
        <li
          key={row.labelKey}
          className="flex items-center justify-between gap-3 text-sm"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden="true"
              className={cn(
                "h-2.5 w-2.5 shrink-0 rounded-full border-2",
                row.done
                  ? "border-success bg-success"
                  : "border-border bg-card",
              )}
            />
            <span
              className={cn(
                "truncate",
                row.date ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {t(row.labelKey)}
            </span>
          </span>
          <span
            className={cn(
              "shrink-0 text-right text-xs tabular-nums",
              row.date ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            {row.date ? formatDate(row.date) : t("notPlanned")}
          </span>
        </li>
      ))}
    </ul>
  );
}

function isPast(iso: string | null, now: number): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() <= now;
}
