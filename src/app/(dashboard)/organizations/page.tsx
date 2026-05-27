import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Check, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { resolveCurrentOrg } from "@/lib/current-org";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SwitchOrgButton } from "./switch-org-button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("organizations");
  return { title: t("metaTitle") };
}

const TYPE_LABEL: Record<string, string> = {
  individual: "freelance",
  agency: "agence",
  company: "entreprise",
  enterprise: "enterprise",
};

export default async function OrganizationsPage() {
  await requireProfile();
  const t = await getTranslations("organizations");
  const { current, available } = await resolveCurrentOrg();

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6 md:p-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      {available.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Building2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium">{t("emptyTitle")}</p>
            <p className="text-xs text-muted-foreground">{t("emptyDesc")}</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {available.map((membership) => {
            const isCurrent =
              membership.organizationId === current?.organizationId;
            return (
              <li key={membership.organizationId}>
                <Card
                  className={cn(
                    "transition-all",
                    isCurrent && "ring-2 ring-primary/40",
                  )}
                >
                  <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        aria-hidden="true"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                      >
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base">
                          {membership.organizationName}
                          {isCurrent && (
                            <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                              <Check className="h-3 w-3" aria-hidden="true" />
                              {t("current")}
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="font-mono text-xs">
                            {membership.organizationSlug}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {TYPE_LABEL[membership.organizationType] ??
                              membership.organizationType}
                          </span>
                          <Badge
                            variant={isCurrent ? "default" : "muted"}
                            className="ml-1 text-[10px]"
                          >
                            {t(`role.${membership.role}`)}
                          </Badge>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {!isCurrent && (
                        <SwitchOrgButton
                          organizationId={membership.organizationId}
                        />
                      )}
                      <Link
                        href={`/organizations/${membership.organizationSlug}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                        aria-label={t("openDetail", {
                          name: membership.organizationName,
                        })}
                      >
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </CardHeader>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
