"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Eye, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { parseMethodology } from "@/lib/methodology";
import { addAttachment } from "@/app/(dashboard)/audits/[uuid]/anomalies/[ncId]/actions";
import { requestNCReview } from "@/app/(dashboard)/audits/[uuid]/anomalies/[ncId]/review-actions";
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
  const tNew = useTranslations("audits.anomaliesNew");
  const tSeverity = useTranslations("constants.ncSeverity");
  const tCommon = useTranslations("common");
  const [description, setDescription] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [severity, setSeverity] = useState<NCSeverity>("MEDIUM");
  const [testReference, setTestReference] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // create | create_and_request — décide si on enchaîne avec requestNCReview
  // après la création réussie.
  const [submitMode, setSubmitMode] =
    useState<"create" | "create_and_request">("create");

  // Méthodologie du critère parsée en tests individuels. Si le critère n'en
  // a pas (référentiels minoritaires non seedés), le panel reste vide.
  const availableTests = useMemo(
    () => parseMethodology(criterion.methodology ?? null),
    [criterion.methodology],
  );

  const reset = () => {
    setDescription("");
    setRecommendation("");
    setSeverity("MEDIUM");
    setTestReference("");
    setFiles([]);
    setError(null);
    setWarning(null);
    setSubmitMode("create");
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
    if (!description.trim()) {
      setError(tNew("descriptionRequired"));
      return;
    }
    if (!recommendation.trim()) {
      setError(tNew("recommendationRequired"));
      return;
    }
    if (availableTests.length > 0 && !testReference) {
      setError(tNew("testRequired"));
      return;
    }
    setError(null);
    setWarning(null);
    const mode = submitMode;

    startTransition(async () => {
      const result = await createNonConformity(auditId, page.id, criterion.id, {
        description: description.trim(),
        recommendation: recommendation.trim(),
        severity,
        testReference: testReference || null,
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
      }

      if (mode === "create_and_request") {
        const reviewRes = await requestNCReview(result.ncId);
        if (!reviewRes.ok) {
          toast.warning(tNew("createdReviewFailed"), {
            description: reviewRes.message ?? undefined,
          });
        } else {
          toast.success(tNew("createdAndReviewSuccess"));
        }
      } else {
        toast.success(tNew("createdSuccess"));
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

          {/* --- Tests et méthodologie du critère ----------------------- */}
          {availableTests.length > 0 ? (
            <fieldset
              className="space-y-3 rounded-md border border-border bg-muted/20 p-3"
              aria-describedby="matrix-nc-tests-help"
            >
              <legend className="px-1 text-sm font-medium">
                {tNew("test")} *
              </legend>
              <p
                id="matrix-nc-tests-help"
                className="px-1 text-xs text-muted-foreground"
              >
                {tNew("testPickerHint")}
              </p>
              {criterion.url && (
                <a
                  href={criterion.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-1 text-xs text-primary hover:underline"
                >
                  {tNew("testRefDocLink")}
                </a>
              )}
              <div className="space-y-2">
                {availableTests.map((tst) => {
                  const isSelected = testReference === tst.reference;
                  return (
                    <label
                      key={tst.reference}
                      className={
                        "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors " +
                        (isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:bg-accent")
                      }
                    >
                      <input
                        type="radio"
                        name="matrix-nc-test-radio"
                        value={tst.reference}
                        checked={isSelected}
                        onChange={() => setTestReference(tst.reference)}
                        className="mt-1 h-4 w-4 shrink-0 accent-primary"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="font-mono text-xs text-muted-foreground">
                          {tst.reference}
                        </p>
                        <p className="whitespace-pre-line text-sm leading-relaxed">
                          {tst.question}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ) : (
            <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              {tNew("testNoneNote")}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="nc-description">{t("description")} *</Label>
            <Textarea
              id="nc-description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
              autoFocus
              placeholder={t("descriptionPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nc-recommendation">{t("recommendation")} *</Label>
            <Textarea
              id="nc-recommendation"
              name="recommendation"
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              rows={3}
              required
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
                <SelectItem value="CRITICAL">
                  {tSeverity("CRITICAL")}
                </SelectItem>
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

          <DialogFooter className="flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleClose(false)}
              disabled={isPending}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              variant="outline"
              disabled={isPending}
              className="gap-2"
              onClick={() => setSubmitMode("create_and_request")}
            >
              {isPending && submitMode === "create_and_request" && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              <Eye className="h-4 w-4" aria-hidden="true" />
              {tNew("submitAndRequestReview")}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="gap-2"
              onClick={() => setSubmitMode("create")}
            >
              {isPending && submitMode === "create" && (
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
