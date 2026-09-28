"use client";

// Modale d'accueil première connexion. Affichée une seule fois par
// utilisateur - fermeture persistée via `profiles.welcome_dismissed_at`
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
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogFooterHint,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { dismissWelcome } from "./welcome-actions";

interface WelcomeModalProps {
  firstName: string;
  defaultOpen: boolean;
  /** Type d'org choisie à la création - adapte les étapes affichées. */
  orgType: "individual" | "agency" | "company" | "enterprise";
}

export function WelcomeModal({
  firstName,
  defaultOpen,
  orgType,
}: WelcomeModalProps) {
  const t = useTranslations("dashboard.welcome");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(defaultOpen);
  const [pending, startTransition] = useTransition();
  const CTA_ID = "welcome-modal-cta";

  function close() {
    setOpen(false);
    startTransition(async () => {
      await dismissWelcome();
    });
  }

  // Premier intitulé adapté au persona - un freelance pense d'abord
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
        size="xl"
        closeLabel={tCommon("close")}
        closeClassName="text-primary-foreground hover:bg-white/15 hover:text-primary-foreground"
        onOpenAutoFocus={(e) => {
          // Focus le CTA principal plutôt que le bouton de fermeture X -
          // l'utilisateur clavier peut appuyer Enter immédiatement pour
          // commencer. Le Button (style React 19) n'accepte pas de ref via
          // ses props, on passe par un id.
          e.preventDefault();
          (
            document.getElementById(CTA_ID) as HTMLButtonElement | null
          )?.focus();
        }}
      >
        {/* Banniere cobalt de la maquette : la seule fenetre a en porter une. */}
        <div className="relative shrink-0 overflow-hidden bg-cobalt px-[30px] pb-7 pt-10 text-cobalt-foreground">
          <svg
            aria-hidden="true"
            viewBox="0 0 420 420"
            className="pointer-events-none absolute -top-32 right-[-40px] size-[420px] opacity-[0.16]"
          >
            <g fill="currentColor">
              <rect x="0" y="0" width="190" height="190" rx="46" />
              <circle cx="315" cy="95" r="95" />
              <rect x="0" y="230" width="190" height="190" rx="46" />
              <rect
                x="230"
                y="230"
                width="190"
                height="190"
                rx="46"
                opacity="0.5"
              />
            </g>
          </svg>

          <div className="relative">
            <Sparkles className="mb-3 size-7" aria-hidden="true" />
            <DialogTitle className="text-[2rem] font-black leading-[1.05] tracking-[-0.035em]">
              {t("title", { name: firstName || t("titleFallback") })}
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-[1.05rem] text-cobalt-foreground/85">
              {t("subtitle")}
            </DialogDescription>
          </div>
        </div>

        <DialogBody className="pt-5">
          <ol className="flex flex-col gap-2.5">
            {steps.map((s, idx) => (
              <li
                key={s.key}
                className="flex items-center gap-3.5 rounded-card border border-border p-3.5"
              >
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-base font-black text-primary-foreground"
                >
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-base font-extrabold">
                    <s.icon
                      className="size-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    {t(`steps.${s.key}.title`)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t(`steps.${s.key}.description`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </DialogBody>

        <DialogFooter>
          <DialogFooterHint>{t("hint")}</DialogFooterHint>
          <Button
            id={CTA_ID}
            type="button"
            onClick={close}
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <ArrowRight data-anim="go" aria-hidden="true" />
            )}
            {t("cta")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
