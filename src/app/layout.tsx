import type { Metadata, Viewport } from "next";
import { DM_Mono, DM_Sans, Geist } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { CookieConsentBanner } from "@/components/public/cookie-consent-banner";
import { SITE, siteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-dm-sans",
  display: "swap",
});
const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} - ${SITE.tagline.fr}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description.fr,
  applicationName: SITE.name,
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  category: "business",
  keywords: [...SITE.keywords],
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // Indexation par défaut - chaque layout privé écrase ce bloc avec
  // `robots: { index: false }`. Tous les bots utiles (Google, Bing, Applebot…)
  // suivent les directives `googleBot` ci-dessous.
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} - ${SITE.tagline.fr}`,
    description: SITE.description.fr,
    url: SITE.url,
    locale: SITE.locale.fr,
    alternateLocale: [SITE.locale.en],
  },
  twitter: {
    card: "summary_large_image",
    site: SITE.twitter,
    creator: SITE.twitter,
    title: `${SITE.name} - ${SITE.tagline.fr}`,
    description: SITE.description.fr,
  },
  manifest: "/manifest.webmanifest",
  other: {
    // Référence canonique vers la home en plus de l'alternate déjà déclaré.
    // Évite la dilution PageRank si le site sert sous plusieurs hôtes.
    "format-detection": "telephone=no",
  },
  verification: {
    // Pré-câblage : ajouter les tokens via env si Search Console / Bing est utilisé.
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : undefined,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: SITE.backgroundColor },
    { media: "(prefers-color-scheme: dark)", color: "#0a1628" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  // JSON-LD au niveau racine - visible sur toutes les pages publiques.
  // Les pages privées (dashboard) ne sont de toute façon pas indexées.
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    logo: siteUrl("/icon.svg"),
    description: SITE.description.fr,
    email: SITE.supportEmail,
    contactPoint: {
      "@type": "ContactPoint",
      email: SITE.supportEmail,
      contactType: "customer support",
      availableLanguage: ["French", "English"],
    },
    sameAs: [],
  };

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${dmSans.variable} ${dmMono.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <a href="#main" className="skip-link">
              {locale === "fr"
                ? "Aller au contenu principal"
                : "Skip to main content"}
            </a>
            {children}
            {/* Toasts globaux - accessibles (role="status" injecté par sonner),
                ne déclenchent pas de re-render des Server Components. */}
            <Toaster
              position="bottom-right"
              richColors
              closeButton
              theme="system"
            />
            {/* Banniere de consentement RGPD - le composant decide lui-meme
                de s'afficher (pages publiques uniquement, premier passage). */}
            <CookieConsentBanner />
          </ThemeProvider>
        </NextIntlClientProvider>
        {/* Données structurées Organization (Schema.org) - apparaissent
            sur toutes les pages publiques. Rendu en JSON brut, non bloquant. */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
      </body>
    </html>
  );
}
