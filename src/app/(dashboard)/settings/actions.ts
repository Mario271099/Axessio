"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { LOCALE_COOKIE, isLocale, type Locale } from "@/i18n/config";

export interface SettingsActionResult {
  error: string | null;
  success?: boolean;
}

const MAX_NAME_LENGTH = 80;
const MIN_PASSWORD_LENGTH = 8;

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
