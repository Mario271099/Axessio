import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { NCSeverity } from "@/types/domain";
import { NCDetail, type NCData } from "./nc-detail";

interface PageProps {
  params: Promise<{ uuid: string; ncId: string }>;
}

export default async function NCDetailPage({ params }: PageProps) {
  const profile = await requireProfile();
  const { uuid, ncId } = await params;
  const supabase = await createClient();

  // 1) NC complète + critère + page
  const { data: ncRow, error: ncError } = await supabase
    .from("non_conformities")
    .select(
      `
      id, title, description, actual_result, recommendation,
      severity, status, page_id, test_reference,
      criterion:criteria!inner(id, identifier, name, url, methodology),
      page:pages(id, name)
    `,
    )
    .eq("id", ncId)
    .eq("audit_id", uuid)
    .maybeSingle();

  if (ncError || !ncRow) {
    notFound();
  }

  const criterion = Array.isArray(ncRow.criterion)
    ? ncRow.criterion[0]
    : ncRow.criterion;
  const page = Array.isArray(ncRow.page) ? ncRow.page[0] : ncRow.page;

  const nc: NCData = {
    id: ncRow.id as string,
    title: ncRow.title as string,
    description: (ncRow.description as string | null) ?? null,
    actualResult: (ncRow.actual_result as string | null) ?? null,
    recommendation: (ncRow.recommendation as string | null) ?? null,
    severity: ncRow.severity as NCSeverity,
    status: ncRow.status as string,
    pageId: (ncRow.page_id as string | null) ?? null,
    testReference: (ncRow.test_reference as string | null) ?? null,
    criterion: criterion
      ? {
          id: criterion.id as string,
          identifier: criterion.identifier as string,
          name: criterion.name as string,
          url: (criterion.url as string | null) ?? null,
          methodology: (criterion.methodology as string | null) ?? null,
        }
      : null,
    page: page ? { id: page.id as string, name: page.name as string } : null,
  };

  // 2) Messages + auteur
  const { data: messagesRows } = await supabase
    .from("nc_messages")
    .select(
      `
      id, body, created_at, author_id,
      author:profiles(first_name, last_name)
    `,
    )
    .eq("non_conformity_id", ncId)
    .order("created_at", { ascending: true });

  const messages = (messagesRows ?? []).map((m) => {
    const author = Array.isArray(m.author) ? m.author[0] : m.author;
    return {
      id: m.id as string,
      body: m.body as string,
      createdAt: m.created_at as string,
      authorId: m.author_id as string,
      author: author
        ? {
            firstName: (author.first_name as string) ?? "",
            lastName: (author.last_name as string) ?? "",
          }
        : null,
    };
  });

  // 3) Pièces jointes
  const { data: attachmentRows } = await supabase
    .from("nc_attachments")
    .select(
      "id, storage_path, file_name, file_size, mime_type, uploaded_by, created_at",
    )
    .eq("non_conformity_id", ncId)
    .order("created_at", { ascending: true });

  const attachmentsBase = (attachmentRows ?? []).map((a) => ({
    id: a.id as string,
    storagePath: a.storage_path as string,
    fileName: (a.file_name as string | null) ?? null,
    fileSize: (a.file_size as number | null) ?? null,
    mimeType: (a.mime_type as string | null) ?? null,
    uploadedBy: (a.uploaded_by as string | null) ?? null,
    createdAt: a.created_at as string,
  }));

  // URLs signées (1h) pour afficher les images / ouvrir les PDF
  const attachments = await Promise.all(
    attachmentsBase.map(async (a) => {
      const { data } = await supabase.storage
        .from("nc-attachments")
        .createSignedUrl(a.storagePath, 3600);
      return { ...a, signedUrl: data?.signedUrl ?? null };
    }),
  );

  // 4) Pages de l'audit + nom du projet (pour le breadcrumb)
  const [auditPagesRes, auditRes] = await Promise.all([
    supabase
      .from("pages")
      .select("id, name, sort_order")
      .eq("audit_id", uuid)
      .order("sort_order", { ascending: true }),
    supabase
      .from("audits")
      .select(`project:projects(name)`)
      .eq("id", uuid)
      .maybeSingle(),
  ]);

  const auditPages = (auditPagesRes.data ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
  }));

  const projectRow = auditRes.data?.project
    ? Array.isArray(auditRes.data.project)
      ? auditRes.data.project[0]
      : auditRes.data.project
    : null;
  const auditTitle = projectRow?.name ?? "Audit";

  return (
    <NCDetail
      nc={nc}
      pages={auditPages}
      messages={messages}
      attachments={attachments}
      auditId={uuid}
      auditTitle={auditTitle}
      profile={{ role: profile.role, id: profile.id }}
    />
  );
}
