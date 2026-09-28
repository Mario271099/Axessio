import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronLeft, Mail } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { monogram, themeColorVar } from "@/lib/utils";
import { InviteMemberForm } from "./members/invite-member-form";
import { OrgSettingsNav } from "./org-settings-nav";
import type { OrgRole, OrgType } from "@/types/domain";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const t = await getTranslations("organizations.detail");
  const { slug } = await params;
  return { title: t("metaTitle", { slug }) };
}

const TYPE_LABEL: Record<OrgType, string> = {
  individual: "Freelance",
  agency: "Agence",
  company: "Entreprise",
  enterprise: "Enterprise",
};

const ROLE_TONE: Record<
  OrgRole,
  "default" | "secondary" | "muted" | "success"
> = {
  owner: "success",
  admin: "default",
  auditor: "secondary",
  viewer: "muted",
};

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const profile = await requireProfile();
  const { slug } = await params;
  const supabase = await createClient();
  const t = await getTranslations("organizations.detail");
  const tRole = await getTranslations("organizations.role");
  const tInvite = await getTranslations("organizations.invite");

  const { data: org } = await supabase
    .from("organizations")
    .select("id, slug, name, type, billing_email, data_residency, created_at")
    .eq("slug", slug)
    .maybeSingle();

  if (!org) notFound();

  // Membres de l'org (jointure profiles).
  // `organization_members` a DEUX FK vers profiles (`user_id` et `invited_by`) :
  // on désambiguïse explicitement la jointure sur `user_id`, sinon PostgREST
  // refuse l'embed (« more than one relationship found ») et renvoie une erreur.
  const { data: memberRows } = await supabase
    .from("organization_members")
    .select(
      `role, joined_at,
       profile:profiles!organization_members_user_id_fkey(id, first_name, last_name, email, is_active)`,
    )
    .eq("organization_id", org.id)
    .order("joined_at", { ascending: true });

  type Row = {
    role: OrgRole;
    joined_at: string;
    profile:
      | {
          id: string;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          is_active: boolean | null;
        }
      | Array<{
          id: string;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          is_active: boolean | null;
        }>
      | null;
  };

  const members = ((memberRows ?? []) as Row[]).map((row) => {
    const p = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    const name = [p?.first_name, p?.last_name]
      .filter((v) => typeof v === "string" && v.trim().length > 0)
      .join(" ")
      .trim();
    return {
      id: p?.id ?? "",
      name: name || p?.email || "—",
      email: p?.email ?? null,
      role: row.role,
      joinedAt: row.joined_at,
      isActive: p?.is_active !== false,
    };
  });

  // Le formulaire d'invitation n'est visible que pour un owner/admin de CETTE
  // org (ou le super-admin plateforme). On lit l'appartenance par une requête
  // DIRECTE (et non en cherchant l'utilisateur dans la liste des membres, qui
  // dépend de la forme de la jointure et de la RLS) - la policy
  // `org_members_select` garantit que `user_id = auth.uid()` voit sa propre
  // ligne.
  const { data: myMembership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", org.id)
    .eq("user_id", profile.id)
    .maybeSingle();
  const myRole = myMembership?.role as OrgRole | undefined;
  const canInvite =
    profile.isPlatformAdmin || myRole === "owner" || myRole === "admin";

  return (
    <div className="space-y-5 px-4 pb-8 md:px-9">
      <div>
        <Link
          href="/organizations"
          className="inline-flex items-center gap-1.5 rounded-lg text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          {t("back")}
        </Link>
        <h1 className="mt-2 text-[2.125rem] font-black leading-tight tracking-tight">
          {org.name}
        </h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-base text-muted-foreground">
          <span>{TYPE_LABEL[org.type as OrgType] ?? org.type}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular">{org.slug}</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Mail className="size-4 shrink-0" aria-hidden="true" />
            {org.billing_email}
          </span>
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <OrgSettingsNav slug={org.slug} active="general" />

        <div className="flex min-w-0 flex-col gap-4">
          {/* Membres ---------------------------------------------------- */}
          <Card className="p-2.5">
            <div className="flex items-baseline justify-between gap-3 px-3 pb-2 pt-1.5">
              <h2 className="text-lg font-extrabold">{t("membersTitle")}</h2>
              <span className="text-sm tabular text-muted-foreground">
                {t("membersCount", { count: members.length })}
              </span>
            </div>

            <ul className="flex flex-col gap-0.5">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="axs-row grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-row px-3 py-2"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white"
                    style={{ background: themeColorVar(m.name) }}
                  >
                    {monogram(m.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{m.name}</span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {m.email ?? "—"}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <StatusDot
                      color={
                        m.isActive
                          ? "hsl(var(--success))"
                          : "hsl(var(--muted-foreground))"
                      }
                      className="hidden text-muted-foreground sm:inline-flex"
                    >
                      {m.isActive ? t("memberActive") : t("memberInactive")}
                    </StatusDot>
                    <Badge variant={ROLE_TONE[m.role]} size="sm">
                      {tRole(m.role)}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Inviter un membre - owner/admin de l'org uniquement -------- */}
          {canInvite && (
            <Card id="invite" className="scroll-mt-24 p-5">
              <h2 className="text-lg font-extrabold">{tInvite("title")}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {tInvite("subtitle")}
              </p>
              <div className="mt-3.5">
                <InviteMemberForm orgId={org.id} />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
