import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { NCReviewStatus, NCSeverity } from "@/types/domain";
import { NCDetail, type NCData } from "./nc-detail";
import { openNCReview } from "./review-actions";

interface PageProps {
  params: Promise<{ uuid: string; ncId: string }>;
}

export default async function NCDetailPage({ params }: PageProps) {
  const profile = await requireProfile();
  const { uuid, ncId } = await params;
  const supabase = await createClient();

  // 1) NC complète + critère + page + statut de relecture
  const { data: ncRow, error: ncError } = await supabase
    .from("non_conformities")
    .select(
      `
      id, title, description, actual_result, recommendation,
      severity, status, page_id, test_reference, review_status,
      display_number,
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
    reviewStatus: (ncRow.review_status ?? "not_requested") as NCReviewStatus,
    displayNumber: Number(ncRow.display_number ?? 0),
  };

  // 1bis) NC voisines (précédente / suivante) au sein de l'audit, dans
  // l'ordre de création. Deux requêtes minimalistes côté Supabase.
  const currentNumber = nc.displayNumber;
  const [{ data: prevRow }, { data: nextRow }] = await Promise.all([
    currentNumber > 0
      ? supabase
          .from("non_conformities")
          .select("id, display_number")
          .eq("audit_id", uuid)
          .lt("display_number", currentNumber)
          .order("display_number", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("non_conformities")
      .select("id, display_number")
      .eq("audit_id", uuid)
      .gt("display_number", currentNumber)
      .order("display_number", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const prevNC = prevRow
    ? {
        id: prevRow.id as string,
        displayNumber: Number(prevRow.display_number ?? 0),
      }
    : null;
  const nextNC = nextRow
    ? {
        id: nextRow.id as string,
        displayNumber: Number(nextRow.display_number ?? 0),
      }
    : null;

  // 2) Messages (tous fils confondus) + auteur. La RLS (migration 37) filtre
  // déjà selon le thread et le rôle de l'utilisateur — pas besoin de filtrer
  // côté serveur ici.
  const { data: messagesRows } = await supabase
    .from("nc_messages")
    .select(
      `
      id, body, created_at, author_id, thread,
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
      thread: (m.thread ?? "client") as "client" | "review",
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

  // 5) Rôle d'assignment de l'utilisateur sur l'audit (auditor / proofreader /
  // admin / none). Détermine les boutons d'action de relecture + l'accès au
  // fil 'review' côté UI. Admin court-circuite.
  let userAssignmentRole: "auditor" | "proofreader" | "admin" | "none" = "none";
  if (profile.role === "admin") {
    userAssignmentRole = "admin";
  } else {
    const { data: myAssignments } = await supabase
      .from("audit_assignees")
      .select("role")
      .eq("audit_id", uuid)
      .eq("profile_id", profile.id);
    const roles = (myAssignments ?? []).map((r) => r.role as string);
    if (roles.includes("auditor")) userAssignmentRole = "auditor";
    else if (roles.includes("proofreader")) userAssignmentRole = "proofreader";
  }

  // 6) Auto-bascule pending → under_review quand un relecteur ouvre la NC.
  // Best-effort, on n'attend pas le résultat — le rendu utilise le statut
  // fraîchement chargé même si la transition n'a pas encore eu lieu (rafraîchi
  // au prochain affichage).
  if (
    (userAssignmentRole === "proofreader" ||
      userAssignmentRole === "admin") &&
    nc.reviewStatus === "pending"
  ) {
    await openNCReview(ncId).catch(() => {});
    nc.reviewStatus = "under_review";
  }

  return (
    <NCDetail
      nc={nc}
      pages={auditPages}
      messages={messages}
      attachments={attachments}
      auditId={uuid}
      auditTitle={auditTitle}
      profile={{ role: profile.role, id: profile.id }}
      userAssignmentRole={userAssignmentRole}
      prevNC={prevNC}
      nextNC={nextNC}
    />
  );
}
