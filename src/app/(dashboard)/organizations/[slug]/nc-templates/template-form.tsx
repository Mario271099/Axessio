"use client";

// Formulaire partagé entre création et édition d'un template de NC.
// N'inclut PAS le wrapper modal / les boutons d'action - c'est aux
// composants Dialog parents (new-template-dialog, template-row) de les
// fournir. Garder ça séparé évite la duplication des champs et le code
// "if editMode else createMode" dans un même composant.

import { useState } from "react";
import { useTranslations } from "next-intl";
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
import { REFERENCE_TYPE_LABELS } from "@/lib/constants";
import type { NCSeverity, NCTemplate, ReferenceType } from "@/types/domain";

const SEVERITIES: NCSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const ALL_REFERENCES_VALUE = "__all__";

export interface TemplateFormReference {
  id: string;
  type: ReferenceType;
  version: string;
}

interface Props {
  formId: string;
  references: TemplateFormReference[];
  initial?: NCTemplate;
  onSubmit: (formData: FormData) => void;
}

export function TemplateForm({ formId, references, initial, onSubmit }: Props) {
  const t = useTranslations("organizations.ncTemplates.form");
  const tSeverity = useTranslations("constants.ncSeverity");

  // États contrôlés pour les selects Radix. Les inputs/textarea restent
  // non contrôlés (defaultValue) - pas besoin de hooks, le FormData
  // récupère les valeurs au submit.
  const [severity, setSeverity] = useState<NCSeverity>(
    initial?.severity ?? "MEDIUM",
  );
  const [referenceValue, setReferenceValue] = useState<string>(
    initial?.referenceId ?? ALL_REFERENCES_VALUE,
  );

  function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Le select "All references" est représenté par une valeur sentinelle.
    // On la transforme en chaîne vide côté action.
    if (referenceValue === ALL_REFERENCES_VALUE) {
      formData.set("referenceId", "");
    } else {
      formData.set("referenceId", referenceValue);
    }
    formData.set("severity", severity);
    onSubmit(formData);
  }

  return (
    <form id={formId} onSubmit={handle} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="tpl-label">{t("label")} *</Label>
        <Input
          id="tpl-label"
          name="label"
          required
          maxLength={100}
          defaultValue={initial?.label ?? ""}
          placeholder={t("labelPlaceholder")}
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">{t("labelHint")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="tpl-reference">{t("reference")}</Label>
          <Select value={referenceValue} onValueChange={setReferenceValue}>
            <SelectTrigger id="tpl-reference">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_REFERENCES_VALUE}>
                {t("referenceAll")}
              </SelectItem>
              {references.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {REFERENCE_TYPE_LABELS[r.type]} {r.version}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{t("referenceHint")}</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tpl-severity">{t("severity")} *</Label>
          <Select
            value={severity}
            onValueChange={(v) => setSeverity(v as NCSeverity)}
          >
            <SelectTrigger id="tpl-severity">
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
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tpl-title">{t("title")} *</Label>
        <Input
          id="tpl-title"
          name="titleTemplate"
          required
          maxLength={200}
          defaultValue={initial?.titleTemplate ?? ""}
          placeholder={t("titlePlaceholder")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tpl-description">{t("description")}</Label>
        <Textarea
          id="tpl-description"
          name="descriptionTemplate"
          rows={3}
          defaultValue={initial?.descriptionTemplate ?? ""}
          placeholder={t("descriptionPlaceholder")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tpl-recommendation">{t("recommendation")}</Label>
        <Textarea
          id="tpl-recommendation"
          name="recommendationTemplate"
          rows={3}
          defaultValue={initial?.recommendationTemplate ?? ""}
          placeholder={t("recommendationPlaceholder")}
        />
      </div>
    </form>
  );
}
