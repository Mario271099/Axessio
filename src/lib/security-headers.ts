// Headers de sécurité HTTP - appliqués globalement via `next.config.ts`.
//
// Le compromis principal : Next 16 et React 19 produisent des `<script>` et
// `<style>` inline (RSC payload, hydratation, react/no-danger pour les
// JSON-LD). On garde donc `'unsafe-inline'` sur `script-src`/`style-src`,
// ce qui dégrade légèrement la CSP mais reste meilleur que pas de CSP du tout.
// Pour atteindre une CSP "strict-dynamic", il faudrait générer un nonce par
// requête via le middleware - c'est un chantier indépendant.

const isDev = process.env.NODE_ENV !== "production";

// Origine Supabase autorisée pour les appels REST + WebSocket Realtime + Storage.
// On dérive depuis l'URL publique pour ne pas oublier un wildcard.
function supabaseOrigin(): { https: string; wss: string } {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://*.supabase.co";
  try {
    const url = new URL(raw);
    return {
      https: `${url.protocol}//${url.host}`,
      wss: `wss://${url.host}`,
    };
  } catch {
    return { https: "https://*.supabase.co", wss: "wss://*.supabase.co" };
  }
}

function buildCSP(): string {
  const sb = supabaseOrigin();

  // `'unsafe-eval'` n'est nécessaire qu'en dev (HMR, source maps).
  // En prod on le retire pour bloquer l'évaluation dynamique de code.
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    ...(isDev ? ["'unsafe-eval'"] : []),
  ].join(" ");

  const directives: Record<string, string> = {
    "default-src": "'self'",
    "script-src": scriptSrc,
    "style-src": "'self' 'unsafe-inline'",
    "img-src": `'self' data: blob: ${sb.https}`,
    "font-src": "'self' data:",
    "connect-src": `'self' ${sb.https} ${sb.wss}`,
    "frame-src": "'none'",
    "frame-ancestors": "'none'",
    "form-action": "'self'",
    "base-uri": "'self'",
    "object-src": "'none'",
    "media-src": "'self'",
    "worker-src": "'self' blob:",
    "manifest-src": "'self'",
    // Force HTTPS pour toutes les sous-ressources en prod.
    ...(isDev ? {} : { "upgrade-insecure-requests": "" }),
  };

  return Object.entries(directives)
    .map(([k, v]) => (v ? `${k} ${v}` : k))
    .join("; ");
}

export const SECURITY_HEADERS = [
  // Bloque le rendu en iframe (anti-clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Empêche le sniffing MIME (force le Content-Type déclaré par le serveur).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Limite l'info partagée en cross-origin via le Referer.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Désactive l'accès aux capteurs/API browser non utilisés.
  {
    key: "Permissions-Policy",
    value: [
      "accelerometer=()",
      "autoplay=()",
      "camera=()",
      "display-capture=()",
      "encrypted-media=()",
      "fullscreen=(self)",
      "geolocation=()",
      "gyroscope=()",
      "magnetometer=()",
      "microphone=()",
      "midi=()",
      "payment=()",
      "picture-in-picture=()",
      "publickey-credentials-get=()",
      "screen-wake-lock=()",
      "sync-xhr=()",
      "usb=()",
      "xr-spatial-tracking=()",
    ].join(", "),
  },
  // Cross-Origin isolation : préserve l'isolation du contexte.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  // HSTS - seulement en prod, sinon on bloque localhost. 1 an + subdomains + preload.
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains; preload",
        },
      ]),
  // CSP - voir buildCSP() pour les compromis.
  { key: "Content-Security-Policy", value: buildCSP() },
  // X-DNS-Prefetch-Control off pour éviter les fuites DNS sur la nav privée.
  { key: "X-DNS-Prefetch-Control", value: "off" },
];
