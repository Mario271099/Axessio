import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { SECURITY_HEADERS } from "./src/lib/security-headers";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  // Empêche le bundler de Next d'embarquer puppeteer-core et le binaire Chromium :
  // ces deux packages doivent rester en `require()` natif côté serveur Node.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],

  async headers() {
    return [
      {
        // Catch-all explicite. `/(.*)`  est universel ; certaines versions de
        // path-to-regexp utilisées par Next n'attachent pas `/:path*` à la
        // racine `/`, ce qui laissait la home sans headers.
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      {
        // Filet de sécurité explicite sur la racine.
        source: "/",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
