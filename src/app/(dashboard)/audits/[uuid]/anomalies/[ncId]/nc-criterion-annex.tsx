"use client";

// « Annexe, critère lié » - dernier bloc de la fiche NC, replié par défaut.
// Le critère et sa méthodologie sont un complément de lecture : ils ne
// doivent pas pousser le constat et les captures vers le bas.

import { useTranslations } from "next-intl";
import { BookOpen, ChevronDown, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn, themeColorForIdentifier } from "@/lib/utils";
import type { CriterionData } from "./nc-detail-types";

interface NCCriterionAnnexProps {
  criterion: CriterionData;
  /** Référence du test sélectionné à la création de la NC, si renseignée. */
  testReference: string | null;
  /** Déplié. L'état vit dans la fiche : le lien de l'en-tête l'ouvre aussi. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NCCriterionAnnex({
  criterion,
  testReference,
  open,
  onOpenChange,
}: NCCriterionAnnexProps) {
  const t = useTranslations("audits.ncDetail");

  const color = themeColorForIdentifier(
    criterion.identifier.split(".")[0] ?? "",
  );

  return (
    <Card id="nc-annex" className="scroll-mt-24 p-1.5">
      <h2 className="m-0">
        <button
          type="button"
          id="nc-annex-toggle"
          aria-expanded={open}
          aria-controls="nc-annex-body"
          onClick={() => onOpenChange(!open)}
          className={cn(
            "flex w-full items-center gap-3.5 rounded-[0.875rem] px-4 py-3.5 text-left",
            "transition-colors hover:bg-primary-softer",
          )}
        >
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl text-[0.8rem] font-black tabular text-white"
            style={{ background: color }}
          >
            {criterion.identifier}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-[0.8rem] font-bold text-muted-foreground">
              {t("annexTitle")}
            </span>
            <span className="text-[1.05rem] font-extrabold leading-snug">
              {criterion.name}
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "ml-auto size-5 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </button>
      </h2>

      <div
        id="nc-annex-body"
        role="region"
        aria-labelledby="nc-annex-toggle"
        hidden={!open}
        className="flex flex-col gap-3.5 px-5 pb-5 pt-1 sm:pl-[74px]"
      >
        {testReference && (
          <dl className="grid grid-cols-[minmax(0,140px)_minmax(0,1fr)] gap-x-3 gap-y-2 text-[0.95rem]">
            <dt className="text-muted-foreground">{t("testLabel")}</dt>
            <dd className="m-0 font-bold">{testReference}</dd>
          </dl>
        )}

        <div className="rounded-row border border-border bg-primary-softer p-3.5">
          <h3 className="flex items-center gap-2 text-sm font-extrabold">
            <BookOpen className="size-3.5 text-primary" aria-hidden="true" />
            {t("methodology")}
          </h3>
          {criterion.methodology ? (
            <p className="mt-1.5 whitespace-pre-wrap text-[0.95rem] leading-relaxed text-secondary-foreground">
              {criterion.methodology}
            </p>
          ) : (
            <p className="mt-1.5 text-[0.95rem] italic text-muted-foreground">
              {t("noMethodology")}
            </p>
          )}
        </div>

        {criterion.url && (
          <a
            href={criterion.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 self-start rounded text-[0.95rem] font-bold text-primary underline decoration-1 underline-offset-4 hover:decoration-2"
          >
            {t("officialDocs")}
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        )}
      </div>
    </Card>
  );
}
