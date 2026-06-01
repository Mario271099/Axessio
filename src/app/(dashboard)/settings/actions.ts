"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LOCALE_COOKIE, isLocale, type Locale } from "@/i18n/config";

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
