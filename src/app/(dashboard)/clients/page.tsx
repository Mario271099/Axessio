import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ClientsList, type ClientListItem } from "./clients-list";

export default async function ClientsPage() {
  const profile = await requireProfile();
  const t = await getTranslations("clients");

  if (profile.role !== "auditor") {
    return (
      <div className="container mx-auto max-w-3xl p-6 md:p-8">
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive"
        >
          {t("auditorOnly")}
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("clients")
    .select(
      "id, name, website, contact_email, is_active, created_at, projects(id, audits(id))",
    )
    .order("name")
    .limit(200);

  if (error) {
    return (
      <div className="container mx-auto max-w-3xl p-6 md:p-8">
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive"
        >
          {t("loadError", { message: error.message })}
        </div>
      </div>
    );
  }

  type ClientRow = {
    id: string;
    name: string;
    website: string | null;
    contact_email: string | null;
    is_active: boolean | null;
    created_at: string;
    projects: { id: string; audits: { id: string }[] | null }[] | null;
  };

  const clients: ClientListItem[] = ((rows ?? []) as ClientRow[]).map((c) => {
    const projects = c.projects ?? [];
    const projectCount = projects.length;
    const auditCount = projects.reduce(
      (acc, p) => acc + (p.audits?.length ?? 0),
      0,
    );
    return {
      id: c.id,
      name: c.name,
      website: c.website,
      contactEmail: c.contact_email,
      isActive: c.is_active ?? true,
      createdAt: c.created_at,
      projectCount,
      auditCount,
    };
  });

  return <ClientsList clients={clients} />;
}
