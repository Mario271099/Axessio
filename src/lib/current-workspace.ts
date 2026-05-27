// Helpers serveur pour la résolution des workspaces. Pendant du module
// `current-org.ts` mais un cran plus fin : on liste les workspaces de l'org
// active et on permet la création.
//
// Pas de "current workspace" persisté pour l'instant — l'UI peut faire ce
// filtrage via un query-param `?workspace=...` sans avoir à toucher la DB.

import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { WorkspaceMembership, OrgRole } from "@/types/domain";

interface RawMyWorkspaceRow {
  workspace_id: string;
  organization_id: string;
  slug: string;
  name: string;
  description: string | null;
  is_default: boolean;
  is_archived: boolean;
  effective_role: OrgRole | null;
}

/** Tous les workspaces visibles par l'utilisateur courant (toutes orgs). */
export async function loadMyWorkspaces(): Promise<WorkspaceMembership[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_workspaces");
  if (error || !Array.isArray(data)) return [];
  return (data as RawMyWorkspaceRow[]).map((row) => ({
    workspaceId: row.workspace_id,
    organizationId: row.organization_id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    isDefault: row.is_default,
    isArchived: row.is_archived,
    effectiveRole: row.effective_role ?? "guest",
  }));
}

/** Workspaces d'une organisation donnée. */
export async function loadWorkspacesOf(
  organizationId: string,
): Promise<WorkspaceMembership[]> {
  const all = await loadMyWorkspaces();
  return all.filter((w) => w.organizationId === organizationId);
}

/** Lookup par slug (utile pour les pages /workspaces/[wsSlug]). */
export async function getWorkspaceBySlug(
  organizationId: string,
  slug: string,
): Promise<WorkspaceMembership | null> {
  const all = await loadWorkspacesOf(organizationId);
  return all.find((w) => w.slug === slug) ?? null;
}
