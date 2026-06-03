"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useFormatter } from "next-intl";
import { ChevronLeft, Loader2, RotateCcw, Save, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDraftStorage } from "@/hooks/use-draft-storage";
import type { NCTemplate } from "@/types/domain";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { InfoTip } from "@/components/ui/info-tip";
import { createClient } from "@/lib/supabase/client";
import { addAttachment } from "@/app/(dashboard)/audits/[uuid]/anomalies/[ncId]/actions";
import { parseMethodology } from "@/lib/methodology";
import type { NCSeverity } from "@/types/domain";
import { createNC } from "./actions";

const SEVERITIES: NCSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export interface NCThematic {
  id: string;
  identifier: string;
  name: string;
}

export interface NCCriterion {
  id: string;
  thematicId: string;
  identifier: string;
  name: string;
  methodology: string | null;
}

export interface NCPage {
  id: string;
  name: string;
}

interface NewNCFormProps {
  auditId: string;
  pages: NCPage[];
  thematics: NCThematic[];
  criteria: NCCriterion[];
  templates: NCTemplate[];
}

export function NewNCForm({
  auditId,
  pages,
  thematics,
  criteria,
  templates,
}: NewNCFormProps) {
  const router = useRouter();
  const t = useTranslations("audits.anomaliesNew");
  const tDraft = useTranslations("audits.anomaliesNew.draft");
  const tSeverity = useTranslations("constants.ncSeverity");
  const format = useFormatter();

  // -- Cascade thématique → critère → test ---------------------------------
  const [thematicId, setThematicId] = useState<string>("");
  const [criteriaId, setCriteriaId] = useState<string>("");
  const [testReference, setTestReference] = useState<string>("");

  const [pageId, setPageId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [actualResult, setActualResult] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [severity, setSeverity] = useState<NCSeverity>("MEDIUM");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [submitting, startTransition] = useTransition();

  // ---- Brouillon localStorage --------------------------------------------
  // Snapshot du formulaire sans les fichiers (non sérialisables) ni les
  // états d'UI (error/warning/submitting). Sauvegarde debounced.
  type Draft = {
    thematicId: string;
    criteriaId: string;
    testReference: string;
    pageId: string;
    title: string;
    description: string;
    actualResult: string;
    recommendation: string;
    severity: NCSeverity;
  };
  const draftValue: Draft = {
    thematicId,
    criteriaId,
    testReference,
    pageId,
    title,
    description,
    actualResult,
    recommendation,
    severity,
  };
  const draft = useDraftStorage<Draft>(`nc-draft:${auditId}`, draftValue, {
    paused: submitting,
    // Tant que l'utilisateur n'a rien tapé d'utile, on n'écrit pas — ça
    // évite de créer un brouillon « vide » qui referait apparaître le
    // banner inutilement au prochain montage.
    shouldPersist: (v) =>
      Boolean(
        v.title.trim() ||
          v.description.trim() ||
          v.actualResult.trim() ||
          v.recommendation.trim() ||
          v.pageId ||
          v.criteriaId,
      ),
  });

  // ---- Application d'un template ------------------------------------------
  // Pré-remplit le formulaire à partir d'un template (titre, description,
  // recommandation, sévérité). Si le template référence un critère et que
  // ce critère est dans la liste disponible (= bonne référentiel + bonne
  // thématique chargée), on auto-sélectionne aussi la cascade pour éviter
  // à l'utilisateur de la refaire à la main.
  function applyTemplate(tplId: string) {
    const tpl = templates.find((tt) => tt.id === tplId);
    if (!tpl) return;
    setTitle(tpl.titleTemplate);
    setDescription(tpl.descriptionTemplate ?? "");
    setRecommendation(tpl.recommendationTemplate ?? "");
    setSeverity(tpl.severity);
    if (tpl.criterionId) {
      const matched = criteria.find((c) => c.id === tpl.criterionId);
      if (matched) {
        setThematicId(matched.thematicId);
        setCriteriaId(matched.id);
        // Le test n'est pas dans le template — il est dépendant de la
        // méthodologie chargée, l'auditeur le complète lui-même.
      }
    }
  }

  function restoreDraft() {
    if (!draft.available) return;
    const v = draft.available.value;
    // Ordre important : thematic d'abord — les useEffect de cascade
    // resetteraient criteriaId/testReference sinon. On positionne tout
    // dans le même render tick côté React, puis on laisse les effets
    // de cascade valider (ce qu'ils feront sans rien casser puisque
    // criteriaId appartient bien à thematicId dans un brouillon valide).
    setThematicId(v.thematicId);
    setCriteriaId(v.criteriaId);
    setTestReference(v.testReference);
    setPageId(v.pageId);
    setTitle(v.title);
    setDescription(v.description);
    setActualResult(v.actualResult);
    setRecommendation(v.recommendation);
    setSeverity(v.severity);
    draft.dismissAvailable();
  }

  // -- Données dérivées de la sélection --------------------------------------
  const filteredCriteria = useMemo(
    () => criteria.filter((c) => c.thematicId === thematicId),
    [criteria, thematicId],
  );

  const selectedCriterion = useMemo(
    () => criteria.find((c) => c.id === criteriaId) ?? null,
    [criteria, criteriaId],
  );

  const availableTests = useMemo(
    () => parseMethodology(selectedCriterion?.methodology ?? null),
    [selectedCriterion],
  );

  // Cascade : quand on change de thématique, on reset le critère + test.
  // Quand on change de critère, on reset le test (mais on auto-sélectionne
  // l'unique test s'il n'y en a qu'un — UX courant en RGAA).
  useEffect(() => {
    if (criteriaId && !filteredCriteria.some((c) => c.id === criteriaId)) {
      setCriteriaId("");
      setTestReference("");
    }
  }, [filteredCriteria, criteriaId]);

  useEffect(() => {
    const onlyTest = availableTests.length === 1 ? availableTests[0] : null;
    if (onlyTest) {
      setTestReference(onlyTest.reference);
    } else if (
      testReference &&
      !availableTests.some((tst) => tst.reference === testReference)
    ) {
      setTestReference("");
    }
    // testReference exclu volontairement pour éviter une boucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableTests]);

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
    if (!thematicId) {
      setError(t("thematicRequired"));
      return;
    }
    if (!criteriaId) {
      setError(t("criterionRequired"));
      return;
    }
    if (!pageId) {
      setError(t("pageRequired"));
      return;
    }
    // Le test n'est requis que s'il existe au moins un test parsé. Certains
    // critères sans méthodologie chargée n'imposent rien.
    if (availableTests.length > 0 && !testReference) {
      setError(t("testRequired"));
      return;
    }
    setError(null);
    setWarning(null);
    startTransition(async () => {
      const result = await createNC({
        auditId,
        pageId,
        criteriaId,
        title: title.trim(),
        description: description.trim() || null,
        actualResult: actualResult.trim() || null,
        recommendation: recommendation.trim() || null,
        severity,
        testReference: testReference || null,
      });
      if (result.error || !result.ncId) {
        setError(result.error ?? t("creationFailed"));
        return;
      }

      const ncId = result.ncId;
      const failures = await uploadFiles(ncId);
      if (failures.length > 0) {
        setWarning(
          t("captureWarning", {
            count: failures.length,
            errors: failures.join(" ; "),
          }),
        );
      }

      // La NC est créée — on peut purger le brouillon. Si l'upload des
      // captures a échoué, ce n'est pas grave pour le brouillon : la NC
      // existe déjà côté serveur, ré-uploadable depuis sa page de détail.
      draft.clear();

      router.push(`/audits/${auditId}/anomalies/${ncId}`);
    });
  };

  const noPages = pages.length === 0;
  const noCriteria = criteria.length === 0;

  return (
    <div className="container mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <Button asChild variant="ghost" size="sm" className="gap-1 -ml-3">
        <Link href={`/audits/${auditId}/anomalies`}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t("back")}
        </Link>
      </Button>

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("info")}</CardTitle>
        </CardHeader>
        <CardContent>
          {(noPages || noCriteria) && (
            <p
              role="alert"
              className="mb-4 rounded-md bg-warning/10 p-3 text-sm text-warning"
            >
              {noPages ? t("noPages") : t("noCriteria")}
            </p>
          )}

          {draft.available && (
            <div
              role="status"
              className="mb-4 flex flex-col gap-3 rounded-md border border-primary/30 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm">
                <span className="font-medium">{tDraft("bannerTitle")}</span>{" "}
                <span className="text-muted-foreground">
                  {tDraft("bannerHint", {
                    when: format.relativeTime(draft.available.savedAt),
                  })}
                </span>
              </p>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    draft.clear();
                  }}
                  className="gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {tDraft("discard")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={restoreDraft}
                  className="gap-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  {tDraft("restore")}
                </Button>
              </div>
            </div>
          )}

          {templates.length > 0 && (
            <div className="mb-4 flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-3 sm:flex-row sm:items-center">
              <div className="flex shrink-0 items-center gap-1.5 text-sm font-medium">
                <Sparkles
                  className="h-3.5 w-3.5 text-primary"
                  aria-hidden="true"
                />
                {t("templatesLabel")}
              </div>
              <Select
                value=""
                onValueChange={(v) => {
                  if (v) applyTemplate(v);
                }}
              >
                <SelectTrigger
                  className="flex-1"
                  aria-label={t("templatesAria")}
                >
                  <SelectValue placeholder={t("templatesPlaceholder")} />
                </SelectTrigger>
                <SelectContent className="max-h-[60vh]">
                  {templates.map((tpl) => (
                    <SelectItem key={tpl.id} value={tpl.id}>
                      <span>{tpl.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({tSeverity(tpl.severity)})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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

            {/* --- Page (toujours requis) ------------------------------- */}
            <div className="space-y-2">
              <Label htmlFor="nc-page">{t("page")} *</Label>
              <Select value={pageId} onValueChange={setPageId}>
                <SelectTrigger id="nc-page">
                  <SelectValue placeholder={t("pagePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {pages.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* --- Cascade Thématique → Critère → Test ------------------ */}
            <div className="space-y-2">
              <Label htmlFor="nc-thematic">{t("thematic")} *</Label>
              <Select value={thematicId} onValueChange={setThematicId}>
                <SelectTrigger id="nc-thematic">
                  <SelectValue placeholder={t("thematicPlaceholder")} />
                </SelectTrigger>
                <SelectContent className="max-h-[60vh]">
                  {thematics.map((tm) => (
                    <SelectItem key={tm.id} value={tm.id}>
                      <span className="font-mono text-xs text-muted-foreground">
                        {tm.identifier}
                      </span>
                      <span className="ml-2">{tm.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nc-criteria">{t("criterion")} *</Label>
              <Select
                value={criteriaId}
                onValueChange={setCriteriaId}
                disabled={!thematicId}
              >
                <SelectTrigger id="nc-criteria">
                  <SelectValue
                    placeholder={
                      thematicId
                        ? t("criterionPlaceholder")
                        : t("criterionPlaceholderDisabled")
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-[60vh]">
                  {filteredCriteria.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="font-mono text-xs text-muted-foreground">
                        {c.identifier}
                      </span>
                      <span className="ml-2">{c.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nc-test">
                {t("test")}
                {availableTests.length > 0 ? " *" : ""}
              </Label>
              <Select
                value={testReference}
                onValueChange={setTestReference}
                disabled={!criteriaId || availableTests.length === 0}
              >
                <SelectTrigger id="nc-test">
                  <SelectValue
                    placeholder={
                      !criteriaId
                        ? t("testPlaceholderDisabled")
                        : availableTests.length === 0
                          ? t("testPlaceholderNone")
                          : t("testPlaceholder")
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-[60vh]">
                  {availableTests.map((tst) => (
                    <SelectItem key={tst.reference} value={tst.reference}>
                      <span className="font-mono text-xs text-muted-foreground">
                        {tst.reference}
                      </span>
                      <span className="ml-2 max-w-md truncate align-middle">
                        {tst.question}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {criteriaId && availableTests.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("testNoneNote")}
                </p>
              )}
            </div>

            {/* --- Reste du formulaire ---------------------------------- */}
            <div className="space-y-2">
              <Label htmlFor="nc-title">{t("ncTitle")} *</Label>
              <Input
                id="nc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("ncTitlePlaceholder")}
                required
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nc-description">{t("description")}</Label>
              <Textarea
                id="nc-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder={t("descriptionPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nc-actual-result">{t("actualResult")}</Label>
              <Textarea
                id="nc-actual-result"
                value={actualResult}
                onChange={(e) => setActualResult(e.target.value)}
                rows={4}
                placeholder={t("actualResultPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nc-recommendation">{t("recommendation")}</Label>
              <Textarea
                id="nc-recommendation"
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                rows={4}
                placeholder={t("recommendationPlaceholder")}
              />
            </div>

            <div className="space-y-2 sm:max-w-xs">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="nc-severity">{t("severity")}</Label>
                <InfoTip label={t("severityHelpAria")}>
                  <div className="space-y-1.5">
                    <p className="font-semibold">{t("severityHelp.title")}</p>
                    <p>
                      <strong>{tSeverity("CRITICAL")} :</strong>{" "}
                      {t("severityHelp.critical")}
                    </p>
                    <p>
                      <strong>{tSeverity("HIGH")} :</strong>{" "}
                      {t("severityHelp.high")}
                    </p>
                    <p>
                      <strong>{tSeverity("MEDIUM")} :</strong>{" "}
                      {t("severityHelp.medium")}
                    </p>
                    <p>
                      <strong>{tSeverity("LOW")} :</strong>{" "}
                      {t("severityHelp.low")}
                    </p>
                  </div>
                </InfoTip>
              </div>
              <Select
                value={severity}
                onValueChange={(v) => setSeverity(v as NCSeverity)}
              >
                <SelectTrigger id="nc-severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {tSeverity(s)}
                    </SelectItem>
                  ))}
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
                disabled={submitting}
              />
            </div>

            <div className="flex flex-col items-stretch gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              {draft.savedAt ? (
                <p
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                  aria-live="polite"
                >
                  <Save className="h-3 w-3" aria-hidden="true" />
                  {tDraft("savedAt", {
                    when: format.relativeTime(draft.savedAt),
                  })}
                </p>
              ) : (
                <span aria-hidden="true" />
              )}
              <div className="flex items-center justify-end gap-2">
              <Button
                asChild
                type="button"
                variant="ghost"
                size="sm"
                disabled={submitting}
              >
                <Link href={`/audits/${auditId}/anomalies`}>{t("cancel")}</Link>
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting || noPages || noCriteria}
                className="gap-1"
              >
                {submitting && (
                  <Loader2
                    className="h-3.5 w-3.5 animate-spin"
                    aria-hidden="true"
                  />
                )}
                {t("submit")}
              </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
