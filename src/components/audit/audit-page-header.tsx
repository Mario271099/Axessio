import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronRight } from "lucide-react";
import { AuditTabsNav, type AuditTab } from "@/components/audit/audit-tabs-nav";
import { monogram, themeColorVar } from "@/lib/utils";
import type { AuditStatus } from "@/types/domain";

/** Informations d'identité d'un audit, partagées par toutes ses pages. */
export interface AuditHeaderData {
  /** Titre principal : nom du site ou de l'application auditée. */
  title: string;
  /** Nom du client — fil d'Ariane et couleur du monogramme. */
  clientName: string | null;
  /** Adresse du site audité. */
  siteUrl: string | null;
  /** `false` pour une application mobile : l'adresse n'est pas cliquable. */
  urlIsLink: boolean;
  /** Ex. « RGAA 4.1.2 ». */
  referenceLabel: string;
  /** Ex. « Site web » / « Application mobile ». */
  platformLabel: string;
  /** Ex. « Audit complet ». */
  serviceTypeLabel: string;
  status: AuditStatus;
  /** Compteurs affichés dans les onglets. */
  counts: { sample: number; anomalies: number };
}

interface AuditPageHeaderProps {
  auditId: string;
  /** Onglet courant. */
  active: AuditTab;
  data: AuditHeaderData;
  /**
   * Niveau de titre du nom de l'audit. `h1` sur la vue d'ensemble ; `p` sur
   * les sous-pages, qui portent deja leur propre h1 (Echantillon, NC...).
   */
  titleAs?: "h1" | "p";
  /** Pastille de statut de l'audit. */
  status?: React.ReactNode;
  /** Boutons d'action alignés à droite. */
  actions?: React.ReactNode;
}

/**
 * En-tête commun aux pages d'un audit : fil d'Ariane, monogramme du client,
 * titre, statut, informations, actions, puis les onglets soulignés. Posé en
 * bande blanche pleine largeur au-dessus du contenu de la page, il donne le
 * même point de repère sur tous les écrans de l'audit.
 */
export async function AuditPageHeader({
  auditId,
  active,
  data,
  titleAs = "h1",
  status,
  actions,
}: AuditPageHeaderProps) {
  const t = await getTranslations("audits.header");
  const seed = data.clientName || data.title;
  const Title = titleAs;

  const metaParts: React.ReactNode[] = [];
  if (data.siteUrl) {
    metaParts.push(
      data.urlIsLink ? (
        <a
          key="url"
          href={data.siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-primary underline-offset-4 hover:underline"
        >
          {data.siteUrl}
        </a>
      ) : (
        <span key="url" className="break-all">
          {data.siteUrl}
        </span>
      ),
    );
  }
  for (const [key, label] of [
    ["reference", data.referenceLabel],
    ["platform", data.platformLabel],
    ["service", data.serviceTypeLabel],
  ] as const) {
    if (label) metaParts.push(<span key={key}>{label}</span>);
  }

  return (
    <header className="border-b border-border bg-card px-4 pt-4 md:px-9">
      <nav aria-label={t("breadcrumbAria")}>
        <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <Link href="/audits" className="hover:text-primary">
              {t("allAudits")}
            </Link>
          </li>
          {data.clientName && (
            <>
              <li aria-hidden="true">
                <ChevronRight className="size-3.5" />
              </li>
              <li className="truncate font-semibold">{data.clientName}</li>
            </>
          )}
        </ol>
      </nav>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-x-5 gap-y-3">
        <div className="flex min-w-0 items-center gap-4">
          <span
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-[15px] text-lg font-extrabold text-white md:size-[52px]"
            style={{ background: themeColorVar(seed) }}
          >
            {monogram(seed)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Title className="text-2xl font-black leading-tight tracking-tight md:text-3xl">
                {data.title}
              </Title>
              {status}
            </div>
            {metaParts.length > 0 && (
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
                {metaParts.map((part, index) => (
                  <span key={index} className="flex items-center gap-2">
                    {index > 0 && <span aria-hidden="true">·</span>}
                    {part}
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
        )}
      </div>

      <AuditTabsNav
        auditId={auditId}
        active={active}
        counts={data.counts}
        className="mt-2"
      />
    </header>
  );
}
