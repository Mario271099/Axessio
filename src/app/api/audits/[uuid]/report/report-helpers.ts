// Helpers purs du rapport PDF : échappement HTML, dates, compteurs de
// conformité, palette de couleurs. Extraits de report-template.tsx
// (découpage des gros fichiers).

import { calculateScore, getConformityLevel } from "@/lib/score";
import type { ConformityStatus } from "@/types/domain";
import type { ReportLocale } from "./report-types";

export function intlLocale(locale: ReportLocale): string {
  return locale === "en" ? "en-US" : "fr-FR";
}

export function esc(value: string | null | undefined): string {
  if (value == null) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatDate(iso: string | null, locale: ReportLocale): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(intlLocale(locale), {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export interface ConformityCounts {
  compliant: number;
  nonCompliant: number;
  notApplicable: number;
  total: number;
}

export function emptyCounts(): ConformityCounts {
  return { compliant: 0, nonCompliant: 0, notApplicable: 0, total: 0 };
}

export function addStatus(
  counts: ConformityCounts,
  status: ConformityStatus,
): void {
  counts.total += 1;
  if (status === "COMPLIANT") counts.compliant += 1;
  else if (status === "NON_COMPLIANT") counts.nonCompliant += 1;
  else if (status === "NOT_APPLICABLE") counts.notApplicable += 1;
}

export function rate(counts: ConformityCounts): number {
  return calculateScore({
    compliant: counts.compliant,
    notApplicable: counts.notApplicable,
    totalCriteria: counts.total,
  });
}

export function formatRate(value: number): string {
  return `${value.toFixed(2).replace(/\.00$/, "")} %`;
}

export const COLORS = {
  text: "#111111",
  muted: "#6b7280",
  light: "#d1d5db",
  bg: "#f9fafb",
  green: "#16a34a",
  red: "#dc2626",
  orange: "#ea580c",
};

export function colorForScore(score: number): string {
  switch (getConformityLevel(score)) {
    case "non-compliant":
      return COLORS.red;
    case "partial":
      return COLORS.orange;
    case "full":
      return COLORS.green;
  }
}
