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
 * Barre d'onglets de navigation au niveau audit. Chaque onglet pointe vers
 * une page Next.js distincte (navigation classique, pas de state local).
 * L'onglet actif est mis en évidence par un soulignement coloré.
 *
 * Client component pour pouvoir être réutilisé aussi dans des layouts client
 * (matrice, etc.) sans contrainte de async/await.
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
    <nav
      aria-label={t("ariaLabel")}
      className={cn("border-b border-border", className)}
    >
      <ul className="flex flex-wrap gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative inline-flex items-center px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
