"use client";

// Carte « Captures d'écran » de la page NC : upload, grille de vignettes,
// aperçu plein écran et suppression. Extrait de nc-detail.tsx (découpage des
// gros composants) - markup et comportement inchangés.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
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
import { intlLocale } from "@/lib/intl";
import { cn } from "@/lib/utils";
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
  const locale = useLocale();

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] =
    useState<AttachmentData | null>(null);
  const [attachmentToDelete, setAttachmentToDelete] =
    useState<AttachmentData | null>(null);

  // Capture affichée en grand. Par défaut la première ; si celle qui était
  // choisie vient d'être supprimée, on retombe sur la première.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const shown =
    attachments.find((a) => a.id === selectedId) ?? attachments[0] ?? null;
  const shownIsImage = !!shown?.mimeType?.startsWith("image/");

  const nameOf = (att: AttachmentData) =>
    att.fileName ?? att.storagePath.split("/").pop() ?? "fichier";

  /** Type et poids réels du fichier, pour la légende et la visionneuse. */
  const metaOf = (att: AttachmentData | null) => {
    if (!att) return null;
    const parts: string[] = [];
    const subtype = att.mimeType?.split("/")[1];
    if (subtype) parts.push(subtype.toUpperCase());
    if (att.fileSize) {
      parts.push(
        new Intl.NumberFormat(intlLocale(locale), {
          style: "unit",
          unit: "kilobyte",
          unitDisplay: "short",
          maximumFractionDigits: 0,
        }).format(att.fileSize / 1024),
      );
    }
    return parts.length > 0 ? parts.join(" · ") : null;
  };

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

          {/* Visionneuse : la capture choisie en grand, les autres en
              miniatures dessous. */}
          {shown && (
            <figure className="m-0">
              <div className="group relative h-[300px] overflow-hidden rounded-card border border-border bg-secondary sm:h-[420px]">
                {shownIsImage && shown.signedUrl ? (
                  <button
                    type="button"
                    onClick={() => setPreviewAttachment(shown)}
                    className="flex size-full items-center justify-center p-4"
                    aria-label={t("enlargeAria", { name: nameOf(shown) })}
                  >
                    {/* URL signée Supabase éphémère (1h) : hôte non
                        optimisable par next/image sans exposer le bucket. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={shown.signedUrl}
                      alt={nameOf(shown)}
                      className="max-h-full max-w-full rounded-row object-contain shadow-lg transition-transform duration-200 group-hover:scale-[1.01]"
                    />
                  </button>
                ) : shown.signedUrl ? (
                  <a
                    href={shown.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex size-full flex-col items-center justify-center gap-2.5 p-4 text-center text-sm font-bold text-secondary-foreground hover:bg-primary-softer"
                    aria-label={t("openAria", { name: nameOf(shown) })}
                  >
                    <FileText className="size-10" aria-hidden="true" />
                    {t("openPdf")}
                  </a>
                ) : (
                  <p className="flex size-full items-center justify-center text-sm text-muted-foreground">
                    {t("unavailable")}
                  </p>
                )}

                {(canDeleteAny || shown.uploadedBy === profileId) && (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="destructive"
                    className="absolute right-3 top-3 rounded-full opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                    onClick={() => setAttachmentToDelete(shown)}
                    disabled={deletingId === shown.id}
                    aria-label={t("deleteAria", { name: nameOf(shown) })}
                  >
                    {deletingId === shown.id ? (
                      <Loader2 className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 aria-hidden="true" />
                    )}
                  </Button>
                )}
              </div>

              <figcaption className="mt-2.5 text-[0.95rem] font-bold">
                {nameOf(shown)}{" "}
                {metaOf(shown) && (
                  <span className="font-medium text-muted-foreground">
                    {metaOf(shown)}
                  </span>
                )}
              </figcaption>
            </figure>
          )}

          {attachments.length > 1 && (
            <div
              role="group"
              aria-label={t("captureSelectAria")}
              className="flex flex-wrap gap-3"
            >
              {attachments.map((att) => {
                const isShown = att.id === shown?.id;
                return (
                  <button
                    key={att.id}
                    type="button"
                    aria-pressed={isShown}
                    onClick={() => setSelectedId(att.id)}
                    className={cn(
                      "flex w-[150px] flex-col gap-1.5 rounded-row border-2 bg-card p-1.5 text-left",
                      "transition-[border-color,transform] duration-200",
                      isShown
                        ? "border-primary"
                        : "border-border hover:-translate-y-0.5 hover:border-primary",
                    )}
                  >
                    <span className="block h-[74px] overflow-hidden rounded-lg bg-secondary">
                      {att.mimeType?.startsWith("image/") && att.signedUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={att.signedUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center text-muted-foreground">
                          <FileText className="size-6" aria-hidden="true" />
                        </span>
                      )}
                    </span>
                    <span className="truncate text-[0.78rem] font-bold">
                      {nameOf(att)}
                    </span>
                  </button>
                );
              })}
            </div>
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
        {/* Visionneuse : fenetre sombre pleine largeur, la capture au centre. */}
        <DialogContent
          className="max-h-[min(94dvh,900px)] border-0 bg-ink text-ink-foreground sm:max-w-[min(1100px,calc(100vw-4rem))]"
          closeLabel={tCommon("close")}
          closeClassName="text-ink-muted hover:bg-ink-raised hover:text-ink-foreground"
        >
          <div className="flex items-start gap-3 py-[18px] pl-[26px] pr-[68px]">
            <div className="min-w-0">
              <DialogTitle className="truncate text-lg font-extrabold">
                {previewAttachment?.fileName ?? t("previewTitle")}
              </DialogTitle>
              {metaOf(previewAttachment) && (
                <p className="mt-0.5 text-sm text-ink-muted">{metaOf(previewAttachment)}</p>
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center px-6 pb-7">
            {previewAttachment?.signedUrl && (
              /* URL signée Supabase éphémère (1h) - cf. commentaire ci-dessus. */
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewAttachment.signedUrl}
                alt={previewAttachment.fileName ?? t("previewTitle")}
                className="max-h-full w-auto rounded-[0.875rem] object-contain shadow-modal"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation suppression capture */}
      <AlertDialog
        open={attachmentToDelete !== null}
        onOpenChange={(o) => !o && setAttachmentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader icon={<Trash2 aria-hidden="true" />}>
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
