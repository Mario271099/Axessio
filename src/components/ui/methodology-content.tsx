import { Fragment } from "react";

// Rendu léger (sans dépendance markdown) des procédures de test officielles
// stockées dans `criteria.test_procedures` / `criteria.methodology`.
//
// Le contenu source est du markdown simple issu des référentiels officiels
// (RGAA / RAWeb / RAAM) : listes numérotées, sous-puces, `code`, **gras**,
// liens `[texte](url)` (vers le glossaire, non navigables ici) et titres
// `###### ...`. On préserve l'indentation (retraits des sous-puces) et on
// applique le formatage inline, sans tirer une lib markdown complète.

// Découpe une ligne en nœuds React en gérant `code`, **gras** et liens.
function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Un seul passage : on capture, dans l'ordre de priorité, `code`, **gras**
  // ou [texte](url). Tout le reste est du texte brut.
  const pattern = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\([^)]*\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    if (match[1] !== undefined) {
      nodes.push(
        <code
          key={key++}
          className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]"
        >
          {match[1]}
        </code>,
      );
    } else if (match[2] !== undefined) {
      nodes.push(<strong key={key++}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      // Lien vers le glossaire : on garde uniquement le libellé.
      nodes.push(match[3]);
    }
    last = pattern.lastIndex;
  }
  if (last < text.length) {
    nodes.push(text.slice(last));
  }
  return nodes;
}

export function MethodologyContent({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");

  return (
    <div
      className={
        "space-y-1 text-sm leading-relaxed" + (className ? " " + className : "")
      }
    >
      {lines.map((rawLine, i) => {
        const line = rawLine.replace(/\s+$/, "");
        if (!line.trim()) {
          return <div key={i} className="h-2" aria-hidden="true" />;
        }
        // Titre markdown (###### iOS et Android dans RAAM).
        const heading = /^#{1,6}\s+(.*)$/.exec(line.trim());
        if (heading) {
          return (
            <p key={i} className="font-semibold text-foreground">
              {renderInline(heading[1] ?? "")}
            </p>
          );
        }
        // Indentation : on convertit les espaces de tête en retrait visuel
        // pour conserver la hiérarchie des sous-puces.
        const indent = rawLine.match(/^\s*/)?.[0].length ?? 0;
        return (
          <p
            key={i}
            className="text-muted-foreground"
            style={indent > 0 ? { paddingLeft: `${indent * 0.5}rem` } : undefined}
          >
            {renderInline(line.trim())}
          </p>
        );
      })}
    </div>
  );
}

// Variante "Fragment" si on veut injecter sans wrapper (peu utilisé).
export function MethodologyInline({ content }: { content: string }) {
  return <Fragment>{renderInline(content)}</Fragment>;
}
