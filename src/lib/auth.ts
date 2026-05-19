import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/domain";

interface ProfileRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  client_id: string | null;
  language: string;
  is_active?: boolean | null;
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role as UserRole,
    clientId: row.client_id,
    language: (row.language === "en" ? "en" : "fr") as Profile["language"],
  };
}

export async function requireProfile(): Promise<Profile> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, email, first_name, last_name, role, client_id, language, is_active",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Erreur de récupération du profil : ${error.message}`);
  }

  // Compte désactivé : on coupe la session et on redirige vers /login.
  // `is_active` peut être absent (anciens profils, bases pre-migration 15) ;
  // dans ce cas on traite comme actif pour ne pas verrouiller l'historique.
  if (data && data.is_active === false) {
    await supabase.auth.signOut();
    redirect("/login?reason=disabled");
  }

  // Profil manquant : on le crée à la volée
  if (!data) {
    const { data: created, error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email ?? "",
        first_name: "",
        last_name: "",
        role: "client" as UserRole,
        client_id: null,
        language: "fr",
      })
      .select("id, email, first_name, last_name, role, client_id, language")
      .single();

    if (insertError || !created) {
      throw new Error("Profil utilisateur introuvable et impossible à créer.");
    }

    return mapProfile(created);
  }

  return mapProfile(data);
}
