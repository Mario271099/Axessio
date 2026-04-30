import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/domain";

/**
 * Récupère le profil de l'utilisateur authentifié.
 * Redirige vers /login si la session est invalide.
 *
 * À utiliser dans les Server Components des routes protégées.
 */
export async function requireProfile(): Promise<Profile> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, role, client_id, language")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    // Profil manquant : déconnexion forcée
    await supabase.auth.signOut();
    redirect("/login");
  }

  return {
    id: data.id,
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
    role: data.role as UserRole,
    clientId: data.client_id,
    language: (data.language === "en" ? "en" : "fr") as Profile["language"],
  };
}
