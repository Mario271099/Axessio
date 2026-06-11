"use client";

// Filet de sécurité ultime de l'App Router : rendu quand le layout racine
// lui-même plante. Doit fournir ses propres <html>/<body>. On capture l'erreur
// dans Sentry (no-op sans DSN) et on propose un simple retry.

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
        }}
      >
        <main role="alert" style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.25rem" }}>
            Une erreur inattendue est survenue
          </h1>
          <p>Nos équipes ont été notifiées. Vous pouvez réessayer.</p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "0.5rem 1.25rem",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Réessayer
          </button>
        </main>
      </body>
    </html>
  );
}
