import Link from "next/link";
import {
  Building2,
  CreditCard,
  FileText,
  History,
  Key,
  Layers,
  Palette,
  Webhook,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

export type OrgSettingsSection =
  | "general"
  | "billing"
  | "branding"
  | "workspaces"
  | "webhooks"
  | "apiTokens"
  | "auditLogs"
  | "ncTemplates";

interface Item {
  key: OrgSettingsSection;
  /** Suffixe d'URL après /organizations/<slug>. */
  path: string;
  labelKey: string;
  icon: React.ElementType;
  /** Fonctionnalité réservée à un plan : affichée en pastille. */
  plan?: "Pro" | "Enterprise";
}

const ITEMS: Item[] = [
  { key: "general", path: "", labelKey: "nav.general", icon: Building2 },
  {
    key: "billing",
    path: "/billing",
    labelKey: "billingCta",
    icon: CreditCard,
  },
  {
    key: "workspaces",
    path: "/workspaces",
    labelKey: "workspacesCta",
    icon: Layers,
  },
  {
    key: "ncTemplates",
    path: "/nc-templates",
    labelKey: "ncTemplatesCta",
    icon: FileText,
  },
  {
    key: "branding",
    path: "/branding",
    labelKey: "brandingCta",
    icon: Palette,
    plan: "Enterprise",
  },
  {
    key: "webhooks",
    path: "/webhooks",
    labelKey: "webhooksCta",
    icon: Webhook,
    plan: "Pro",
  },
  {
    key: "apiTokens",
    path: "/api-tokens",
    labelKey: "apiTokensCta",
    icon: Key,
    plan: "Enterprise",
  },
  {
    key: "auditLogs",
    path: "/audit-logs",
    labelKey: "auditLogsCta",
    icon: History,
  },
];

/**
 * Colonne de navigation des réglages d'une organisation. La section ouverte
 * est posée en blanc sur le fond de l'application, comme dans les maquettes ;
 * les entrées réservées à un plan portent la pastille du plan.
 */
export async function OrgSettingsNav({
  slug,
  active,
}: {
  slug: string;
  active: OrgSettingsSection;
}) {
  const t = await getTranslations("organizations.detail");

  return (
    <nav aria-label={t("nav.aria")}>
      <ul className="flex flex-col gap-0.5">
        {ITEMS.map((item) => {
          const isActive = item.key === active;
          const Icon = item.icon;
          return (
            <li key={item.key}>
              <Link
                href={`/organizations/${slug}${item.path}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-semibold",
                  "transition-colors duration-150",
                  isActive
                    ? "bg-card font-extrabold text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.25)]"
                    : "text-secondary-foreground hover:bg-primary-soft hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate">
                  {t(item.labelKey)}
                </span>
                {item.plan && (
                  <span className="shrink-0 rounded-md bg-ink px-1.5 py-0.5 text-[0.7rem] font-extrabold text-ink-foreground">
                    {item.plan}
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
