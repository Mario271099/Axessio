"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type AuditTab =
  | "dashboard"
  | "sample"
  | "anomalies"
  | "matrix"
  | "remediation";

interface AuditTabsNavProps {
  auditId: string;
  active: AuditTab;
  className?: string;
  /** Compteurs affichés en pastille (échantillon, non-conformités). */
  counts?: Partial<Record<AuditTab, number>>;
}

/**
 * Barre d'onglets de navigation au niveau audit. Onglets soulignés : le trait
 * cobalt s'étend à mi-course au survol, puis entièrement sur l'onglet actif.
 *
 * Client component pour pouvoir être réutilisé aussi dans des layouts
 * client (matrice, etc.) sans contrainte de async/await.
 */
export function AuditTabsNav({
  auditId,
  active,
  className,
  counts,
}: AuditTabsNavProps) {
  const t = useTranslations("audits.tabsNav");

  const tabs: Array<{ key: AuditTab; href: string; label: string }> = [
    { key: "dashboard", href: `/audits/${auditId}`, label: t("dashboard") },
    { key: "sample", href: `/audits/${auditId}/sample`, label: t("sample") },
    { key: "matrix", href: `/audits/${auditId}/matrix`, label: t("matrix") },
    {
      key: "anomalies",
      href: `/audits/${auditId}/anomalies`,
      label: t("anomalies"),
    },
    {
      key: "remediation",
      href: `/audits/${auditId}/simulator`,
      label: t("remediation"),
    },
  ];

  return (
    <nav aria-label={t("ariaLabel")} className={className}>
      <ul className="flex items-center gap-6 overflow-x-auto md:gap-7">
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          const count = counts?.[tab.key];
          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative inline-flex h-12 shrink-0 items-center gap-2 whitespace-nowrap text-base font-bold",
                  "transition-colors duration-150",
                  "after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:origin-bottom after:scale-x-0 after:rounded-t-[3px] after:bg-primary after:transition-transform after:duration-200",
                  isActive
                    ? "text-primary after:scale-x-100"
                    : "text-muted-foreground hover:text-foreground hover:after:scale-x-50",
                )}
              >
                {tab.label}
                {count != null && count > 0 && (
                  <span
                    className={cn(
                      "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-extrabold tabular",
                      isActive
                        ? "bg-primary-muted text-primary"
                        : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    {count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
