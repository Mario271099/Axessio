import type { Metadata } from "next";
import { DM_Mono, DM_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

// Polices de marque — utilisées par le wordmark <Wordmark> et l'icône
// <AxIcon>. Le reste de l'UI reste sur ui-sans-serif via globals.css.
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
  title: {
    default: "Axessio",
    template: "%s · Axessio",
  },
  description:
    "Plateforme SaaS de gestion d'audits d'accessibilité numérique (RGAA, WCAG, RAWeb, RAAM).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${dmSans.variable} ${dmMono.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <a href="#main" className="skip-link">
            Aller au contenu principal
          </a>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
