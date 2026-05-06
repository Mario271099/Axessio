"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { addAttachment } from "@/app/(dashboard)/audits/[uuid]/anomalies/[ncId]/actions";

const ACCEPTED_MIME = "image/png,image/jpeg,image/webp,application/pdf";
const ACCEPTED_MIME_SET = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
]);

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export interface PendingAttachment {
  id: string;
  file: File;
  previewUrl: string;
  isImage: boolean;
}

export function makePendingAttachment(file: File): PendingAttachment {
  return {
    id: crypto.randomUUID(),
    file,
    previewUrl: URL.createObjectURL(file),
    isImage: file.type.startsWith("image/"),
  };
}

export interface NCAttachmentsInputProps {
  files: PendingAttachment[];
  onFilesChange: (files: PendingAttachment[]) => void;
  maxSizeMB?: number;
  disabled?: boolean;
}

export function NCAttachmentsInput({
  files,
  onFilesChange,
  maxSizeMB = 5,
  disabled = false,
}: NCAttachmentsInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // Au démontage, on libère toutes les URLs locales encore actives.
  useEffect(() => {
    return () => {
      filesRef.current.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
  }, []);

  const maxBytes = maxSizeMB * 1024 * 1024;

  const handlePick = () => {
    if (disabled) return;
    setError(null);
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files;
    e.target.value = "";
    if (!picked || picked.length === 0) return;

    const accepted: PendingAttachment[] = [];
    const errors: string[] = [];

    for (const file of Array.from(picked)) {
      if (file.size > maxBytes) {
        errors.push(`"${file.name}" : trop volumineux (${maxSizeMB} Mo max).`);
        continue;
      }
      if (!ACCEPTED_MIME_SET.has(file.type)) {
        errors.push(`"${file.name}" : format non supporté.`);
        continue;
      }
      accepted.push(makePendingAttachment(file));
    }

    setError(errors.length > 0 ? errors.join(" ") : null);
    if (accepted.length > 0) {
      onFilesChange([...files, ...accepted]);
    }
  };

  const handleRemove = (id: string) => {
    const target = files.find((f) => f.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onFilesChange(files.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          PNG, JPEG, WebP ou PDF · {maxSizeMB} Mo max par fichier.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handlePick}
          disabled={disabled}
          className="gap-1"
        >
          <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
          Ajouter
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_MIME}
        multiple
        className="hidden"
        onChange={handleFileChange}
        aria-hidden="true"
        tabIndex={-1}
      />

      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 p-2 text-xs text-destructive"
        >
          {error}
        </p>
      )}

      {files.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {files.map((att) => (
            <li key={att.id} className="space-y-1.5">
              <div className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted">
                {att.isImage ? (
                  <img
                    src={att.previewUrl}
                    alt={att.file.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center text-xs text-muted-foreground">
                    <FileText className="h-8 w-8" aria-hidden="true" />
                    <span className="line-clamp-2 break-all">PDF</span>
                  </div>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute right-1.5 top-1.5 h-7 w-7 opacity-0 shadow transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  onClick={() => handleRemove(att.id)}
                  disabled={disabled}
                  aria-label={`Retirer ${att.file.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
              <p
                className="truncate text-xs text-muted-foreground"
                title={att.file.name}
              >
                {att.file.name}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============================================================================
// Helper d'upload : appelé après création d'une NC pour pousser chaque fichier
// vers le bucket `nc-attachments` et insérer la ligne `nc_attachments`.
// Renvoie la liste des erreurs par fichier (vide si tout est OK).
// ============================================================================
export interface UploadAttachmentError {
  fileName: string;
  message: string;
}

export interface UploadAttachmentsResult {
  errors: UploadAttachmentError[];
  successCount: number;
}

export async function uploadAttachmentsForNC(
  auditId: string,
  ncId: string,
  files: PendingAttachment[],
): Promise<UploadAttachmentsResult> {
  if (files.length === 0) {
    return { errors: [], successCount: 0 };
  }

  const supabase = createClient();
  const errors: UploadAttachmentError[] = [];
  let successCount = 0;

  for (const pending of files) {
    const { file } = pending;
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
      errors.push({ fileName: file.name, message: uploadErr.message });
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
      // Best-effort : nettoyage du fichier orphelin côté storage
      await supabase.storage.from("nc-attachments").remove([path]);
      errors.push({ fileName: file.name, message: result.error });
      continue;
    }

    successCount++;
  }

  return { errors, successCount };
}
