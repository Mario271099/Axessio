import { ImageResponse } from "next/og";

// Apple Touch Icon - utilisée par iOS quand l'utilisateur ajoute Axessyo à
// l'écran d'accueil. Reprend le monogramme « A y » du logo du header (même
// géométrie que `icon.svg`), couleurs de marque hardcodées car ce fichier est
// servi en dehors du DOM de l'app (les CSS variables ne sont pas résolues ici).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#1a4066",
        }}
      >
        <svg width="180" height="180" viewBox="0 0 56 56" fill="none">
          <rect width="56" height="56" fill="#1a4066" />
          <path
            d="M10 40 L15.8 14 c0.4 -1.6 2.6 -1.6 3 0 L22.5 28"
            stroke="#FFFFFF"
            strokeWidth="4.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M12.5 31.5 h8" stroke="#FFFFFF" strokeWidth="4.4" strokeLinecap="round" />
          <path d="M26 20 L33.5 34" stroke="#FFFFFF" strokeWidth="4.4" strokeLinecap="round" />
          <path d="M41 20 L33.5 34" stroke="#FFFFFF" strokeWidth="4.4" strokeLinecap="round" />
          <path d="M33.5 34 L30.5 44" stroke="#FFFFFF" strokeWidth="4.4" strokeLinecap="round" />
          <circle cx="37" cy="14" r="4" fill="#06b6d4" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
