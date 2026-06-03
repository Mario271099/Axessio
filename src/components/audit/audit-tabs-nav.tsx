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
}

/**
 * Barre d'onglets de navigation au niveau audit. Onglets en pills
 * (rounded-full, fond primary + texte blanc actif, hover doux sur les
 * inactifs). Plus moderne et plus contrasté que l'ancien soulignement.
 *
 * Client component pour pouvoir être réutilisé aussi dans des layouts
 * client (matrice, etc.) sans contrainte de async/await.
 */
export function AuditTabsNav({
  auditId,
  active,
  className,
}: AuditTabsNavProps) {
  const t = useTranslations("audits.tabsNav");

  const tabs: Array<{ key: AuditTab; href: string; label: string }> = [
    { key: "dashboard", href: `/audits/${auditId}`, label: t("dashboard") },
    { key: "sample", href: `/audits/${auditId}/sample`, label: t("sample") },
    {
      key: "anomalies",
      href: `/audits/${auditId}/anomalies`,
      label: t("anomalies"),
    },
    { key: "matrix", href: `/audits/${auditId}/matrix`, label: t("matrix") },
    {
      key: "remediation",
      href: `/audits/${auditId}/simulator`,
      label: t("remediation"),
    },
  ];

  return (
    <nav aria-label={t("ariaLabel")} className={className}>
      <ul className="flex flex-wrap items-center gap-1">
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
