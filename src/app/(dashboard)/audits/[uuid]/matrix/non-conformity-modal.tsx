"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { AlertTriangle, Eye, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogBody,
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
import { MethodologyContent } from "@/components/ui/methodology-content";
import { WcagLevelBadge } from "@/components/ui/wcag-level-badge";
import { createClient } from "@/lib/supabase/client";
import { cn, themeColorForIdentifier } from "@/lib/utils";
import { parseMethodology, localizeProcedure } from "@/lib/methodology";
import { addAttachment } from "@/app/(dashboard)/audits/[uuid]/anomalies/[ncId]/actions";
import { requestNCReview } from "@/app/(dashboard)/audits/[uuid]/anomalies/[ncId]/review-actions";
import { createNonConformity } from "./actions";
import type { AuditPage, Criterion, NCSeverity } from "@/types/domain";

/** Niveaux de severite, du plus leger au plus grave (ordre des maquettes). */
const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

/**
 * Segment choisi : meme couple fond pastel / texte fonce que le badge de
 * severite, donc des contrastes deja verifies dans les deux themes.
 */
const SEVERITY_SEGMENT: Record<NCSeverity, string> = {
  LOW: "peer-checked:bg-severity-low-bg peer-checked:text-severity-low",
  MEDIUM: "peer-checked:bg-severity-medium-bg peer-checked:text-severity-medium",
  HIGH: "peer-checked:bg-severity-high-bg peer-checked:text-severity-high",
  CRITICAL:
    "peer-checked:bg-severity-critical-bg peer-checked:text-severity-critical",
};

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
  const locale = useLocale();
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
  // create | create_and_request - décide si on enchaîne avec requestNCReview
  // après la création réussie.
  const [submitMode, setSubmitMode] =
    useState<"create" | "create_and_request">("create");

  // Liste de tests normalisée par référentiel (cf. new-nc-form) :
  //  - RGAA/RAWeb : tests numérotés parsés (label = question) ;
  //  - WCAG : techniques issues des clés de test_procedures (label = titre) ;
  //  - RAAM/WCAG-sans-technique : aucun test → détail au niveau critère.
  const { availableTests, criterionLevelDetail } = useMemo(() => {
    const parsed = parseMethodology(criterion.methodology ?? null);
    const tp = criterion.testProcedures ?? null;

    if (parsed.length > 0) {
      return {
        availableTests: parsed.map((p) => ({
          reference: p.reference,
          label: p.question,
        })),
        criterionLevelDetail: null as string | null,
      };
    }

    if (tp) {
      const keys = Object.keys(tp);
      const isCriterionLevel =
        keys.length === 0 ||
        (keys.length === 1 && keys[0] === criterion.identifier);
      if (!isCriterionLevel) {
        return {
          availableTests: keys.map((code) => {
            const text = localizeProcedure(tp[code], locale) ?? "";
            const title = text.split("\n")[0]?.trim() || code;
            return { reference: code, label: title };
          }),
          criterionLevelDetail: null as string | null,
        };
      }
    }

    const level =
      localizeProcedure(tp?.[criterion.identifier], locale) ||
      criterion.methodology ||
      null;
    return { availableTests: [], criterionLevelDetail: level };
  }, [
    criterion.methodology,
    criterion.testProcedures,
    criterion.identifier,
    locale,
  ]);

  // Procédure détaillée du test/technique sélectionné, langue active.
  const selectedTestDetail = useMemo(() => {
    const tp = criterion.testProcedures;
    if (!tp || !testReference) return null;
    const bare = testReference.replace(/^Test\s+/i, "").trim();
    return localizeProcedure(tp[bare] ?? tp[testReference], locale);
  }, [criterion.testProcedures, testReference, locale]);

  const selectedTest = useMemo(
    () => availableTests.find((tst) => tst.reference === testReference) ?? null,
    [availableTests, testReference],
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
      <DialogContent size="2xl" closeLabel={tCommon("close")}>
        <DialogHeader
          icon={<AlertTriangle aria-hidden="true" />}
          tone="destructive"
        >
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("page", { name: page.name })}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <DialogBody>
            {/* Identite du critere vise, comme sur la maquette : pastille
                coloree par thematique, question du critere, page. */}
            <p className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center rounded-md px-2 py-1 text-[0.8rem] font-extrabold tabular text-white"
                style={{
                  background: themeColorForIdentifier(
                    criterion.identifier.split(".")[0] ?? "",
                  ),
                }}
              >
                {criterion.identifier}
              </span>
              <WcagLevelBadge level={criterion.level} />
              <span className="text-[0.95rem] font-semibold">
                {criterion.name}
              </span>
            </p>

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
              className="rounded-md bg-warning/10 p-3 text-sm text-warning-text"
            >
              {warning}
            </p>
          )}

          {/* --- Test et références du critère --------------------------- */}
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
              <Select value={testReference} onValueChange={setTestReference}>
                <SelectTrigger
                  id="matrix-nc-test"
                  aria-label={tNew("test")}
                  className="h-auto min-h-10 py-2 [&>span]:line-clamp-2 [&>span]:text-left"
                >
                  <SelectValue placeholder={tNew("testPlaceholder")} />
                </SelectTrigger>
                <SelectContent className="max-h-[60vh] w-[var(--radix-select-trigger-width)]">
                  {availableTests.map((tst) => (
                    <SelectItem
                      key={tst.reference}
                      value={tst.reference}
                      className="whitespace-normal"
                    >
                      <span className="block leading-snug">
                        <span className="font-mono text-xs text-muted-foreground">
                          {tst.reference}
                        </span>
                        <span className="mt-0.5 block">{tst.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {testReference && (
                <div className="rounded-md border border-border bg-card p-3">
                  {selectedTestDetail ? (
                    <MethodologyContent content={selectedTestDetail} />
                  ) : (
                    <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {selectedTest?.label}
                    </p>
                  )}
                </div>
              )}
            </fieldset>
          ) : criterionLevelDetail ? (
            <fieldset
              className="space-y-3 rounded-md border border-border bg-muted/20 p-3"
              aria-describedby="matrix-nc-tests-help"
            >
              <legend className="px-1 text-sm font-medium">
                {tNew("test")}
              </legend>
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
              <div className="rounded-md border border-border bg-card p-3">
                <MethodologyContent content={criterionLevelDetail} />
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

          {/* Severite en segments, comme la maquette : les quatre niveaux
              restent visibles et le choix se fait en un clic. */}
          <div className="space-y-2">
            <span className="text-sm font-bold" id="nc-severity-label">
              {t("severity")}
            </span>
            <div
              role="radiogroup"
              aria-labelledby="nc-severity-label"
              className="flex gap-1 rounded-xl bg-secondary p-1"
            >
              {SEVERITIES.map((level) => (
                <label key={level} className="relative flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="severity"
                    value={level}
                    checked={severity === level}
                    onChange={() => setSeverity(level)}
                    className="peer absolute inset-0 m-0 cursor-pointer opacity-0"
                  />
                  <span
                    className={cn(
                      "flex h-[38px] items-center justify-center rounded-[0.5625rem] text-sm font-extrabold",
                      "text-secondary-foreground transition-colors",
                      "peer-hover:bg-card",
                      "peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-1 peer-focus-visible:outline-primary",
                      SEVERITY_SEGMENT[level],
                    )}
                  >
                    {tSeverity(level)}
                  </span>
                </label>
              ))}
            </div>
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

          </DialogBody>

          <DialogFooter className="flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isPending}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              variant="outline"
              disabled={isPending}
              onClick={() => setSubmitMode("create_and_request")}
            >
              {isPending && submitMode === "create_and_request" && (
                <Loader2 className="animate-spin" aria-hidden="true" />
              )}
              <Eye aria-hidden="true" />
              {tNew("submitAndRequestReview")}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isPending}
              onClick={() => setSubmitMode("create")}
            >
              {isPending && submitMode === "create" && (
                <Loader2 className="animate-spin" aria-hidden="true" />
              )}
              {t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
