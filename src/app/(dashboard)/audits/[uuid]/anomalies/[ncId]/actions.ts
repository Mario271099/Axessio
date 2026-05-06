"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { NCSeverity, NCStatus } from "@/types/domain";

// L'enum nc_status en base inclut les valeurs ajoutées par 08_non_conformity_extended.sql
// (TO_FIX / FIXED / FALSE_POSITIVE) qui ne sont pas encore reflétées dans NCStatus.
type NCStatusInput = NCStatus | "TO_FIX" | "FIXED" | "FALSE_POSITIVE";

export interface ActionResult {
  error: string | null;
  success?: boolean;
}

// ============================================================================
// Helpers
// ============================================================================
async function requireAuditor(): Promise<{ userId: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "auditor") {
    return { error: "Action réservée aux auditeurs." };
  }
  return { userId: user.id };
}

async function requireAuditorOrClientAdmin(): Promise<
  { userId: string; role: "auditor" | "client_admin" } | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "auditor" && profile?.role !== "client_admin") {
    return { error: "Action réservée aux auditeurs et aux administrateurs client." };
  }
  return { userId: user.id, role: profile.role };
}

function revalidateNC(auditId: string, ncId: string) {
  revalidatePath(`/audits/${auditId}/anomalies`);
  revalidatePath(`/audits/${auditId}/anomalies/${ncId}`);
}

// ============================================================================
// 1) Édition d'une non-conformité (auditeur)
// ============================================================================
export async function updateNC(
  ncId: string,
  auditId: string,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await requireAuditor();
  if ("error" in auth) return { error: auth.error };

  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const actualResult = formData.get("actualResult")?.toString().trim() || null;
  const recommendation =
    formData.get("recommendation")?.toString().trim() || null;
  const severity = formData.get("severity")?.toString() as NCSeverity;
  const pageIdRaw = formData.get("pageId")?.toString().trim();
  const pageId = pageIdRaw && pageIdRaw !== "null" ? pageIdRaw : null;

  if (!title) return { error: "Le titre est requis." };
  if (!severity) return { error: "La sévérité est requise." };

  const supabase = await createClient();

  const { error } = await supabase
    .from("non_conformities")
    .update({
      title,
      description,
      actual_result: actualResult,
      recommendation,
      severity,
      page_id: pageId,
    })
    .eq("id", ncId);

  if (error) return { error: error.message };

  revalidateNC(auditId, ncId);
  return { error: null, success: true };
}

// ============================================================================
// 2) Mise à jour du statut d'une NC (auditeur)
// ============================================================================
export async function updateNCStatus(
  ncId: string,
  auditId: string,
  status: NCStatusInput,
): Promise<ActionResult> {
  const auth = await requireAuditor();
  if ("error" in auth) return { error: auth.error };

  const supabase = await createClient();

  const { error } = await supabase
    .from("non_conformities")
    .update({ status })
    .eq("id", ncId);

  if (error) return { error: error.message };

  revalidateNC(auditId, ncId);
  return { error: null, success: true };
}

// ============================================================================
// 3) Envoi d'un message dans le fil de discussion (auditeur + client_admin)
// ============================================================================
export async function sendMessage(
  ncId: string,
  auditId: string,
  body: string,
): Promise<ActionResult> {
  const auth = await requireAuditorOrClientAdmin();
  if ("error" in auth) return { error: auth.error };

  const trimmed = body.trim();
  if (!trimmed) return { error: "Le message ne peut pas être vide." };

  const supabase = await createClient();

  const { error } = await supabase.from("nc_messages").insert({
    non_conformity_id: ncId,
    author_id: auth.userId,
    body: trimmed,
  });

  if (error) return { error: error.message };

  revalidatePath(`/audits/${auditId}/anomalies/${ncId}`);
  return { error: null, success: true };
}

// ============================================================================
// 4) Suppression d'un message (auteur uniquement)
// ============================================================================
export async function deleteMessage(
  messageId: string,
  ncId: string,
  auditId: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { error } = await supabase
    .from("nc_messages")
    .delete()
    .eq("id", messageId)
    .eq("author_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/audits/${auditId}/anomalies/${ncId}`);
  return { error: null, success: true };
}

// ============================================================================
// 5) Ajout d'une pièce jointe (auditeur + client_admin)
// ----------------------------------------------------------------------------
// Le fichier a déjà été uploadé côté client dans le bucket `nc-attachments`
// (RLS storage gère l'autorisation). On insère ici uniquement la ligne
// `nc_attachments` correspondante. `uploaded_by` est forcé à `auth.uid()`
// pour respecter la policy `nc_attach_insert`.
// ============================================================================
export async function addAttachment(
  ncId: string,
  auditId: string,
  storagePath: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
): Promise<ActionResult> {
  const auth = await requireAuditorOrClientAdmin();
  if ("error" in auth) return { error: auth.error };

  if (!storagePath) return { error: "Chemin de stockage manquant." };
  if (!fileName) return { error: "Nom de fichier manquant." };

  const supabase = await createClient();

  const { error } = await supabase.from("nc_attachments").insert({
    non_conformity_id: ncId,
    storage_path: storagePath,
    file_name: fileName,
    file_size: fileSize,
    mime_type: mimeType,
    uploaded_by: auth.userId,
    kind: "result",
  });

  if (error) return { error: error.message };

  revalidatePath(`/audits/${auditId}/anomalies/${ncId}`);
  return { error: null, success: true };
}

// ============================================================================
// 6) Suppression d'une pièce jointe (auteur ou auditeur)
// ============================================================================
export async function deleteAttachment(
  attachmentId: string,
  ncId: string,
  auditId: string,
  storagePath: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const isAuditor = profile?.role === "auditor";

  const { data: attachment, error: fetchError } = await supabase
    .from("nc_attachments")
    .select("id, uploaded_by, storage_path")
    .eq("id", attachmentId)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!attachment) return { error: "Pièce jointe introuvable." };

  if (!isAuditor && attachment.uploaded_by !== user.id) {
    return { error: "Vous ne pouvez supprimer que vos propres pièces jointes." };
  }

  const { error: deleteRowError } = await supabase
    .from("nc_attachments")
    .delete()
    .eq("id", attachmentId);

  if (deleteRowError) return { error: deleteRowError.message };

  // On supprime le fichier après la ligne pour éviter les orphelins en base.
  // En cas d'échec storage, on log mais on ne casse pas la suppression logique.
  const pathToRemove = attachment.storage_path ?? storagePath;
  if (pathToRemove) {
    const { error: storageError } = await supabase.storage
      .from("nc-attachments")
      .remove([pathToRemove]);
    if (storageError) {
      console.error("[deleteAttachment] storage:", storageError);
    }
  }

  revalidatePath(`/audits/${auditId}/anomalies/${ncId}`);
  return { error: null, success: true };
}
