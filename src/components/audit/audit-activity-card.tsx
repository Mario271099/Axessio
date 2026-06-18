// Server component qui rend les 10 dernières entrées de `audit_logs` pour
// l'audit courant. Donne un fil chronologique des changements (transitions
// de statut, assignations, invitations contact, cycle de relecture) sans
// devoir aller dans le journal global de l'org.
//
// Choix :
//   - Server-only : la query Supabase est légère, profite de la RLS
//     audit_logs existante, pas besoin d'interactivité.
//   - Limit 10 : suffisant pour la sidebar de détail audit. Un lien
//     « voir tout » renvoie vers /organizations/[slug]/audit-logs filtré.
//   - i18n par action : chaque code (status.transition, assignee.added…)
//     a son entrée dans messages/*.json. Action inconnue → raw code.

import Link from "next/link";
import { getTranslations, getFormatter } from "next-intl/server";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  History,
  Mail,
  MessageCircle,
  RotateCcw,
  UserMinus,
  UserPlus,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AuditActivityCardProps {
  auditId: string;
  /** Slug de l'org pour générer le lien « voir tout ». Null = pas de lien. */
  orgSlug: string | null;
}

interface LogRow {
  id: string;
  created_at: string;
  action: string;
  actor_id: string | null;
  payload: Record<string, unknown> | null;
  actor: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}

const ACTION_ICONS: Record<string, LucideIcon> = {
  "status.transition": ArrowRight,
  "status.auto_transition": ArrowRight,
  "status.reverted": RotateCcw,
  "assignee.added": UserPlus,
  "assignee.removed": UserMinus,
  "proofreader.assigned": Eye,
  "proofreader.removed": UserMinus,
  "contact.invited": Mail,
  "contact.removed": UserMinus,
  "nc.review_opened": MessageCircle,
  "nc.review_requested": MessageCircle,
  "nc.review_approved": CheckCircle2,
  "nc.review_changes_requested": MessageCircle,
  "nc.review_cancelled": XCircle,
};

// Actions reconnues côté i18n. Toute action hors de cette liste tombe sur
// un rendu brut (raw code). Garder cette liste à jour à mesure que de
// nouveaux types d'événements sont ajoutés à audit_logs.
const KNOWN_ACTIONS = new Set([
  "status.transition",
  "status.auto_transition",
  "status.reverted",
  "assignee.added",
  "assignee.removed",
  "proofreader.assigned",
  "proofreader.removed",
  "contact.invited",
  "contact.removed",
  "nc.review_opened",
  "nc.review_requested",
  "nc.review_approved",
  "nc.review_changes_requested",
  "nc.review_cancelled",
]);

function formatActor(actor: LogRow["actor"]): string | null {
  if (!actor) return null;
  const name = [actor.first_name, actor.last_name]
    .filter((v): v is string => Boolean(v && v.trim()))
    .join(" ")
    .trim();
  return name || actor.email || null;
}

export async function AuditActivityCard({
  auditId,
  orgSlug,
}: AuditActivityCardProps) {
  const t = await getTranslations("audits.detail.activity");
  const tActions = await getTranslations("audits.detail.activity.actions");
  const tStatus = await getTranslations("constants.auditStatus");
  const format = await getFormatter();
  const supabase = await createClient();

  const { data } = await supabase
    .from("audit_logs")
    .select(
      `id, created_at, action, actor_id, payload,
       actor:profiles!audit_logs_actor_id_fkey(first_name, last_name, email)`,
    )
    .eq("audit_id", auditId)
    .order("created_at", { ascending: false })
    .limit(10);

  const logs = (data ?? []) as unknown as LogRow[];

  function renderAction(row: LogRow): string {
    if (!KNOWN_ACTIONS.has(row.action)) return row.action;
    // next-intl utilise le `.` comme séparateur de namespace - on doit
    // donc translate-r le code d'action ("status.transition") vers une
    // clé valide ("status_transition") avant le lookup.
    const i18nKey = row.action.replaceAll(".", "_");
    const p = row.payload ?? {};
    if (
      row.action === "status.transition" ||
      row.action === "status.auto_transition" ||
      row.action === "status.reverted"
    ) {
      const from = typeof p.from === "string" ? tStatus(p.from) : "?";
      const to = typeof p.to === "string" ? tStatus(p.to) : "?";
      return tActions(i18nKey, { from, to });
    }
    return tActions(i18nKey);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{t("title")}</CardTitle>
        {orgSlug && logs.length > 0 && (
          <Link
            href={`/organizations/${orgSlug}/audit-logs?auditId=${auditId}`}
            className="rounded text-xs text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {t("viewAll")}
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ol className="space-y-3">
            {logs.map((row) => {
              const Icon = ACTION_ICONS[row.action] ?? History;
              const actor = formatActor(row.actor) ?? t("systemActor");
              return (
                <li key={row.id} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                  >
                    <Icon className="h-3 w-3" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-sm">
                      <span className="font-medium">{actor}</span>{" "}
                      <span>{renderAction(row)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format.relativeTime(new Date(row.created_at))}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
