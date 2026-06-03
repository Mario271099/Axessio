"use client";

// Modale d'accueil première connexion. Affichée une seule fois par
// utilisateur — fermeture persistée via `profiles.welcome_dismissed_at`
// (mig. 76). Au refresh suivant la prop `defaultOpen` redevient false
// côté serveur et la modale ne se ré-affiche pas.

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  FolderKanban,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { dismissWelcome } from "./welcome-actions";

interface WelcomeModalProps {
  firstName: string;
  defaultOpen: boolean;
  /** Type d'org choisie à la création — adapte les étapes affichées. */
  orgType: "individual" | "agency" | "company" | "enterprise";
}

export function WelcomeModal({
  firstName,
  defaultOpen,
  orgType,
}: WelcomeModalProps) {
  const t = useTranslations("dashboard.welcome");
  const [open, setOpen] = useState(defaultOpen);
  const [pending, startTransition] = useTransition();
  const CTA_ID = "welcome-modal-cta";

  function close() {
    setOpen(false);
    startTransition(async () => {
      await dismissWelcome();
    });
  }

  // Premier intitulé adapté au persona — un freelance pense d'abord
  // « ajouter mon premier client », une entreprise « inviter mon équipe ».
  const steps =
    orgType === "company" || orgType === "enterprise"
      ? [
          { icon: Building2, key: "members" as const },
          { icon: FolderKanban, key: "project" as const },
          { icon: ClipboardList, key: "audit" as const },
        ]
      : [
          { icon: Building2, key: "client" as const },
          { icon: FolderKanban, key: "project" as const },
          { icon: ClipboardList, key: "audit" as const },
        ];

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) close();
      }}
    >
      <DialogContent
        className="sm:max-w-lg"
        onOpenAutoFocus={(e) => {
          // Focus le CTA principal plutôt que le bouton de fermeture X —
          // l'utilisateur clavier peut appuyer Enter immédiatement pour
          // commencer. Le Button (style React 19) n'accepte pas de ref via
          // ses props, on passe par un id.
          e.preventDefault();
          (
            document.getElementById(CTA_ID) as HTMLButtonElement | null
          )?.focus();
        }}
      >
        <DialogHeader className="space-y-3">
          <div
            aria-hidden="true"
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
          >
            <Sparkles className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-2xl">
            {t("title", { name: firstName || t("titleFallback") })}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {t("subtitle")}
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-3">
          {steps.map((s, idx) => (
            <li
              key={s.key}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
            >
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
              >
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <s.icon
                    className="h-3.5 w-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                  {t(`steps.${s.key}.title`)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(`steps.${s.key}.description`)}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="flex flex-col items-center gap-2 pt-2">
          <Button
            id={CTA_ID}
            type="button"
            size="lg"
            className="w-full gap-2"
            onClick={close}
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            )}
            {t("cta")}
          </Button>
          <p className="text-xs text-muted-foreground">{t("hint")}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
