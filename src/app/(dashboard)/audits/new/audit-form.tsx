"use client";

import { useActionState, useState } from "react";
import { Loader2, ChevronRight, ChevronLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createAudit,
  type ActionState,
} from "@/app/(dashboard)/audits/actions";
import {
  PLATFORM_LABELS,
  REFERENCE_TYPE_LABELS,
  SERVICE_TYPE_LABELS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ReferenceType } from "@/types/domain";

interface ProjectOption {
  id: string;
  name: string;
  clientName: string;
}

interface ReferenceOption {
  id: string;
  type: ReferenceType;
  version: string;
}

interface AuditFormProps {
  projects: ProjectOption[];
  references: ReferenceOption[];
}

const initialState: ActionState = { error: null };

export function AuditForm({ projects, references }: AuditFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [state, formAction, pending] = useActionState(
    createAudit,
    initialState,
  );

  // Valeurs locales pour pouvoir naviguer entre étapes sans perdre le contenu
  const [projectId, setProjectId] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [platform, setPlatform] = useState("WEB");
  const [serviceType, setServiceType] = useState("AUDIT");
  const [language, setLanguage] = useState("fr");

  const canGoNext1 = projectId.length > 0;
  const canGoNext2 = referenceId.length > 0 && platform && serviceType;

  // Empêche toute soumission accidentelle (Entrée dans un input, etc.)
  // sauf si l'utilisateur clique vraiment sur "Créer l'audit"
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (step !== 3) {
      e.preventDefault();
      return;
    }
    // À l'étape 3, on laisse passer la soumission normale (formAction)
  }

  // Empêche la touche Entrée de soumettre le formulaire dans les inputs
  function handleKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
      e.preventDefault();
    }
  }

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="space-y-6"
    >
      {/* Champs cachés persistants */}
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="referenceId" value={referenceId} />
      <input type="hidden" name="platform" value={platform} />
      <input type="hidden" name="serviceType" value={serviceType} />
      <input type="hidden" name="language" value={language} />

      {/* Indicateur d'étape */}
      <ol
        className="flex items-center gap-3 text-sm"
        aria-label="Étapes du formulaire"
      >
        {[
          { id: 1, label: "Projet" },
          { id: 2, label: "Référentiel" },
          { id: 3, label: "Planning" },
        ].map((s, idx) => (
          <li key={s.id} className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium",
                step === s.id
                  ? "bg-primary text-primary-foreground"
                  : step > s.id
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground",
              )}
              aria-current={step === s.id ? "step" : undefined}
            >
              {s.id}
            </span>
            <span
              className={cn(
                "font-medium",
                step === s.id ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
            {idx < 2 && (
              <ChevronRight
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
            )}
          </li>
        ))}
      </ol>

      {state.error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      {/* === Étape 1 ============================================ */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Choisir un projet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucun projet disponible.
                </p>
                <Button asChild variant="link" className="mt-2">
                  <a href="/projects">Créer un projet d&apos;abord</a>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="project-select">Projet à auditer</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger id="project-select" aria-required="true">
                    <SelectValue placeholder="Sélectionner un projet…" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}{" "}
                        <span className="text-muted-foreground">
                          · {p.clientName}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* === Étape 2 ============================================ */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Référentiel et type de service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ref-select">
                Référentiel d&apos;accessibilité
              </Label>
              <Select value={referenceId} onValueChange={setReferenceId}>
                <SelectTrigger id="ref-select" aria-required="true">
                  <SelectValue placeholder="Choisir un référentiel…" />
                </SelectTrigger>
                <SelectContent>
                  {references.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {REFERENCE_TYPE_LABELS[r.type]} {r.version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="platform-select">Plateforme</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger id="platform-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEB">{PLATFORM_LABELS.WEB}</SelectItem>
                    <SelectItem value="MOBILE">
                      {PLATFORM_LABELS.MOBILE}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-select">Type de prestation</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger id="service-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUDIT">
                      {SERVICE_TYPE_LABELS.AUDIT}
                    </SelectItem>
                    <SelectItem value="NO_COUNTER_AUDIT">
                      {SERVICE_TYPE_LABELS.NO_COUNTER_AUDIT}
                    </SelectItem>
                    <SelectItem value="COMPLIANCE_AUDIT">
                      {SERVICE_TYPE_LABELS.COMPLIANCE_AUDIT}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language-select">Langue de l&apos;audit</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">Anglais</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* === Étape 3 ============================================ */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Planning et informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start-date">Démarrage prévu</Label>
                <Input
                  id="start-date"
                  name="expectedStartAt"
                  type="date"
                  aria-describedby="start-date-help"
                />
                <p
                  id="start-date-help"
                  className="text-xs text-muted-foreground"
                >
                  Optionnel
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">Fin prévue</Label>
                <Input id="end-date" name="expectedEndAt" type="date" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="a11y-link">
                Lien vers la page d&apos;accessibilité
              </Label>
              <Input
                id="a11y-link"
                name="accessibilityLink"
                type="url"
                placeholder="https://exemple.com/accessibilite"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes internes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Contexte, contraintes particulières…"
                rows={4}
              />
            </div>

            <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
              <strong className="text-foreground">À noter :</strong> les 5 pages
              obligatoires (Accueil, Contact, Mentions légales, Plan du site,
              Page d&apos;accessibilité) seront créées automatiquement. Tu
              pourras les supprimer ensuite si elles ne correspondent pas à ton
              site.
            </div>
          </CardContent>
        </Card>
      )}

      {/* === Boutons de navigation ============================ */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep((step - 1) as 1 | 2 | 3)}
          disabled={step === 1 || pending}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Précédent
        </Button>

        {step < 3 ? (
          <Button
            type="button"
            onClick={() => setStep((step + 1) as 1 | 2 | 3)}
            disabled={
              (step === 1 && !canGoNext1) ||
              (step === 2 && !canGoNext2) ||
              pending
            }
          >
            Suivant
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button type="submit" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Création en cours…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Créer l&apos;audit
              </>
            )}
          </Button>
        )}
      </div>
    </form>
  );
}
