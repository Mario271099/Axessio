import Link from "next/link";
import { Check, Circle, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { resolveCurrentOrg } from "@/lib/current-org";
import { AXESSIO_INTERNAL_ORG_ID, type OrgType } from "@/types/domain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ChecklistKey = "logo" | "members" | "client" | "project" | "audit";

interface ChecklistItem {
  key: ChecklistKey;
  done: boolean;
  href: string;
}

/**
 * Détermine les 4 étapes à afficher selon le type d'org choisi à la
 * création. Persona 1 (freelance) commence par créer ses clients ;
 * persona 2 (entreprise qui s'audite) commence par inviter son équipe et
 * créer ses projets ; persona 3 (consultance) combine équipe et clients.
 */
function itemKeysForPersona(orgType: OrgType): ChecklistKey[] {
  switch (orgType) {
    case "individual":
      return ["logo", "client", "project", "audit"];
    case "agency":
      return ["logo", "members", "client", "audit"];
    case "company":
    case "enterprise":
      return ["logo", "members", "project", "audit"];
    default:
      return ["logo", "members", "project", "audit"];
  }
}

/**
 * Widget « Compléter mon org » affiché en haut du dashboard. Disparaît
 * automatiquement quand les 4 étapes sont cochées (orgs établies),
 * ou pour l'org plateforme Axessio Internal (staff interne).
 *
 * Server component : tout est calculé en SQL, aucune logique côté client.
 */
export async function OnboardingChecklist() {
  const { current } = await resolveCurrentOrg();
  if (!current) return null;
  // L'org plateforme « Axessio Internal » est un espace technique pour le
  // staff, pas une org client — pas d'onboarding à dérouler là-bas.
  if (current.organizationId === AXESSIO_INTERNAL_ORG_ID) return null;

  const supabase = await createClient();
  const orgSlug = current.organizationSlug;

  // Les 5 lectures sont indépendantes — un seul aller-retour parallèle.
  const [orgRow, membersRes, clientsRes, projectsRes, auditsRes] =
    await Promise.all([
      supabase
        .from("organizations")
        .select("logo_url")
        .eq("id", current.organizationId)
        .maybeSingle(),
      supabase
        .from("organization_members")
        .select("user_id", { count: "exact", head: true })
        .eq("organization_id", current.organizationId),
      supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", current.organizationId),
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", current.organizationId),
      supabase
        .from("audits")
        .select("id", { count: "exact", head: true }),
    ]);

  const ALL_ITEMS: Record<ChecklistKey, ChecklistItem> = {
    logo: {
      key: "logo",
      done: !!orgRow.data?.logo_url,
      href: `/organizations/${orgSlug}/branding`,
    },
    members: {
      key: "members",
      done: (membersRes.count ?? 0) >= 2,
      href: "/users",
    },
    client: {
      key: "client",
      done: (clientsRes.count ?? 0) >= 1,
      href: "/clients",
    },
    project: {
      key: "project",
      done: (projectsRes.count ?? 0) >= 1,
      href: "/projects",
    },
    audit: {
      key: "audit",
      done: (auditsRes.count ?? 0) >= 1,
      href: "/audits/new",
    },
  };

  const keys = itemKeysForPersona(current.organizationType);
  const items: ChecklistItem[] = keys.map((k) => ALL_ITEMS[k]);

  const completed = items.filter((i) => i.done).length;
  const total = items.length;
  // Disparaît une fois que tout est fait — pas besoin de polluer le dashboard
  // d'une org établie. Si la donnée régresse (perte de logo, etc.), il
  // revient — comportement attendu.
  if (completed === total) return null;

  const t = await getTranslations("dashboard.onboarding");
  const percent = Math.round((completed / total) * 100);

  return (
    <Card
      role="region"
      aria-label={t("title", { name: current.organizationName })}
      className="border-primary/20 bg-primary/5"
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles
              className="h-4 w-4 text-primary"
              aria-hidden="true"
            />
            {t("title", { name: current.organizationName })}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("subtitle", { completed, total })}
          </p>
        </div>
        <div
          className="shrink-0 text-right"
          aria-label={t("progressAria", { percent })}
        >
          <p className="text-2xl font-semibold tabular-nums text-primary">
            {percent}%
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  item.done && "opacity-70",
                )}
                aria-current={item.done ? "step" : undefined}
              >
                {item.done ? (
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/30 text-muted-foreground/50"
                  >
                    <Circle className="h-3 w-3 fill-current" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "font-medium",
                      item.done && "text-muted-foreground line-through",
                    )}
                  >
                    {t(`items.${item.key}.label`)}
                  </p>
                  {!item.done && (
                    <p className="text-xs text-muted-foreground">
                      {t(`items.${item.key}.description`)}
                    </p>
                  )}
                </div>
                {!item.done && (
                  <span className="shrink-0 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    {t("itemCta")}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
