import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireProfile } from "@/lib/auth";
import {
  USER_ROLE_BADGE_VARIANT,
  USER_ROLE_LABELS,
} from "@/lib/constants";
import {
  can,
  canDebugPermissions,
  PERMISSIONS,
  type Permission,
} from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/domain";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("users.permissions");
  return { title: t("metaTitle") };
}

// Groupes d'affichage pour aérer la matrice. Toutes les permissions du module
// `lib/permissions.ts` doivent apparaître ici sinon elles ne s'affichent pas.
const GROUPS: Array<{
  key: string;
  permissions: Permission[];
}> = [
  {
    key: "audit",
    permissions: [
      "audit.view",
      "audit.edit",
      "audit.delete",
      "audit.assign_auditor",
    ],
  },
  { key: "matrix", permissions: ["matrix.edit"] },
  {
    key: "nc",
    permissions: [
      "nc.create",
      "nc.edit",
      "nc.delete",
      "nc.update_status_client",
    ],
  },
  {
    key: "collab",
    permissions: ["remediation.view", "chat.read", "chat.write"],
  },
  {
    key: "admin",
    permissions: ["client.manage", "project.manage", "user.manage"],
  },
  {
    key: "diagnostic",
    permissions: [
      "audit_logs.view_all",
      "impersonate",
      "permissions.debug",
    ],
  },
];

const ROLES: UserRole[] = ["admin", "auditor", "client_admin", "client"];

export default async function PermissionsDebugPage() {
  const profile = await requireProfile();

  // Garde stricte : seuls les profils avec `permissions.debug` accèdent ici.
  // Aujourd'hui c'est admin uniquement, mais on passe par le helper pour ne
  // pas hard-coder le rôle (et rester cohérent si la matrice évolue).
  if (!canDebugPermissions(profile.role)) {
    redirect("/dashboard");
  }

  const t = await getTranslations("users.permissions");

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6 md:p-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      {/* Totals par rôle */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((role) => {
          const count = PERMISSIONS[role].size;
          return (
            <Card key={role}>
              <CardContent className="space-y-2 p-4">
                <Badge
                  variant={USER_ROLE_BADGE_VARIANT[role]}
                  className="h-5 px-1.5 text-[10px]"
                >
                  {USER_ROLE_LABELS[role]}
                </Badge>
                <p className="text-2xl font-bold tabular-nums">
                  {count}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    / {Object.keys(PERMISSIONS[role]).length || ""} permissions
                  </span>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {GROUPS.map((group) => (
        <Card key={group.key}>
          <CardHeader>
            <CardTitle className="text-base">
              {t(`groups.${group.key}`)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">
                  {t("title")} — {t(`groups.${group.key}`)}
                </caption>
                <thead className="border-b border-border bg-muted/40">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="px-4 py-2 font-medium">
                      Permission
                    </th>
                    {ROLES.map((role) => (
                      <th
                        key={role}
                        scope="col"
                        className="px-4 py-2 text-center font-medium"
                      >
                        {USER_ROLE_LABELS[role]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {group.permissions.map((permission) => (
                    <tr key={permission} className="hover:bg-accent/30">
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm">
                            {/* next-intl utilise `.` comme séparateur de
                                namespace ; les codes de permission contiennent
                                des `.` (ex. `audit.view`), donc on remplace
                                par `_` pour matcher les clés JSON. */}
                            {t(`perm.${permission.replace(/\./g, "_")}`)}
                          </span>
                          <code className="font-mono text-[10px] text-muted-foreground">
                            {permission}
                          </code>
                        </div>
                      </td>
                      {ROLES.map((role) => {
                        const allowed = can(role, permission);
                        return (
                          <td
                            key={role}
                            className="px-4 py-2.5 text-center"
                            aria-label={`${USER_ROLE_LABELS[role]} : ${
                              allowed ? t("yes") : t("no")
                            }`}
                          >
                            {allowed ? (
                              <Check
                                className={cn(
                                  "inline-block h-4 w-4",
                                  "text-success",
                                )}
                                aria-hidden="true"
                              />
                            ) : (
                              <X
                                className="inline-block h-4 w-4 text-muted-foreground/40"
                                aria-hidden="true"
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
