// Helpers serveur pour gérer l'organisation active de l'utilisateur courant.
//
// L'org active est mémorisée dans un cookie HTTP-only signé (server-side).
// Le code lit ce cookie, valide que l'utilisateur est bien membre de l'org
// désignée, et fournit un fallback (première org de la liste) sinon.
//
// La validation est CRUCIALE : sans elle, un user pourrait poser un cookie
// arbitraire et voir des données d'une autre org. La validation passe par
// `organization_members` côté DB.

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { OrganizationMembership, OrgRole, OrgType } from "@/types/domain";

const COOKIE_NAME = "axessio-current-org";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 an

/**
 * Charge toutes les organisations dont l'utilisateur authentifié est membre.
 * RPC `my_organizations()` filtre déjà par `auth.uid()` (SECURITY DEFINER).
 */
export async function loadMyOrganizations(): Promise<OrganizationMembership[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_organizations");
  if (error || !data) return [];
  return (data as RawMembership[]).map((row) => ({
    organizationId: row.organization_id,
    organizationName: row.org_name,
    organizationSlug: row.org_slug,
    organizationType: row.org_type,
    role: row.role,
  }));
}

interface RawMembership {
  organization_id: string;
  role: OrgRole;
  org_name: string;
  org_slug: string;
  org_type: OrgType;
}

/**
 * Détermine l'organisation active de l'utilisateur :
 *   1. Cookie présent et user est membre de l'org du cookie → cette org.
 *   2. Sinon, première org du listing (par nom).
 *   3. Si aucune org : null (cas pathologique, profil non rattaché).
 *
 * Retourne aussi la liste complète pour usage UI (org-switcher).
 */
export async function resolveCurrentOrg(): Promise<{
  current: OrganizationMembership | null;
  available: OrganizationMembership[];
}> {
  const available = await loadMyOrganizations();
  if (available.length === 0) {
    return { current: null, available };
  }

  const cookieStore = await cookies();
  const cookieOrgId = cookieStore.get(COOKIE_NAME)?.value ?? null;

  const matched = cookieOrgId
    ? (available.find((m) => m.organizationId === cookieOrgId) ?? null)
    : null;

  return {
    current: matched ?? available[0] ?? null,
    available,
  };
}

/**
 * Change l'org active de l'utilisateur courant. Appelé depuis une server
 * action après vérification que l'utilisateur est bien membre de la cible.
 */
export async function setCurrentOrgCookie(orgId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, orgId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

/**
 * Supprime le cookie (utilisé au logout pour éviter qu'un autre user sur la
 * même machine hérite de l'org de son prédécesseur).
 */
export async function clearCurrentOrgCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
