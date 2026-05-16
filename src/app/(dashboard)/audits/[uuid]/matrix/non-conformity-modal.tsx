"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { createClient } from "@/lib/supabase/client";
import { addAttachment } from "@/app/(dashboard)/audits/[uuid]/anomalies/[ncId]/actions";
import { createNonConformity } from "./actions";
import type { AuditPage, Criterion, NCSeverity } from "@/types/domain";

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auditId: string;
  page: AuditPage;
  criterion: Criterion;
  onCreated: (criteriaId: string, pageId: string) => void;
}

export function NonConformityModal({
  open,
  onOpenChange,
  auditId,
  page,
  criterion,
  onCreated,
}: Props) {
  const t = useTranslations("audits.matrix.ncModal");
  const tSeverity = useTranslations("constants.ncSeverity");
  const tCommon = useTranslations("common");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [severity, setSeverity] = useState<NCSeverity>("MEDIUM");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setTitle("");
    setDescription("");
    setRecommendation("");
    setSeverity("MEDIUM");
    setFiles([]);
    setError(null);
    setWarning(null);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const uploadFiles = async (ncId: string): Promise<string[]> => {
    if (files.length === 0) return [];
    const supabase = createClient();
    const failures: string[] = [];

    for (const file of files) {
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

    return failures;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(t("titleRequired"));
      return;
    }
    setError(null);
    setWarning(null);

    startTransition(async () => {
      const result = await createNonConformity(auditId, page.id, criterion.id, {
        title: title.trim(),
        description: description.trim() || null,
        recommendation: recommendation.trim() || null,
        severity,
      });
      if (result.error || !result.ncId) {
        setError(result.error ?? t("creationFailed"));
        return;
      }

      const failures = await uploadFiles(result.ncId);
      if (failures.length > 0) {
        setWarning(
          t("captureErrors", {
            count: failures.length,
            errors: failures.join(" ; "),
          }),
        );
        setFiles([]);
        onCreated(criterion.id, page.id);
        return;
      }

      reset();
      onCreated(criterion.id, page.id);
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription className="space-y-1">
            <span className="block">
              <span className="font-mono text-xs">
                {t("criterion", { identifier: criterion.identifier })}
              </span>
              <span className="ml-2">{criterion.name}</span>
            </span>
            <span className="block text-xs">
              {t("page", { name: page.name })}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          {warning && (
            <p
              role="alert"
              className="rounded-md bg-warning/10 p-3 text-sm text-warning"
            >
              {warning}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="nc-title">{t("ncTitle")} *</Label>
            <Input
              id="nc-title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              placeholder={t("ncTitlePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nc-description">{t("description")}</Label>
            <Textarea
              id="nc-description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={t("descriptionPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nc-recommendation">{t("recommendation")}</Label>
            <Textarea
              id="nc-recommendation"
              name="recommendation"
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              rows={3}
              placeholder={t("recommendationPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nc-severity">{t("severity")}</Label>
            <Select
              name="severity"
              value={severity}
              onValueChange={(v) => setSeverity(v as NCSeverity)}
            >
              <SelectTrigger id="nc-severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">{tSeverity("LOW")}</SelectItem>
                <SelectItem value="MEDIUM">{tSeverity("MEDIUM")}</SelectItem>
                <SelectItem value="HIGH">{tSeverity("HIGH")}</SelectItem>
                <SelectItem value="CRITICAL">{tSeverity("CRITICAL")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("screenshots")}</Label>
            <FileDropZone
              files={files}
              onFilesChange={setFiles}
              accept="image/png,image/jpeg,image/webp,application/pdf"
              maxSizeMB={5}
              disabled={isPending}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleClose(false)}
              disabled={isPending}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              {t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
