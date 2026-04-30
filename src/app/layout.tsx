import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

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
    <html lang="fr" suppressHydrationWarning>
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
