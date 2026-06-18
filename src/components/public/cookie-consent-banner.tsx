"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

// Selecteur du bouton "Accepter" (focus a l'ouverture). Pose en data-attr
// car le composant Button ne type pas `ref`.
const ACCEPT_SELECTOR = "[data-cookie-accept]";

const CONSENT_KEY = "axessyo_cookie_consent";
type Consent = "accepted" | "refused";

// Prefixes des routes publiques (non authentifiees). La banniere ne s'affiche
// que la-dessus : les pages applicatives (dashboard, onboarding, organisations)
// sont derriere l'auth et ne servent pas de contenu marketing.
const PUBLIC_PREFIXES = [
  "/pricing",
  "/legal",
  "/privacy",
  "/cookies",
  "/accessibility",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function CookieConsentBanner() {
  const t = useTranslations("cookieBanner");
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Au montage : on n'affiche la banniere que si aucun choix n'est encore
  // stocke. Lecture en effet (et non au render) pour eviter tout mismatch
  // d'hydratation entre serveur et client.
  useEffect(() => {
    if (!isPublicPath(pathname)) {
      setVisible(false);
      return;
    }
    try {
      const stored = window.localStorage.getItem(CONSENT_KEY);
      setVisible(stored !== "accepted" && stored !== "refused");
    } catch {
      // localStorage indisponible (mode prive strict) : on affiche la banniere.
      setVisible(true);
    }
  }, [pathname]);

  // Focus le bouton "Accepter" a l'ouverture pour amener le lecteur d'ecran
  // sur le dialogue des qu'il apparait.
  useEffect(() => {
    if (visible) {
      containerRef.current
        ?.querySelector<HTMLButtonElement>(ACCEPT_SELECTOR)
        ?.focus();
    }
  }, [visible]);

  function decide(consent: Consent) {
    try {
      window.localStorage.setItem(CONSENT_KEY, consent);
    } catch {
      // ignore : on ferme quand meme la banniere pour ne pas bloquer l'UI.
    }
    // TODO(consent): brancher l'init Sentry (instrumentation-client.ts) sur ce
    // choix - ne charger le SDK que si `consent === "accepted"`. Pour l'instant
    // Sentry reste pilote par NEXT_PUBLIC_SENTRY_DSN cote build.
    setVisible(false);
  }

  // Focus trap simple : on garde le Tab a l'interieur de la banniere tant
  // qu'elle est ouverte (deux boutons + un lien).
  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const focusables = containerRef.current?.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled])",
    );
    if (!focusables || focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="false"
      aria-label={t("label")}
      onKeyDown={handleKeyDown}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 p-4 shadow-lg backdrop-blur"
    >
      <div className="container mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {t("message")}{" "}
          <Link
            href="/cookies"
            className="font-medium text-primary underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded"
          >
            {t("learnMore")}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => decide("refused")}
          >
            {t("refuse")}
          </Button>
          <Button
            type="button"
            size="sm"
            data-cookie-accept=""
            onClick={() => decide("accepted")}
          >
            {t("accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
