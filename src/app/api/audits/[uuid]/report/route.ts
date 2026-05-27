import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { orgHasFeature } from "@/lib/billing/server";
import { generatePDF, DEFAULT_FOOTER_TEMPLATE } from "@/lib/pdf";
import {
  renderReportHTML,
  type ReportData,
  type ReportLocale,
} from "./report-template";
import type {
  AuditStatus,
  ConformityStatus,
  NCSeverity,
  NCStatus,
  PageType,
  PlatformType,
  ReferenceType,
  ServiceType,
  WCAGLevel,
} from "@/types/domain";

// Le rendu PDF s'appuie sur Puppeteer (Node natif + binaire Chromium).
// Edge ne supporte ni l'un ni l'autre.
export const runtime = "nodejs";
// Le lancement de Chromium serverless peut prendre 5-15 s, puis le rendu HTML
// 1-10 s selon le volume. On laisse de la marge.
export const maxDuration = 60;
// Pas de cache — le contenu dépend de la session et des données mutables.
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ uuid: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  const { uuid: auditId } = await params;

  // Choix de langue : ?lang=fr|en > profile.language > "fr"
  const url = new URL(req.url);
  const langParam = url.searchParams.get("lang");

  const supabase = await createClient();

  // ------------------------------------------------------------------
  // 1. Authentification
  // ------------------------------------------------------------------
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, role, client_id, is_active, first_name, last_name, email, language",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.is_active === false) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  // ------------------------------------------------------------------
  // 1.bis Feature gate : `export.pdf` (Starter+).
  // Le check est server-side parce que l'URL `/api/audits/[uuid]/report`
  // peut être appelée directement (curl, automatisation) — il ne suffit
  // pas de masquer le bouton côté UI.
  // ------------------------------------------------------------------
  const hasExportFeature = await orgHasFeature("export.pdf");
  if (!hasExportFeature) {
    return NextResponse.json(
      {
        error:
          "L'export PDF est inclus à partir du plan Starter. Mettez à jour votre abonnement pour l'activer.",
      },
      { status: 402 },
    );
  }

  // ------------------------------------------------------------------
  // 2. Chargement de l'audit + project + client + reference
  // ------------------------------------------------------------------
  const { data: auditRow, error: auditError } = await supabase
    .from("audits")
    .select(
      `
      id, status, platform, service_type, initial_score, final_score,
      delivered_at, online_at, notes, created_at, updated_at,
      reference:references(id, type, version),
      project:projects(
        id, name, url,
        client:clients(id, name, website)
      )
    `,
    )
    .eq("id", auditId)
    .maybeSingle();

  if (auditError) {
    return NextResponse.json({ error: auditError.message }, { status: 500 });
  }
  if (!auditRow) {
    return NextResponse.json({ error: "Audit introuvable." }, { status: 404 });
  }

  const project = Array.isArray(auditRow.project)
    ? auditRow.project[0]
    : auditRow.project;
  const client = project?.client
    ? Array.isArray(project.client)
      ? project.client[0]
      : project.client
    : null;
  const reference = Array.isArray(auditRow.reference)
    ? auditRow.reference[0]
    : auditRow.reference;

  if (!project || !client || !reference) {
    return NextResponse.json(
      { error: "Audit incomplet (project/client/reference manquant)." },
      { status: 500 },
    );
  }

  // ------------------------------------------------------------------
  // 3. Autorisation : admin/auditor OU client_admin du client de l'audit
  // ------------------------------------------------------------------
  const isAuthorized =
    profile.role === "admin" ||
    profile.role === "auditor" ||
    (profile.role === "client_admin" && profile.client_id === client.id);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  // ------------------------------------------------------------------
  // 4. Chargement parallèle des données du rapport
  // ------------------------------------------------------------------
  const [
    { data: pageRows, error: pagesError },
    { data: thematicRows, error: thematicsError },
    { data: criteriaRows, error: criteriaError },
    { data: conformityRows, error: conformitiesError },
    { data: ncRows, error: ncError },
  ] = await Promise.all([
    supabase
      .from("pages")
      .select("id, name, url, page_type, sort_order")
      .eq("audit_id", auditId)
      .order("sort_order"),
    supabase
      .from("thematics")
      .select("id, identifier, name, sort_order")
      .eq("reference_id", reference.id)
      .order("sort_order"),
    supabase
      .from("criteria")
      .select(
        "id, thematic_id, identifier, name, name_en, level, thematic:thematics!inner(reference_id)",
      )
      .eq("thematic.reference_id", reference.id)
      .order("identifier"),
    supabase
      .from("page_conformities")
      .select("id, page_id, criteria_id, status")
      .eq("audit_id", auditId),
    supabase
      .from("non_conformities")
      .select(
        `
        id, page_id, criteria_id, title, description, actual_result, recommendation,
        severity, status, test_reference,
        criterion:criteria!inner(identifier, name, url),
        page:pages(name, sort_order),
        attachments:nc_attachments(id, storage_path, file_name, mime_type, kind)
      `,
      )
      .eq("audit_id", auditId)
      .order("created_at", { ascending: true }),
  ]);

  const dbError =
    pagesError ?? thematicsError ?? criteriaError ?? conformitiesError ?? ncError;
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // ------------------------------------------------------------------
  // 5. Signatures Storage pour les pièces jointes (1h)
  // ------------------------------------------------------------------
  type NCCriterion = { identifier: string; name: string; url: string | null };
  type NCPage = { name: string; sort_order: number };
  type NCRow = {
    id: string;
    page_id: string | null;
    criteria_id: string;
    title: string;
    description: string | null;
    actual_result: string | null;
    recommendation: string | null;
    severity: string;
    status: string;
    test_reference: string | null;
    criterion: NCCriterion | NCCriterion[];
    page: NCPage | NCPage[] | null;
    attachments:
      | Array<{
          id: string;
          storage_path: string;
          file_name: string | null;
          mime_type: string | null;
          kind: string;
        }>
      | null;
  };

  const ncRowsTyped = (ncRows ?? []) as NCRow[];

  const attachmentPaths = ncRowsTyped.flatMap(
    (nc) => nc.attachments?.map((a) => a.storage_path) ?? [],
  );

  const signedUrlByPath = new Map<string, string>();
  if (attachmentPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("nc-attachments")
      .createSignedUrls(attachmentPaths, 3600);
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) {
        signedUrlByPath.set(s.path, s.signedUrl);
      }
    }
  }

  // ------------------------------------------------------------------
  // 6. Construction du ReportData
  // ------------------------------------------------------------------
  const auditorName =
    [profile.first_name, profile.last_name]
      .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
      .join(" ")
      .trim() ||
    (profile.email as string | null) ||
    "—";

  const reportData: ReportData = {
    generatedAt: new Date().toISOString(),
    auditor: {
      name: auditorName,
      role: profile.role as "admin" | "auditor" | "client_admin" | "client",
    },
    audit: {
      id: auditRow.id as string,
      status: auditRow.status as AuditStatus,
      platform: auditRow.platform as PlatformType,
      serviceType: auditRow.service_type as ServiceType,
      initialScore: (auditRow.initial_score as number | null) ?? null,
      finalScore: (auditRow.final_score as number | null) ?? null,
      deliveredAt: (auditRow.delivered_at as string | null) ?? null,
      onlineAt: (auditRow.online_at as string | null) ?? null,
      notes: (auditRow.notes as string | null) ?? null,
      createdAt: auditRow.created_at as string,
      updatedAt: auditRow.updated_at as string,
    },
    project: {
      id: project.id as string,
      name: project.name as string,
      url: (project.url as string | null) ?? null,
    },
    client: {
      id: client.id as string,
      name: client.name as string,
      website: (client.website as string | null) ?? null,
    },
    reference: {
      id: reference.id as string,
      type: reference.type as ReferenceType,
      version: reference.version as string,
    },
    pages: (pageRows ?? []).map((p) => ({
      id: p.id as string,
      name: p.name as string,
      url: (p.url as string | null) ?? null,
      pageType: p.page_type as PageType,
      sortOrder: p.sort_order as number,
    })),
    thematics: (thematicRows ?? []).map((t) => ({
      id: t.id as string,
      identifier: t.identifier as string,
      name: t.name as string,
      sortOrder: t.sort_order as number,
    })),
    criteria: (criteriaRows ?? []).map((c) => ({
      id: c.id as string,
      thematicId: c.thematic_id as string,
      identifier: c.identifier as string,
      name: c.name as string,
      nameEn: (c.name_en as string | null) ?? null,
      level: (c.level as WCAGLevel | null) ?? null,
    })),
    pageConformities: (conformityRows ?? []).map((c) => ({
      id: c.id as string,
      pageId: c.page_id as string,
      criteriaId: c.criteria_id as string,
      status: c.status as ConformityStatus,
    })),
    nonConformities: ncRowsTyped.map((nc) => {
      const criterion = Array.isArray(nc.criterion)
        ? nc.criterion[0]
        : nc.criterion;
      const page = nc.page
        ? Array.isArray(nc.page)
          ? nc.page[0]
          : nc.page
        : null;
      return {
        id: nc.id,
        pageId: nc.page_id,
        criteriaId: nc.criteria_id,
        title: nc.title,
        description: nc.description,
        actualResult: nc.actual_result,
        recommendation: nc.recommendation,
        severity: nc.severity as NCSeverity,
        status: nc.status as NCStatus,
        testReference: nc.test_reference,
        criterion: {
          identifier: criterion?.identifier ?? "",
          name: criterion?.name ?? "",
          url: criterion?.url ?? null,
        },
        page: page ? { name: page.name, sortOrder: page.sort_order } : null,
        attachments: (nc.attachments ?? []).map((a) => ({
          id: a.id,
          storagePath: a.storage_path,
          fileName: a.file_name,
          mimeType: a.mime_type,
          kind: a.kind,
          signedUrl: signedUrlByPath.get(a.storage_path) ?? null,
        })),
      };
    }),
  };

  // ------------------------------------------------------------------
  // 7. Rendu HTML → PDF
  // ------------------------------------------------------------------
  const locale: ReportLocale =
    langParam === "en" || langParam === "fr"
      ? langParam
      : profile.language === "en"
        ? "en"
        : "fr";

  const html = renderReportHTML(reportData, locale);

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generatePDF(html, {
      footerTemplate: DEFAULT_FOOTER_TEMPLATE,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur PDF inconnue.";
    return NextResponse.json(
      { error: `Échec du rendu PDF : ${message}` },
      { status: 500 },
    );
  }

  // ------------------------------------------------------------------
  // 8. Nom de fichier + headers
  // ------------------------------------------------------------------
  const safeProjectName = project.name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "audit";
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `audit-${safeProjectName}-${dateStr}-${locale}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdfBuffer.length),
      "Cache-Control": "private, no-store",
    },
  });
}
