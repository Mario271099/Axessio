import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  FileSearch,
  ClipboardCheck,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditStatus } from "@/types/domain";
import type { AuditLifecycleSnapshot } from "@/lib/audit-status";

interface AuditNextActionProps {
  auditId: string;
  status: AuditStatus;
  snapshot: AuditLifecycleSnapshot;
  /** L'utilisateur peut-il agir (= staff + assigné). */
  canAct: boolean;
  /**
   * Action rendue à droite du callout quand la prochaine étape est une
   * transition de statut (ex. « Passer à l'étape suivante »). Pour les états
   * où il faut d'abord naviguer (composer l'échantillon, remplir la matrice),
   * le callout rend son propre lien et ignore ce slot.
   */
  advanceSlot?: React.ReactNode;
}

type ActionTone = "info" | "warning" | "success" | "muted";

interface ActionConfig {
  tone: ActionTone;
  titleKey: string;
  descriptionKey: string;
  /** Valeurs d'interpolation pour `description`. */
  descriptionValues?: Record<string, string | number>;
  cta?: { label: string; href: string; icon: React.ElementType };
}

/**
 * Calcule la prochaine action recommandée selon le statut courant et l'état
 * de complétion. C'est le cœur de l'UX "Mission Control" : on ne se contente
 * pas d'afficher l'état, on guide vers l'action.
 */
function computeNextAction(
  auditId: string,
  status: AuditStatus,
  snapshot: AuditLifecycleSnapshot,
): ActionConfig {
  switch (status) {
    case "PENDING": {
      if (snapshot.representativeCount === 0) {
        return {
          tone: "info",
          titleKey: "pending.noSample.title",
          descriptionKey: "pending.noSample.description",
          cta: {
            label: "openSample",
            href: `/audits/${auditId}/sample`,
            icon: FileSearch,
          },
        };
      }
      return {
        tone: "info",
        titleKey: "pending.ready.title",
        descriptionKey: "pending.ready.description",
        cta: {
          label: "openLifecycle",
          href: `#lifecycle`,
          icon: ArrowRight,
        },
      };
    }

    case "PLANNED": {
      if (!snapshot.startDateSet) {
        return {
          tone: "warning",
          titleKey: "planned.noDate.title",
          descriptionKey: "planned.noDate.description",
          cta: {
            label: "edit",
            href: `/audits/${auditId}/edit`,
            icon: Calendar,
          },
        };
      }
      if (!snapshot.startDateReached) {
        return {
          tone: "muted",
          titleKey: "planned.future.title",
          descriptionKey: "planned.future.description",
        };
      }
      return {
        tone: "info",
        titleKey: "planned.start.title",
        descriptionKey: "planned.start.description",
        cta: {
          label: "openLifecycle",
          href: `#lifecycle`,
          icon: ArrowRight,
        },
      };
    }

    case "IN_PROGRESS": {
      const pct = Number(snapshot.matrixPercent ?? 0);
      if (snapshot.matrixTotal === 0) {
        return {
          tone: "warning",
          titleKey: "inProgress.noMatrix.title",
          descriptionKey: "inProgress.noMatrix.description",
          cta: {
            label: "openMatrix",
            href: `/audits/${auditId}/matrix`,
            icon: ClipboardCheck,
          },
        };
      }
      if (pct < 100) {
        return {
          tone: "info",
          titleKey: "inProgress.matrix.title",
          descriptionKey: "inProgress.matrix.description",
          descriptionValues: {
            filled: snapshot.matrixFilled,
            total: snapshot.matrixTotal,
            percent: pct.toFixed(0),
          },
          cta: {
            label: "openMatrix",
            href: `/audits/${auditId}/matrix`,
            icon: ClipboardCheck,
          },
        };
      }
      return {
        tone: "success",
        titleKey: "inProgress.ready.title",
        descriptionKey: "inProgress.ready.description",
        cta: {
          label: "openLifecycle",
          href: `#lifecycle`,
          icon: ArrowRight,
        },
      };
    }

    case "DELIVERED":
      return {
        tone: "info",
        titleKey: "delivered.title",
        descriptionKey: "delivered.description",
        cta: {
          label: "openAnomalies",
          href: `/audits/${auditId}/anomalies`,
          icon: AlertCircle,
        },
      };

    case "REMEDIATION":
      return {
        tone: "info",
        titleKey: "remediation.title",
        descriptionKey: "remediation.description",
        cta: {
          label: "openSimulator",
          href: `/audits/${auditId}/simulator`,
          icon: Sparkles,
        },
      };

    case "COUNTER_AUDIT":
      return {
        tone: "info",
        titleKey: "counterAudit.title",
        descriptionKey: "counterAudit.description",
        cta: {
          label: "openMatrix",
          href: `/audits/${auditId}/matrix`,
          icon: ClipboardCheck,
        },
      };

    case "ONLINE":
    case "COMPLETED":
      return {
        tone: "success",
        titleKey: "completed.title",
        descriptionKey: "completed.description",
      };

    case "ARCHIVED":
      return {
        tone: "muted",
        titleKey: "archived.title",
        descriptionKey: "archived.description",
      };

    default:
      return {
        tone: "muted",
        titleKey: "unknown.title",
        descriptionKey: "unknown.description",
      };
  }
}

const TONE_STYLES: Record<
  ActionTone,
  { wrapper: string; icon: string; iconBg: string; cta: string }
> = {
  info: {
    wrapper: "border-primary/30 bg-primary/[0.04]",
    icon: "text-primary",
    iconBg: "bg-primary/10",
    cta: "",
  },
  warning: {
    wrapper: "border-warning/40 bg-warning/[0.06]",
    icon: "text-warning",
    iconBg: "bg-warning/15",
    cta: "",
  },
  success: {
    wrapper: "border-success/40 bg-success/[0.06]",
    icon: "text-success",
    iconBg: "bg-success/15",
    cta: "",
  },
  muted: {
    wrapper: "border-border bg-muted/30",
    icon: "text-muted-foreground",
    iconBg: "bg-muted",
    cta: "",
  },
};

const TONE_ICON: Record<ActionTone, React.ElementType> = {
  info: ArrowRight,
  warning: AlertCircle,
  success: CheckCircle2,
  muted: CheckCircle2,
};

export async function AuditNextAction({
  auditId,
  status,
  snapshot,
  canAct,
  advanceSlot,
}: AuditNextActionProps) {
  const t = await getTranslations("audits.nextAction");
  const action = computeNextAction(auditId, status, snapshot);
  const styles = TONE_STYLES[action.tone];
  const HeadIcon = TONE_ICON[action.tone];
  const Cta = action.cta?.icon;
  // Une ancre interne (#lifecycle) = la prochaine étape est une transition de
  // statut : on délègue l'action au slot fourni (bouton « étape suivante »).
  const isSelfAdvance = action.cta?.href.startsWith("#") ?? false;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5",
        styles.wrapper,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          styles.iconBg,
          styles.icon,
        )}
      >
        <HeadIcon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("kicker")}
        </p>
        <h3 className={cn("text-base font-semibold leading-tight", styles.icon)}>
          {t(`states.${action.titleKey}`)}
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t(
            `states.${action.descriptionKey}`,
            action.descriptionValues ?? {},
          )}
        </p>
      </div>

      {/* Prochaine étape = transition de statut : on rend le slot fourni
          (bouton « Passer à l'étape suivante ») à la place d'un lien. */}
      {isSelfAdvance && advanceSlot && (
        <div className="shrink-0">{advanceSlot}</div>
      )}

      {/* Sinon : lien de navigation classique (échantillon, matrice, édition). */}
      {!isSelfAdvance && canAct && action.cta && Cta && (
        <Link
          href={action.cta.href}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors shrink-0",
            action.tone === "warning" && "bg-warning text-warning-foreground hover:bg-warning/90",
            action.tone === "success" && "bg-success text-success-foreground hover:bg-success/90",
            (action.tone === "info" || action.tone === "muted") &&
              "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
        >
          <Cta className="h-4 w-4" aria-hidden="true" />
          {t(`cta.${action.cta.label}`)}
        </Link>
      )}
    </div>
  );
}
