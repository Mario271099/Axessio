"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LOCALE_COOKIE, isLocale, type Locale } from "@/i18n/config";
import {
  NOTIFICATION_TYPES,
  type NotificationType,
} from "./notification-types";

export interface SettingsActionResult {
  error: string | null;
  success?: boolean;
  avatarUrl?: string | null;
}

const MAX_NAME_LENGTH = 80;
const MIN_PASSWORD_LENGTH = 8;
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 Mo — aligné sur le bucket SQL.
const ALLOWED_AVATAR_MIMES: ReadonlySet<string> = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);
const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

// ============================================================================
// Mise à jour du profil (prénom, nom, langue)
// ============================================================================
export async function updateProfile(
  formData: FormData,
): Promise<SettingsActionResult> {
  const t = await getTranslations("settings.errors");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: (await getTranslations("errors"))("notAuthenticated") };
  }

  const firstName = (formData.get("firstName") as string | null)?.trim().slice(0, MAX_NAME_LENGTH) ?? "";
  const lastName = (formData.get("lastName") as string | null)?.trim().slice(0, MAX_NAME_LENGTH) ?? "";
  const language = (formData.get("language") as string | null)?.trim() ?? "fr";

  if (!firstName) return { error: t("firstNameRequired") };
  if (!lastName) return { error: t("lastNameRequired") };
  if (!isLocale(language)) return { error: t("invalidLanguage") };

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      language,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  // Persiste la langue dans le cookie pour que le prochain render serve les
  // bons libellés sans attendre un re-login.
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, language as Locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { error: null, success: true };
}

// ============================================================================
// Changement de mot de passe (vérifie l'actuel par re-signing avant d'updater)
// ============================================================================
export async function changePassword(
  formData: FormData,
): Promise<SettingsActionResult> {
  const t = await getTranslations("settings.errors");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return { error: (await getTranslations("errors"))("notAuthenticated") };
  }

  const currentPassword = (formData.get("currentPassword") as string | null) ?? "";
  const newPassword = (formData.get("newPassword") as string | null) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string | null) ?? "";

  if (!currentPassword) return { error: t("currentPasswordRequired") };
  if (newPassword.length < MIN_PASSWORD_LENGTH) return { error: t("newPasswordTooShort") };
  if (newPassword !== confirmPassword) return { error: t("passwordMismatch") };
  if (newPassword === currentPassword) return { error: t("sameAsCurrent") };

  // Vérifie l'actuel : on tente une connexion. Si elle échoue, le mot de
  // passe actuel saisi n'est pas le bon. Si elle réussit, la session est
  // simplement rafraîchie côté Supabase — aucune redirection requise.
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) {
    return { error: t("currentPasswordWrong") };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (updateError) return { error: updateError.message };

  revalidatePath("/settings");
  return { error: null, success: true };
}

// ============================================================================
// Upload d'avatar
// ----------------------------------------------------------------------------
// Le fichier est uploadé dans `avatars/<uid>/<random>.<ext>` puis l'URL
// publique est stockée dans `profiles.avatar_url`. À chaque nouvel upload on
// génère un UUID neuf pour casser le cache CDN (les anciennes URL restent
// valides en base de données mais ne sont plus référencées).
//
// On supprime l'ancien fichier au passage pour ne pas laisser de déchets
// dans le bucket. Best-effort : un échec ne bloque pas le nouvel avatar.
// ============================================================================
export async function uploadAvatar(
  formData: FormData,
): Promise<SettingsActionResult> {
  const t = await getTranslations("settings.errors");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: (await getTranslations("errors"))("notAuthenticated") };
  }

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: t("avatarFileRequired") };
  }
  if (file.size > MAX_AVATAR_SIZE) {
    return { error: t("avatarTooLarge") };
  }
  if (!ALLOWED_AVATAR_MIMES.has(file.type)) {
    return { error: t("avatarBadType") };
  }

  const ext = MIME_TO_EXT[file.type] ?? "png";
  const objectName = `${user.id}/${randomUUID()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(objectName, buffer, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });

  if (uploadError) return { error: uploadError.message };

  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(objectName);
  const publicUrl = pub?.publicUrl ?? null;

  // Avant de pointer sur le nouveau, on récupère l'ancien pour le nettoyer.
  const { data: prev } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (profileError) return { error: profileError.message };

  // Nettoyage best-effort de l'ancien objet (path extrait depuis l'URL).
  if (prev?.avatar_url) {
    const prevUrl: string = prev.avatar_url;
    const marker = "/avatars/";
    const idx = prevUrl.indexOf(marker);
    if (idx >= 0) {
      const prevPath = prevUrl.slice(idx + marker.length);
      if (prevPath && prevPath !== objectName) {
        await supabase.storage.from("avatars").remove([prevPath]);
      }
    }
  }

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { error: null, success: true, avatarUrl: publicUrl };
}

export async function deleteAvatar(): Promise<SettingsActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: (await getTranslations("errors"))("notAuthenticated") };
  }

  const { data: prev } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);
  if (error) return { error: error.message };

  if (prev?.avatar_url) {
    const prevUrl: string = prev.avatar_url;
    const marker = "/avatars/";
    const idx = prevUrl.indexOf(marker);
    if (idx >= 0) {
      const prevPath = prevUrl.slice(idx + marker.length);
      if (prevPath) {
        await supabase.storage.from("avatars").remove([prevPath]);
      }
    }
  }

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { error: null, success: true, avatarUrl: null };
}

// ============================================================================
// Suppression de compte (RGPD article 17)
// ----------------------------------------------------------------------------
// Étapes :
//  1. Vérifie que la chaîne de confirmation matche (anti-clic accidentel).
//  2. Empêche le dernier super-admin de se supprimer (laisserait la plateforme
//     sans admin) — sécurité de cohérence, indépendante du RBAC org.
//  3. Vérifie qu'aucune org n'a ce user comme `owner` unique — un owner doit
//     transférer avant de partir, sinon l'org devient orpheline.
//  4. Supprime via service-role : `auth.users` cascade sur `profiles` (FK
//     `on delete cascade` posée en migration 02). Les audit_logs avec
//     `actor_id = ce user` se voient appliquer `on delete set null` (en
//     migration 23), donc l'historique reste lisible.
//  5. Signe out + redirect vers /login.
// ============================================================================
// ============================================================================
// Préférences de notification
// ----------------------------------------------------------------------------
// Les types acceptés sont ceux émis par les triggers SQL (cf. migration 63).
// Toute écriture sur un type non listé est rejetée pour éviter d'amasser des
// lignes orphelines au gré des renommages de types côté trigger.
// Catalogue partagé client/serveur : voir `notification-types.ts`.
// ============================================================================
export async function getNotificationPreferences(): Promise<
  Record<NotificationType, boolean>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const defaults = Object.fromEntries(
    NOTIFICATION_TYPES.map((t) => [t, true]),
  ) as Record<NotificationType, boolean>;
  if (!user) return defaults;

  const { data } = await supabase
    .from("notification_preferences")
    .select("type, enabled")
    .eq("user_id", user.id);

  for (const row of data ?? []) {
    const type = row.type as string;
    if ((NOTIFICATION_TYPES as readonly string[]).includes(type)) {
      defaults[type as NotificationType] = row.enabled as boolean;
    }
  }
  return defaults;
}

export async function setNotificationPreference(
  type: NotificationType,
  enabled: boolean,
): Promise<SettingsActionResult> {
  const tCommon = await getTranslations("errors");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: tCommon("notAuthenticated") };

  if (!(NOTIFICATION_TYPES as readonly string[]).includes(type)) {
    return { error: tCommon("forbidden") };
  }

  const { error } = await supabase
    .from("notification_preferences")
    .upsert(
      { user_id: user.id, type, enabled, updated_at: new Date().toISOString() },
      { onConflict: "user_id,type" },
    );
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { error: null, success: true };
}

// ============================================================================
// MFA TOTP (Supabase Auth MFA)
// ----------------------------------------------------------------------------
// Flux d'activation :
//  1. enrollMfa() crée un facteur TOTP en statut "unverified" et renvoie
//     QR code + secret. L'UI affiche le QR pour scan dans une app
//     authenticator (1Password, Google Authenticator, Authy, etc.).
//  2. verifyMfaEnrollment(factorId, code) challenge + vérifie le 1er code
//     généré par l'app. À succès, le facteur passe en "verified" et
//     l'AAL de la session monte à 'aal2'.
//
// Flux de désactivation :
//  - unenrollMfa(factorId, code) : le user doit ressaisir un code valide,
//    on appelle challengeAndVerify (qui monte aussi l'AAL à aal2) puis
//    on supprime le facteur.
//
// Annulation pendant l'enrollement :
//  - cancelMfaEnrollment(factorId) supprime simplement un facteur encore
//    unverified — pas besoin d'aal2 puisqu'il n'a jamais été activé.
// ============================================================================
export interface MfaStatus {
  enabled: boolean;
  factorId: string | null;
}

export interface MfaEnrollResult extends SettingsActionResult {
  factorId?: string;
  qrCode?: string;
  secret?: string;
  uri?: string;
}

export async function getMfaStatus(): Promise<MfaStatus> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error || !data) return { enabled: false, factorId: null };
  const verified = data.totp.find((f) => f.status === "verified");
  return { enabled: !!verified, factorId: verified?.id ?? null };
}

export async function enrollMfa(): Promise<MfaEnrollResult> {
  const tCommon = await getTranslations("errors");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: tCommon("notAuthenticated") };

  // Si un facteur unverified traîne d'un précédent essai abandonné, on le
  // nettoie pour repartir d'un état propre (Supabase ne permet qu'un seul
  // facteur TOTP par user).
  const { data: factors } = await supabase.auth.mfa.listFactors();
  if (factors) {
    for (const f of factors.all) {
      if (f.factor_type === "totp" && f.status === "unverified") {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `Axessio (${user.email ?? user.id})`,
  });
  if (error || !data) return { error: error?.message ?? tCommon("forbidden") };

  return {
    error: null,
    success: true,
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
  };
}

export async function verifyMfaEnrollment(
  factorId: string,
  code: string,
): Promise<SettingsActionResult> {
  const t = await getTranslations("settings.errors");
  const tCommon = await getTranslations("errors");
  const supabase = await createClient();

  const trimmed = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(trimmed)) {
    return { error: t("mfaCodeInvalid") };
  }
  if (!factorId) return { error: tCommon("forbidden") };

  const { data: challengeData, error: challengeError } =
    await supabase.auth.mfa.challenge({ factorId });
  if (challengeError || !challengeData) {
    return { error: challengeError?.message ?? tCommon("forbidden") };
  }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challengeData.id,
    code: trimmed,
  });
  if (verifyError) return { error: t("mfaCodeRejected") };

  revalidatePath("/settings");
  return { error: null, success: true };
}

export async function unenrollMfa(
  factorId: string,
  code: string,
): Promise<SettingsActionResult> {
  const t = await getTranslations("settings.errors");
  const tCommon = await getTranslations("errors");
  const supabase = await createClient();

  const trimmed = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(trimmed)) {
    return { error: t("mfaCodeInvalid") };
  }
  if (!factorId) return { error: tCommon("forbidden") };

  // challengeAndVerify bump l'AAL de la session à aal2 — requis pour pouvoir
  // dénregistrer un facteur vérifié.
  const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code: trimmed,
  });
  if (verifyError) return { error: t("mfaCodeRejected") };

  const { error: unenrollError } = await supabase.auth.mfa.unenroll({
    factorId,
  });
  if (unenrollError) return { error: unenrollError.message };

  revalidatePath("/settings");
  return { error: null, success: true };
}

export async function cancelMfaEnrollment(
  factorId: string,
): Promise<SettingsActionResult> {
  const tCommon = await getTranslations("errors");
  const supabase = await createClient();
  if (!factorId) return { error: tCommon("forbidden") };

  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { error: null, success: true };
}

export async function deleteAccount(
  formData: FormData,
): Promise<SettingsActionResult> {
  const t = await getTranslations("settings.errors");
  const tCommon = await getTranslations("errors");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: tCommon("notAuthenticated") };

  const expected = (formData.get("confirm") as string | null)?.trim() ?? "";
  // La chaîne attendue est l'email — preuve que l'utilisateur lit ce qu'il
  // tape, et qu'il connaît son propre identifiant.
  if (!user.email || expected.toLowerCase() !== user.email.toLowerCase()) {
    return { error: t("deleteAccountConfirmMismatch") };
  }

  // Garde-fou : dernier super-admin.
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profileRow?.role === "admin") {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin")
      .eq("is_active", true);
    if ((count ?? 0) <= 1) {
      return { error: t("deleteAccountLastAdmin") };
    }
  }

  // Garde-fou : owner d'au moins une org (un owner doit transférer avant
  // de partir, sinon l'org se retrouve sans propriétaire après le delete
  // cascade sur organization_members).
  const { data: ownerships } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("role", "owner");
  if (ownerships && ownerships.length > 0) {
    return { error: t("deleteAccountOwnerOfOrgs") };
  }

  const admin = createAdminClient();
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) return { error: deleteError.message };

  await supabase.auth.signOut();

  // Cookie locale réinitialisé : le nouveau visiteur sur cette machine
  // retombe sur la détection navigateur (cf. proxy.ts).
  const cookieStore = await cookies();
  cookieStore.delete(LOCALE_COOKIE);

  redirect("/login?reason=account-deleted");
}
