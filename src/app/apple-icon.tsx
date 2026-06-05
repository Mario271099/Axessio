import { ImageResponse } from "next/og";

// Apple Touch Icon — utilisée par iOS quand l'utilisateur ajoute Axessyo à
// l'écran d'accueil. Reproduit le design de `AxIcon` (scheme "accent") avec
// les couleurs de marque hardcodées car ce fichier est servi en dehors du
// DOM de l'app (les CSS variables ne sont pas résolues ici).
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
          alignItems: "center",
          justifyContent: "center",
          background: "#1a4066",
          borderRadius: 40,
          position: "relative",
        }}
      >
        <span
          style={{
            color: "#FFFFFF",
            fontSize: 100,
            fontWeight: 800,
            letterSpacing: -5,
            lineHeight: 1,
          }}
        >
          Ax
        </span>
        <div
          style={{
            position: "absolute",
            right: 32,
            bottom: 32,
            width: 18,
            height: 18,
            borderRadius: 9,
            background: "#06b6d4",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
