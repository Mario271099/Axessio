// Système d'impersonation "View as" - UI uniquement, jamais d'élévation de
// privilèges. Le cookie `axessio-view-as` détient le rôle visé. Le serveur lit
// ce cookie pour adapter l'UI (sidebar, écrans en lecture seule, etc.) mais
// toutes les server actions s'appuient sur le rôle RÉEL du profil en base -
// un client_admin qui forgerait le cookie ne pourrait pas escalader.
//
// Règles métier (cf. canImpersonateAs dans permissions.ts) :
//   - admin   peut voir comme : client_admin, client
//   - auditor peut voir comme : client
//   - client_admin / client : interdits
//
// Le cookie est HttpOnly + SameSite=Lax + Secure (prod) + 8h max-age.

import "server-only";
import { cookies } from "next/headers";
import { canImpersonateAs } from "@/lib/permissions";
import type { UserRole } from "@/types/domain";

export const IMPERSONATION_COOKIE = "axessio-view-as";
const MAX_AGE_SECONDS = 8 * 60 * 60; // 8 heures

const VALID_ROLES: ReadonlyArray<UserRole> = [
  "admin",
  "auditor",
  "client_admin",
  "client",
];

function isValidRole(value: unknown): value is UserRole {
  return typeof value === "string" && (VALID_ROLES as string[]).includes(value);
}

/**
 * Lit le rôle d'impersonation depuis le cookie, sans aucune validation
 * d'autorisation. Utiliser `resolveEffectiveRole` pour appliquer la garde
 * (real role doit pouvoir impersonner ce target).
 */
export async function readImpersonationCookie(): Promise<UserRole | null> {
  const store = await cookies();
  const value = store.get(IMPERSONATION_COOKIE)?.value;
  return isValidRole(value) ? value : null;
}

/**
 * Calcule le rôle effectif (UI) en croisant le rôle réel avec le cookie
 * d'impersonation. Si le cookie pointe vers un rôle non autorisé pour ce
 * profil, on l'ignore (on ne lève pas - on retombe sur le rôle réel).
 *
 * `realRole` doit toujours provenir d'une source authentifiée (base profiles).
 */
export function resolveEffectiveRole(
  realRole: UserRole,
  cookieRole: UserRole | null,
): { effective: UserRole; impersonating: boolean } {
  if (!cookieRole || cookieRole === realRole) {
    return { effective: realRole, impersonating: false };
  }
  const allowed = canImpersonateAs(realRole);
  if (!allowed.includes(cookieRole)) {
    return { effective: realRole, impersonating: false };
  }
  return { effective: cookieRole, impersonating: true };
}

/**
 * Écrit le cookie d'impersonation. Appelée uniquement par les server actions
 * `enterImpersonation` (cf. `(dashboard)/admin/impersonation/actions.ts`).
 */
export async function setImpersonationCookie(target: UserRole): Promise<void> {
  const store = await cookies();
  store.set(IMPERSONATION_COOKIE, target, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

/** Efface le cookie d'impersonation. */
export async function clearImpersonationCookie(): Promise<void> {
  const store = await cookies();
  store.delete(IMPERSONATION_COOKIE);
}
