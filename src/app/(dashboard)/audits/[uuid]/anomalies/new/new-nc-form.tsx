"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
}

export function NewNCForm({
  auditId,
  pages,
  thematics,
  criteria,
}: NewNCFormProps) {
  const router = useRouter();
  const t = useTranslations("audits.anomaliesNew");
  const tSeverity = useTranslations("constants.ncSeverity");

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
              <Label htmlFor="nc-severity">{t("severity")}</Label>
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

            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
