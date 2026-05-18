import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

// Image Open Graph (1.91:1) — affichée par Facebook, LinkedIn, Slack, Discord,
// l'aperçu enrichi WhatsApp. Le design reprend les couleurs du favicon
// (indigo brand + point teal-mint) pour rester reconnaissable.
export const alt = `${SITE.name} — ${SITE.tagline.fr}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, hsl(244, 76%, 52%) 0%, hsl(239, 84%, 67%) 100%)",
          padding: "72px 80px",
          color: "#FFFFFF",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Pattern de points en fond */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.16) 1px, transparent 0)",
            backgroundSize: "32px 32px",
            opacity: 0.5,
          }}
        />

        {/* Header — logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <span
              style={{
                color: "hsl(244, 76%, 52%)",
                fontSize: 40,
                fontWeight: 800,
                letterSpacing: -2,
                lineHeight: 1,
              }}
            >
              Ax
            </span>
            <div
              style={{
                position: "absolute",
                right: 10,
                bottom: 10,
                width: 8,
                height: 8,
                borderRadius: 4,
                background: "hsl(167, 75%, 64%)",
              }}
            />
          </div>
          <span
            style={{
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: -1,
            }}
          >
            Axessio
          </span>
        </div>

        {/* Hero — titre + sous-titre */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24, zIndex: 1, maxWidth: 920 }}>
          <p
            style={{
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.85)",
              margin: 0,
            }}
          >
            Audits d'accessibilité numérique
          </p>
          <h1
            style={{
              fontSize: 72,
              fontWeight: 800,
              letterSpacing: -2,
              lineHeight: 1.05,
              margin: 0,
            }}
          >
            La plateforme pour piloter vos audits RGAA & WCAG.
          </h1>
        </div>

        {/* Footer — badges référentiels */}
        <div
          style={{
            display: "flex",
            gap: 12,
            zIndex: 1,
            flexWrap: "wrap",
          }}
        >
          {["RGAA 4.1.2", "WCAG 2.2", "RAWeb 1.0", "RAAM 1.0", "EN 301 549"].map(
            (badge) => (
              <span
                key={badge}
                style={{
                  border: "1px solid rgba(255,255,255,0.28)",
                  background: "rgba(255,255,255,0.10)",
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: 22,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.92)",
                }}
              >
                {badge}
              </span>
            ),
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
