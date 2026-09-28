import { ScoreRing } from "@/components/ui/score-ring";
import { Card } from "@/components/ui/card";

interface AverageScoreCardProps {
  /** Score moyen 0-100, `null` si aucun audit évalué. */
  score: number | null;
  /** Titre de la carte, ex. « Conformité moyenne ». */
  title: string;
  /** Verdict officiel du score (conformité totale / partielle / non conforme). */
  verdict: string;
  /** Note de bas de carte, ex. « Sur 19 audits évalués ». */
  note: string;
  /** Nom accessible de l'anneau. */
  ringLabel: string;
}

/**
 * Carte sombre de synthèse du tableau de bord : anneau ambre du score moyen,
 * verdict officiel et volume d'audits pris en compte. L'ambre reste ici
 * purement graphique — le texte, lui, est blanc.
 */
export function AverageScoreCard({
  score,
  title,
  verdict,
  note,
  ringLabel,
}: AverageScoreCardProps) {
  return (
    <Card
      tone="ink"
      className="flex items-center gap-5 p-5 sm:col-span-2 lg:col-span-1"
    >
      <ScoreRing
        value={score}
        size={104}
        tone="highlight"
        trackColor="hsl(var(--ink-surface-raised))"
        valueClassName="text-ink-foreground"
        ariaLabel={ringLabel}
      />
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-ink-muted">{title}</h2>
        <p className="mt-1 text-xl font-extrabold leading-tight">{verdict}</p>
        <p className="mt-1.5 text-sm text-ink-muted">{note}</p>
      </div>
    </Card>
  );
}
