import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/domain";
import { UsersList, type UserListItem, type ClientOption } from "./users-list";

export default async function UsersPage() {
  const profile = await requireProfile();

  if (profile.role !== "auditor") {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  const [
    { data: rows, error: usersError },
    { data: clientRows, error: clientsError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, email, first_name, last_name, role, client_id, is_active, created_at, last_login_at, email_confirmed_at, client:clients(id, name)",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("clients")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
  ]);

  if (usersError) {
    return (
      <div className="container mx-auto max-w-3xl p-6 md:p-8">
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive"
        >
          Erreur de chargement des utilisateurs : {usersError.message}
        </div>
      </div>
    );
  }
  if (clientsError) {
    return (
      <div className="container mx-auto max-w-3xl p-6 md:p-8">
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive"
        >
          Erreur de chargement des clients : {clientsError.message}
        </div>
      </div>
    );
  }

  type UserRow = {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: string;
    client_id: string | null;
    is_active: boolean | null;
    created_at: string;
    last_login_at: string | null;
    email_confirmed_at: string | null;
    client: { id: string; name: string } | { id: string; name: string }[] | null;
  };

  const users: UserListItem[] = ((rows ?? []) as UserRow[]).map((u) => {
    const client = Array.isArray(u.client) ? u.client[0] : u.client;
    return {
      id: u.id,
      email: u.email,
      firstName: u.first_name ?? "",
      lastName: u.last_name ?? "",
      role: u.role as UserRole,
      clientId: u.client_id,
      clientName: client?.name ?? null,
      isActive: u.is_active ?? true,
      createdAt: u.created_at,
      hasLoggedIn: u.last_login_at !== null,
      isEmailConfirmed: u.email_confirmed_at !== null,
    };
  });

  const clients: ClientOption[] = (clientRows ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
  }));

  return (
    <UsersList
      users={users}
      clients={clients}
      currentUserId={profile.id}
    />
  );
}
