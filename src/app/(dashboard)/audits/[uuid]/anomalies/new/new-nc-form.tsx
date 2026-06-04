"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useFormatter } from "next-intl";
import { toast } from "sonner";
import {
  ChevronLeft,
  Eye,
  Loader2,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDraftStorage } from "@/hooks/use-draft-storage";
import { requestNCReview } from "@/app/(dashboard)/audits/[uuid]/anomalies/[ncId]/review-actions";
import type { NCTemplate } from "@/types/domain";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  /** Lien vers la documentation officielle (RGAA / WCAG / etc.). */
  url: string | null;
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
  const [description, setDescription] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [severity, setSeverity] = useState<NCSeverity>("MEDIUM");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [submitting, startTransition] = useTransition();
  // Mode de soumission : « create » = juste créer, « create_and_request »
  // = créer puis enchaîner requestNCReview. Lu par handleSubmit pour
  // décider quoi faire après createNC.
  const [submitMode, setSubmitMode] = useState<"create" | "create_and_request">(
    "create",
  );

  // ---- Brouillon localStorage --------------------------------------------
  // Snapshot du formulaire sans les fichiers (non sérialisables) ni les
  // états d'UI (error/warning/submitting). Sauvegarde debounced.
  type Draft = {
    thematicId: string;
    criteriaId: string;
    testReference: string;
    pageId: string;
    description: string;
    recommendation: string;
    severity: NCSeverity;
  };
  const draftValue: Draft = {
    thematicId,
    criteriaId,
    testReference,
    pageId,
    description,
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
        v.description.trim() ||
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
    // Le titre du template (titleTemplate) renseigne la description faute
    // de mieux : on a supprimé le champ titre, et la description portait
    // historiquement le détail de la NC. Si le template a aussi une
    // description, on préfère elle (plus riche).
    setDescription(tpl.descriptionTemplate ?? tpl.titleTemplate);
    setRecommendation(tpl.recommendationTemplate ?? "");
    setSeverity(tpl.severity);
    if (tpl.criterionId) {
      const matched = criteria.find((c) => c.id === tpl.criterionId);
      if (matched) {
        setThematicId(matched.thematicId);
        setCriteriaId(matched.id);
      }
    }
  }

  function restoreDraft() {
    if (!draft.available) return;
    const v = draft.available.value;
    setThematicId(v.thematicId);
    setCriteriaId(v.criteriaId);
    setTestReference(v.testReference);
    setPageId(v.pageId);
    setDescription(v.description);
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
    // Validation client — tous les champs sauf captures sont requis.
    if (!pageId) {
      setError(t("pageRequired"));
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
    if (availableTests.length > 0 && !testReference) {
      setError(t("testRequired"));
      return;
    }
    if (!description.trim()) {
      setError(t("descriptionRequired"));
      return;
    }
    if (!recommendation.trim()) {
      setError(t("recommendationRequired"));
      return;
    }
    setError(null);
    setWarning(null);
    // Capture la valeur de submitMode au moment du submit — handleSubmit est
    // exécuté en réponse au click, après quoi setSubmitMode pourrait être
    // ré-armé par un autre click avant la fin de la transition.
    const mode = submitMode;
    startTransition(async () => {
      const result = await createNC({
        auditId,
        pageId,
        criteriaId,
        description: description.trim(),
        recommendation: recommendation.trim(),
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

      // NC créée → purge du brouillon. L'éventuel échec d'upload des
      // captures ne ramène pas le brouillon (la NC existe déjà côté
      // serveur, ré-uploadable depuis sa page de détail).
      draft.clear();

      // Si l'utilisateur a cliqué sur « Créer et demander une relecture »,
      // on enchaîne avec requestNCReview. L'échec n'interrompt pas le flux :
      // la NC reste créée, on prévient juste l'utilisateur via toast.
      if (mode === "create_and_request") {
        const reviewRes = await requestNCReview(ncId);
        if (!reviewRes.ok) {
          toast.warning(t("createdReviewFailed"), {
            description: reviewRes.message ?? undefined,
          });
        } else {
          toast.success(t("createdAndReviewSuccess"));
        }
      } else {
        toast.success(t("createdSuccess"));
      }

      // Reset complet du formulaire pour proposer un « nouveau » form au
      // même endroit. router.push vers la même URL ne suffit pas : le
      // composant client n'est pas démonté, les useState gardent leurs
      // valeurs. On remet donc explicitement chaque champ à son défaut.
      // router.refresh() re-fetch les pages/critères côté serveur si jamais
      // l'utilisateur a ajouté une page entre-temps depuis un autre onglet.
      setThematicId("");
      setCriteriaId("");
      setTestReference("");
      setPageId("");
      setDescription("");
      setRecommendation("");
      setSeverity("MEDIUM");
      setFiles([]);
      setError(null);
      setWarning(null);
      setSubmitMode("create");
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      router.refresh();
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

      {/* Bandeaux globaux (au-dessus des cards) :
          - Avertissement pas de pages / critères
          - Banner brouillon trouvé
          - Picker template
          - Erreur / warning de soumission
          Ils restent en dehors des cards parce qu'ils s'appliquent à la
          page entière, pas à une étape précise. */}

      {(noPages || noCriteria) && (
        <p
          role="alert"
          className="rounded-md bg-warning/10 p-3 text-sm text-warning"
        >
          {noPages ? t("noPages") : t("noCriteria")}
        </p>
      )}

      {draft.available && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-md border border-primary/30 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between"
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
              onClick={() => draft.clear()}
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
        <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-3 sm:flex-row sm:items-center">
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
            <SelectTrigger className="flex-1" aria-label={t("templatesAria")}>
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

      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* ============ Card 1 : Contexte du critère ====================== */}
        {/* Page de l'audit + cascade thématique / critère + méthodologie.
            Tous les inputs « quoi est concerné » sont regroupés ici pour
            permettre à l'auditeur d'ancrer la NC avant d'en décrire le
            détail. */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("sectionContextTitle")}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("sectionContextDesc")}
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
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

            <div className="grid gap-4 md:grid-cols-2">
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
            </div>

            {/* Méthodologie : panel radio-cards de tous les tests du
                critère, avec leur question complète. */}
            <fieldset
              className="space-y-3 rounded-md border border-border bg-muted/20 p-3"
              aria-describedby="nc-tests-help"
            >
              <legend className="px-1 text-sm font-medium">
                {t("test")} *
              </legend>
              <p
                id="nc-tests-help"
                className="px-1 text-xs text-muted-foreground"
              >
                {!criteriaId
                  ? t("testPlaceholderDisabled")
                  : availableTests.length === 0
                    ? t("testNoneNote")
                    : t("testPickerHint")}
              </p>
              {criteriaId && selectedCriterion?.url && (
                <a
                  href={selectedCriterion.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-1 text-xs text-primary hover:underline"
                >
                  {t("testRefDocLink")}
                </a>
              )}
              {criteriaId && availableTests.length > 0 && (
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
                          name="nc-test-radio"
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
              )}
            </fieldset>
          </CardContent>
        </Card>

        {/* ============ Card 2 : Détail de la non-conformité ============== */}
        {/* Sévérité + description + recommandation. C'est le contenu
            « narratif » de la NC une fois le contexte ancré. */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("sectionDetailTitle")}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("sectionDetailDesc")}
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2 sm:max-w-xs">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="nc-severity">{t("severity")}</Label>
                <InfoTip label={t("severityHelpAria")}>
                  <div className="space-y-1.5">
                    <p className="font-semibold">
                      {t("severityHelp.title")}
                    </p>
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
              <Label htmlFor="nc-description">{t("description")} *</Label>
              <Textarea
                id="nc-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
                placeholder={t("descriptionPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nc-recommendation">
                {t("recommendation")} *
              </Label>
              <Textarea
                id="nc-recommendation"
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                rows={4}
                required
                placeholder={t("recommendationPlaceholder")}
              />
            </div>
          </CardContent>
        </Card>

        {/* ============ Card 3 : Pièces jointes & validation ============== */}
        {/* Drop-zone fichiers + barre d'actions (Annuler / Créer / Créer +
            demander relecture) avec indicateur de sauvegarde brouillon. */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("sectionAttachmentsTitle")}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("sectionAttachmentsDesc")}
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
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
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  asChild
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={submitting}
                >
                  <Link href={`/audits/${auditId}/anomalies`}>
                    {t("cancel")}
                  </Link>
                </Button>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={submitting || noPages || noCriteria}
                  className="gap-1"
                  onClick={() => setSubmitMode("create_and_request")}
                >
                  {submitting && submitMode === "create_and_request" && (
                    <Loader2
                      className="h-3.5 w-3.5 animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("submitAndRequestReview")}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting || noPages || noCriteria}
                  className="gap-1"
                  onClick={() => setSubmitMode("create")}
                >
                  {submitting && submitMode === "create" && (
                    <Loader2
                      className="h-3.5 w-3.5 animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  {t("submit")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
