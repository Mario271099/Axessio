"use client";

// Carte « Captures d'écran » de la page NC : upload, grille de vignettes,
// aperçu plein écran et suppression. Extrait de nc-detail.tsx (découpage des
// gros composants) — markup et comportement inchangés.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { createClient } from "@/lib/supabase/client";
import { addAttachment, deleteAttachment } from "./actions";
import type { AttachmentData } from "./nc-detail-types";

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

interface NCAttachmentsCardProps {
  ncId: string;
  auditId: string;
  attachments: AttachmentData[];
  /** Peut uploader des captures (chat ouvert). */
  canUpload: boolean;
  /** Peut supprimer n'importe quelle capture (droit nc.edit). */
  canDeleteAny: boolean;
  profileId: string;
}

export function NCAttachmentsCard({
  ncId,
  auditId,
  attachments,
  canUpload,
  canDeleteAny,
  profileId,
}: NCAttachmentsCardProps) {
  const router = useRouter();
  const t = useTranslations("audits.ncDetail");
  const tCommon = useTranslations("common");

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] =
    useState<AttachmentData | null>(null);
  const [attachmentToDelete, setAttachmentToDelete] =
    useState<AttachmentData | null>(null);

  const handleFilesChange = (selected: File[]) => {
    if (selected.length === 0 || uploading) return;
    setUploadError(null);
    setUploading(true);

    void (async () => {
      const supabase = createClient();
      const failures: string[] = [];

      for (const file of selected) {
        const fallbackExt = MIME_TO_EXT[file.type] ?? "bin";
        const nameExt = file.name.includes(".")
          ? file.name.split(".").pop()!.toLowerCase()
          : null;
        const ext = nameExt && nameExt.length <= 5 ? nameExt : fallbackExt;
        const path = `${auditId}/${ncId}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("nc-attachments")
          .upload(path, file, { contentType: file.type, upsert: false });

        if (uploadErr) {
          failures.push(`${file.name}: ${uploadErr.message}`);
          continue;
        }

        const result = await addAttachment(
          ncId,
          auditId,
          path,
          file.name,
          file.size,
          file.type,
        );
        if (result.error) {
          await supabase.storage.from("nc-attachments").remove([path]);
          failures.push(`${file.name}: ${result.error}`);
        }
      }

      if (failures.length > 0) setUploadError(failures.join(" ; "));
      setUploading(false);
      router.refresh();
    })();
  };

  const handleDeleteAttachment = async (attachment: AttachmentData) => {
    if (deletingId) return;
    setAttachmentToDelete(null);
    setDeletingId(attachment.id);
    setUploadError(null);
    try {
      const result = await deleteAttachment(
        attachment.id,
        ncId,
        auditId,
        attachment.storagePath,
      );
      if (result.error) {
        setUploadError(result.error);
        return;
      }
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base">{t("screenshots")}</CardTitle>
          <span className="text-xs text-muted-foreground tabular-nums">
            {t("filesCount", { count: attachments.length })}
          </span>
        </CardHeader>
        <CardContent className="space-y-4">
          {uploading && (
            <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2
                className="h-3.5 w-3.5 animate-spin"
                aria-hidden="true"
              />
              {t("uploading")}
            </p>
          )}

          {uploadError && (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            >
              {uploadError}
            </p>
          )}

          {attachments.length > 0 && (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {attachments.map((att) => {
                // Auteur de l'upload OU droit d'éditer les NC (staff legacy
                // OU membre d'org avec `nc.edit`).
                const canDelete = canDeleteAny || att.uploadedBy === profileId;
                const isImage = !!att.mimeType?.startsWith("image/");
                const isDeleting = deletingId === att.id;
                const displayName =
                  att.fileName ??
                  att.storagePath.split("/").pop() ??
                  "fichier";

                return (
                  <li key={att.id} className="space-y-1.5">
                    <div className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                      {isImage && att.signedUrl ? (
                        <button
                          type="button"
                          onClick={() => setPreviewAttachment(att)}
                          className="block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={t("enlargeAria", { name: displayName })}
                        >
                          <img
                            src={att.signedUrl}
                            alt={displayName}
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                        </button>
                      ) : att.signedUrl ? (
                        <a
                          href={att.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center text-xs text-muted-foreground hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={t("openAria", { name: displayName })}
                        >
                          <FileText
                            className="h-8 w-8"
                            aria-hidden="true"
                          />
                          <span className="line-clamp-2 break-all">
                            {t("openPdf")}
                          </span>
                        </a>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                          {t("unavailable")}
                        </div>
                      )}

                      {canDelete && (
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="absolute right-1.5 top-1.5 h-7 w-7 rounded-full opacity-0 shadow transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                          onClick={() => setAttachmentToDelete(att)}
                          disabled={isDeleting}
                          aria-label={t("deleteAria", { name: displayName })}
                        >
                          {isDeleting ? (
                            <Loader2
                              className="h-3.5 w-3.5 animate-spin"
                              aria-hidden="true"
                            />
                          ) : (
                            <Trash2
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          )}
                        </Button>
                      )}
                    </div>
                    <p
                      className="truncate text-xs text-muted-foreground"
                      title={displayName}
                    >
                      {displayName}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}

          {attachments.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
              <div
                aria-hidden="true"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
              >
                <Upload className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">{t("noScreenshots")}</p>
              <p className="text-xs text-muted-foreground">
                {t("noScreenshotsDesc")}
              </p>
            </div>
          )}

          {canUpload && (
            <FileDropZone
              files={[]}
              onFilesChange={handleFilesChange}
              accept="image/png,image/jpeg,image/webp,application/pdf"
              maxSizeMB={5}
              disabled={uploading}
            />
          )}
        </CardContent>
      </Card>

      <Dialog
        open={previewAttachment !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewAttachment(null);
        }}
      >
        <DialogContent className="max-w-5xl gap-2 p-3 sm:p-4">
          <DialogTitle className="sr-only">
            {previewAttachment?.fileName ?? t("previewTitle")}
          </DialogTitle>
          {previewAttachment?.signedUrl && (
            <img
              src={previewAttachment.signedUrl}
              alt={previewAttachment.fileName ?? t("previewTitle")}
              className="mx-auto max-h-[80vh] w-auto rounded-md object-contain"
            />
          )}
          {previewAttachment?.fileName && (
            <p className="text-center text-xs text-muted-foreground">
              {previewAttachment.fileName}
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation suppression capture */}
      <AlertDialog
        open={attachmentToDelete !== null}
        onOpenChange={(o) => !o && setAttachmentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tCommon("confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("confirmDeleteCapture")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (attachmentToDelete) void handleDeleteAttachment(attachmentToDelete);
              }}
            >
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
