"use client";

// Bannière de succès affichée après un reset de mot de passe réussi
// (`/reset-password` redirige vers `/login?reset=1`). Bouton de fermeture
// pour qu'elle disparaisse sans recharger la page.

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";

export function LoginResetBanner() {
  const t = useTranslations("auth.login");
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-3 rounded-md border border-success/40 bg-success/10 p-3 text-sm text-success"
    >
      <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p className="flex-1">{t("resetSuccess")}</p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="rounded p-1 hover:bg-success/10"
        aria-label={t("dismissBanner")}
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
