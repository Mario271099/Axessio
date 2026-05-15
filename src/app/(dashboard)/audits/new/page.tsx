import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AuditForm } from "./audit-form";
import type { ReferenceType } from "@/types/domain";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nouvel audit" };

export default async function NewAuditPage() {
  const profile = await requireProfile();

  // Sécurité : seuls les auditors créent des audits
  if (profile.role !== "auditor") {
    redirect("/audits");
  }

  const supabase = await createClient();

  const [{ data: projectsData }, { data: referencesData }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, client:clients(name)")
      .order("name"),
    supabase
      .from("references")
      .select("id, type, version")
      .eq("is_active", true)
      .order("type"),
  ]);

  const projects = (projectsData ?? []).map((p) => {
    const client = Array.isArray(p.client) ? p.client[0] : p.client;
    return {
      id: p.id,
      name: p.name,
      clientName: client?.name ?? "—",
    };
  });

  const references = (referencesData ?? []).map((r) => ({
    id: r.id,
    type: r.type as ReferenceType,
    version: r.version,
  }));

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-6 md:p-8">
      {/* Breadcrumb ----------------------------------------------------- */}
      <nav
        aria-label="Fil d'Ariane"
        className="flex items-center gap-1 text-xs text-muted-foreground"
      >
        <Link
          href="/audits"
          className="rounded px-1 py-0.5 hover:bg-accent hover:text-foreground"
        >
          Audits
        </Link>
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        <span className="rounded px-1 py-0.5 font-medium text-foreground">
          Nouvel audit
        </span>
      </nav>

      {/* Header --------------------------------------------------------- */}
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Nouvel audit
        </h1>
        <p className="text-sm text-muted-foreground">
          Créez un audit en 3 étapes. Les pages obligatoires seront ajoutées
          automatiquement.
        </p>
      </header>

      <AuditForm projects={projects} references={references} />
    </div>
  );
}
