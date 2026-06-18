// Comptage de l'usage par organisation pour application des limites de plan.
// Toutes les requêtes sont scopées via le helper SQL `current_org()` (RLS),
// ou explicitement par `organization_id` pour les versions "by org".

import "server-only";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// max_active_audits - audits "actifs" = pas dans un statut terminal.
// ============================================================================
// Terminaux (ne comptent pas pour la limite) : ARCHIVED, ONLINE, COMPLETED.
// Tous les autres (PENDING, PLANNED, IN_PROGRESS, DELIVERED, REMEDIATION,
// COUNTER_AUDIT) comptent comme "actifs" - c'est ce que l'utilisateur
// suit en cours dans son tableau de bord.
const TERMINAL_STATUSES = ["ARCHIVED", "ONLINE", "COMPLETED"];

export async function countActiveAuditsInOrg(
  organizationId: string,
): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("audits")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .not("status", "in", `(${TERMINAL_STATUSES.join(",")})`);
  return count ?? 0;
}

// ============================================================================
// max_audits_per_month - audits créés dans le mois calendaire courant.
// ============================================================================
export async function countAuditsCreatedThisMonthInOrg(
  organizationId: string,
): Promise<number> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const supabase = await createClient();
  const { count } = await supabase
    .from("audits")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("created_at", start);
  return count ?? 0;
}

// ============================================================================
// max_members - membres de l'organisation.
// ============================================================================
export async function countMembersInOrg(
  organizationId: string,
): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("organization_members")
    .select("user_id", { count: "exact", head: true })
    .eq("organization_id", organizationId);
  return count ?? 0;
}

// ============================================================================
// max_clients - clients distincts dans le carnet d'adresses de l'org.
// ============================================================================
export async function countClientsInOrg(
  organizationId: string,
): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);
  return count ?? 0;
}

// ============================================================================
// Snapshot d'usage pour la page billing
// ============================================================================
export interface OrgUsageSnapshot {
  activeAudits: number;
  auditsThisMonth: number;
  members: number;
  clients: number;
}

export async function getOrgUsageSnapshot(
  organizationId: string,
): Promise<OrgUsageSnapshot> {
  const [activeAudits, auditsThisMonth, members, clients] = await Promise.all([
    countActiveAuditsInOrg(organizationId),
    countAuditsCreatedThisMonthInOrg(organizationId),
    countMembersInOrg(organizationId),
    countClientsInOrg(organizationId),
  ]);
  return { activeAudits, auditsThisMonth, members, clients };
}
