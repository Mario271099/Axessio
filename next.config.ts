import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

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
};

export default withNextIntl(nextConfig);
