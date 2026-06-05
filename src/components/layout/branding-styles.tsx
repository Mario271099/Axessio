// Composant serveur qui injecte les couleurs de l'org active dans le DOM
// via des CSS variables. Tailwind v4 lit `--primary` / `--ring` / `--accent`
// au format HSL "H S% L%", donc on convertit les HEX fournis par l'org.
//
// Si l'org n'a pas de branding (plan inférieur à Enterprise, ou colonnes
// vides), on ne rend rien — le design system Axessyo par défaut s'applique.

import { getCurrentOrgBranding } from "@/lib/branding/server";

function hexToHsl(hex: string): string | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const value = match?.[1];
  if (!value) return null;
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  const hh = Math.round(h);
  const ss = Math.round(s * 100);
  const ll = Math.round(l * 100);
  return `${hh} ${ss}% ${ll}%`;
}

export async function BrandingStyles() {
  const branding = await getCurrentOrgBranding();
  if (!branding) return null;
  const primary = branding.primaryColor
    ? hexToHsl(branding.primaryColor)
    : null;
  const accent = branding.accentColor ? hexToHsl(branding.accentColor) : null;
  if (!primary && !accent) return null;

  // CSS string assemblé côté serveur. Pas d'interpolation user-controlled ici
  // au-delà des valeurs HSL déjà normalisées par hexToHsl() (regex stricte).
  const rules: string[] = [];
  if (primary) {
    rules.push(`--primary: ${primary}`);
    rules.push(`--ring: ${primary}`);
  }
  if (accent) {
    rules.push(`--accent: ${accent}`);
  }
  const css = `:root { ${rules.join("; ")}; } .dark { ${rules.join("; ")}; }`;

  return (
    <style
      // dangerouslySetInnerHTML est requis : <style>{css}</style> serait
      // échappé. Le CSS ci-dessus est entièrement généré côté serveur, sans
      // interpolation utilisateur libre (uniquement les valeurs HSL validées).
      dangerouslySetInnerHTML={{ __html: css }}
    />
  );
}
