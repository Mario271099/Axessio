"use client";

// Carte « Détails de la NC » : lecture + formulaire d'édition (description,
// résultat constaté, recommandation, sévérité, page). Extrait de nc-detail.tsx
// (découpage des gros composants) — markup et comportement inchangés.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type { NCSeverity } from "@/types/domain";
import { updateNC } from "./actions";
import type { NCData, PageData } from "./nc-detail-types";

const SEVERITIES: NCSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const TRANSVERSAL_VALUE = "null";

interface NCDetailsCardProps {
  nc: NCData;
  pages: PageData[];
  auditId: string;
  /** Peut éditer la NC (droit nc.edit). */
  isAuditor: boolean;
}

export function NCDetailsCard({
  nc,
  pages,
  auditId,
  isAuditor,
}: NCDetailsCardProps) {
  const router = useRouter();
  const t = useTranslations("audits.ncDetail");
  const tNcSeverity = useTranslations("constants.ncSeverity");

  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(nc.description ?? "");
  const [actualResult, setActualResult] = useState(nc.actualResult ?? "");
  const [recommendation, setRecommendation] = useState(
    nc.recommendation ?? "",
  );
  const [severity, setSeverity] = useState<NCSeverity>(nc.severity);
  const [pageId, setPageId] = useState<string>(nc.pageId ?? TRANSVERSAL_VALUE);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, startSubmitTransition] = useTransition();

  const cancelEdit = () => {
    setDescription(nc.description ?? "");
    setActualResult(nc.actualResult ?? "");
    setRecommendation(nc.recommendation ?? "");
    setSeverity(nc.severity);
    setPageId(nc.pageId ?? TRANSVERSAL_VALUE);
    setSubmitError(null);
    setEditing(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    const formData = new FormData();
    formData.set("title", nc.title);
    formData.set("description", description);
    formData.set("actualResult", actualResult);
    formData.set("recommendation", recommendation);
    formData.set("severity", severity);
    formData.set("pageId", pageId);
    startSubmitTransition(async () => {
      const result = await updateNC(nc.id, auditId, formData);
      if (result.error) {
        setSubmitError(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">{t("ncDetails")}</CardTitle>
        {isAuditor && !editing && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditing(true)}
            className="gap-1"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            {t("edit")}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && (
              <p
                role="alert"
                className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
              >
                {submitError}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="nc-description">{t("description")}</Label>
              <Textarea
                id="nc-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nc-actual-result">{t("actualResult")}</Label>
              <Textarea
                id="nc-actual-result"
                value={actualResult}
                onChange={(e) => setActualResult(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nc-recommendation">
                {t("recommendation")}
              </Label>
              <Textarea
                id="nc-recommendation"
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
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
                        {tNcSeverity(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nc-page">{t("linkedPage")}</Label>
                <Select value={pageId} onValueChange={setPageId}>
                  <SelectTrigger id="nc-page">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TRANSVERSAL_VALUE}>
                      {t("transversal")}
                    </SelectItem>
                    {pages.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting && (
                  <Loader2
                    className="h-3.5 w-3.5 animate-spin"
                    aria-hidden="true"
                  />
                )}
                {t("save")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={cancelEdit}
                disabled={submitting}
                className="gap-1"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                {t("cancel")}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <ReadField label={t("description")} value={nc.description} />
            <ReadField label={t("actualResult")} value={nc.actualResult} />
            <ReadField
              label={t("recommendation")}
              value={nc.recommendation}
            />
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-muted-foreground">
              <span>
                {t("page")}{" "}
                <span className="text-foreground">
                  {nc.page?.name ?? t("transversalShort")}
                </span>
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReadField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  const t = useTranslations("audits.ncDetail");
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {value ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{value}</p>
      ) : (
        <p className="text-sm italic text-muted-foreground">{t("notFilled")}</p>
      )}
    </div>
  );
}
