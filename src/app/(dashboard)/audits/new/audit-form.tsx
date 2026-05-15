"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Briefcase,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Languages,
  Layers,
  Library,
  Loader2,
  Plus,
} from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
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
import type { PlatformType, ReferenceType, ServiceType } from "@/types/domain";

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

type StepId = 1 | 2 | 3;

const STEPS = [
  {
    id: 1 as const,
    icon: FolderKanban,
    label: "Projet",
    description: "Sélectionnez le projet à auditer",
  },
  {
    id: 2 as const,
    icon: Library,
    label: "Référentiel",
    description: "Choisissez le cadre de référence",
  },
  {
    id: 3 as const,
    icon: CalendarDays,
    label: "Planning",
    description: "Dates et informations complémentaires",
  },
];

export function AuditForm({ projects, references }: AuditFormProps) {
  const [step, setStep] = useState<StepId>(1);
  const [state, formAction, pending] = useActionState(
    createAudit,
    initialState,
  );

  // Valeurs locales — préservées entre étapes
  const [projectId, setProjectId] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [platform, setPlatform] = useState<PlatformType>("WEB");
  const [serviceType, setServiceType] = useState<ServiceType>("AUDIT");
  const [language, setLanguage] = useState("fr");

  const canGoNext1 = projectId.length > 0;
  const canGoNext2 =
    referenceId.length > 0 && platform.length > 0 && serviceType.length > 0;

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projects, projectId],
  );
  const selectedReference = useMemo(
    () => references.find((r) => r.id === referenceId) ?? null,
    [references, referenceId],
  );

  const formRef = useRef<HTMLFormElement | null>(null);

  // Avance d'étape (1→2, 2→3) ou déclenche la soumission à l'étape 3.
  // On garde toujours type="button" sur le bouton principal pour éviter
  // qu'une transition type="button" → type="submit" en place dans le DOM
  // ne déclenche un submit involontaire lors du clic « Suivant ».
  function handlePrimaryAction() {
    if (pending) return;
    if (step === 3) {
      formRef.current?.requestSubmit();
      return;
    }
    if (step === 1 && !canGoNext1) return;
    if (step === 2 && !canGoNext2) return;
    setStep((step + 1) as StepId);
  }

  // Bloque la touche Entrée pour éviter toute soumission accidentelle.
  // Le textarea (notes, étape 3) accepte les sauts de ligne.
  function handleKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
      e.preventDefault();
    }
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onKeyDown={handleKeyDown}
      className="space-y-6"
    >
      {/* Champs cachés persistants ------------------------------------- */}
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="referenceId" value={referenceId} />
      <input type="hidden" name="platform" value={platform} />
      <input type="hidden" name="serviceType" value={serviceType} />
      <input type="hidden" name="language" value={language} />

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Stepper ----------------------------------------------------- */}
        <Stepper currentStep={step} onStepClick={setStep} canGoNext1={canGoNext1} canGoNext2={canGoNext2} />

        {/* Contenu de l'étape courante ---------------------------------- */}
        <div className="space-y-6">
          {state.error && (
            <p
              role="alert"
              className="inline-flex w-full items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <span>{state.error}</span>
            </p>
          )}

          {step === 1 && (
            <StepCard
              icon={FolderKanban}
              tone="primary"
              title="Choisir un projet"
              description="Le projet doit déjà exister. Si ce n'est pas le cas, créez-le d'abord depuis la fiche client."
            >
              {projects.length === 0 ? (
                <EmptyProjectsState />
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="project-select">Projet à auditer *</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger id="project-select" aria-required="true">
                      <SelectValue placeholder="Sélectionner un projet…" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="font-medium">{p.name}</span>
                          <span className="text-muted-foreground">
                            {" "}
                            · {p.clientName}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedProject && (
                    <p className="text-xs text-muted-foreground">
                      Client :{" "}
                      <span className="text-foreground">
                        {selectedProject.clientName}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </StepCard>
          )}

          {step === 2 && (
            <StepCard
              icon={Library}
              tone="violet"
              title="Référentiel et type de service"
              description="Le référentiel détermine la liste des critères à évaluer."
            >
              <div className="space-y-2">
                <Label htmlFor="ref-select">
                  Référentiel d&apos;accessibilité *
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
                  <Label htmlFor="platform-select">Plateforme *</Label>
                  <Select
                    value={platform}
                    onValueChange={(v) => setPlatform(v as PlatformType)}
                  >
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
                  <Label htmlFor="service-select">Type de prestation *</Label>
                  <Select
                    value={serviceType}
                    onValueChange={(v) => setServiceType(v as ServiceType)}
                  >
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
            </StepCard>
          )}

          {step === 3 && (
            <>
              <StepCard
                icon={CalendarDays}
                tone="warning"
                title="Planning et informations"
                description="Toutes les informations de cette étape sont optionnelles."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Démarrage prévu</Label>
                    <Input id="start-date" name="expectedStartAt" type="date" />
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
              </StepCard>

              {/* Recap des choix précédents */}
              <Recap
                project={selectedProject}
                reference={selectedReference}
                platform={platform}
                serviceType={serviceType}
                language={language}
              />

              {/* Note pages obligatoires */}
              <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
                <Layers
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-medium">Pages obligatoires</p>
                  <p className="mt-0.5 text-muted-foreground">
                    Les 5 pages obligatoires (Accueil, Contact, Mentions
                    légales, Plan du site, Page d&apos;accessibilité) seront
                    créées automatiquement. Vous pourrez les supprimer ensuite
                    si elles ne correspondent pas à votre site.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Boutons de navigation -------------------------------------- */}
          <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/75 md:-mx-6 md:px-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((step - 1) as StepId)}
              disabled={step === 1 || pending}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Précédent
            </Button>

            <span className="text-xs text-muted-foreground tabular-nums">
              Étape {step} sur 3
            </span>

            <Button
              type="button"
              onClick={handlePrimaryAction}
              disabled={
                pending ||
                (step === 1 && !canGoNext1) ||
                (step === 2 && !canGoNext2)
              }
            >
              {step === 3 ? (
                pending ? (
                  <>
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Création en cours…
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Créer l&apos;audit
                  </>
                )
              ) : (
                <>
                  Suivant
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Stepper                                                                     */
/* -------------------------------------------------------------------------- */

function Stepper({
  currentStep,
  onStepClick,
  canGoNext1,
  canGoNext2,
}: {
  currentStep: StepId;
  onStepClick: (s: StepId) => void;
  canGoNext1: boolean;
  canGoNext2: boolean;
}) {
  // On autorise un retour libre vers une étape déjà ouverte, mais on ne
  // permet pas de sauter une étape non validée vers l'avant.
  const canAccess = (id: StepId): boolean => {
    if (id <= currentStep) return true;
    if (id === 2) return canGoNext1;
    if (id === 3) return canGoNext1 && canGoNext2;
    return false;
  };

  return (
    <aside aria-label="Étapes du formulaire" className="lg:sticky lg:top-20 lg:self-start">
      <Card className="p-2">
        <ol className="space-y-1">
          {STEPS.map((s, idx) => {
            const completed = currentStep > s.id;
            const current = currentStep === s.id;
            const accessible = canAccess(s.id);

            const Icon = s.icon;

            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => accessible && onStepClick(s.id)}
                  disabled={!accessible}
                  aria-current={current ? "step" : undefined}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-md p-3 text-left transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    current && "bg-primary/10",
                    !current && accessible && "hover:bg-accent",
                    !accessible && "cursor-not-allowed opacity-60",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                      completed
                        ? "bg-success text-success-foreground"
                        : current
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {completed ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Étape {idx + 1}
                    </span>
                    <span
                      className={cn(
                        "block truncate text-sm font-medium",
                        current ? "text-foreground" : "text-foreground",
                      )}
                    >
                      {s.label}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </Card>
    </aside>
  );
}

/* -------------------------------------------------------------------------- */
/* StepCard                                                                    */
/* -------------------------------------------------------------------------- */

const stepToneClasses = {
  primary: "bg-primary/10 text-primary",
  violet: "bg-violet-500/10 text-violet-500",
  warning: "bg-warning/10 text-warning",
} as const;

function StepCard({
  icon: Icon,
  tone,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  tone: keyof typeof stepToneClasses;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="flex items-start gap-3">
          <div
            aria-hidden="true"
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              stepToneClasses[tone],
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="space-y-4">{children}</div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Recap                                                                       */
/* -------------------------------------------------------------------------- */

function Recap({
  project,
  reference,
  platform,
  serviceType,
  language,
}: {
  project: ProjectOption | null;
  reference: ReferenceOption | null;
  platform: PlatformType;
  serviceType: ServiceType;
  language: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <CheckCircle2
            className="h-4 w-4 text-success"
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Récapitulatif
          </h3>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          <RecapItem
            icon={Briefcase}
            label="Projet"
            value={project ? project.name : "—"}
            sub={project?.clientName}
          />
          <RecapItem
            icon={Library}
            label="Référentiel"
            value={
              reference
                ? `${REFERENCE_TYPE_LABELS[reference.type]} ${reference.version}`
                : "—"
            }
          />
          <RecapItem
            icon={Layers}
            label="Plateforme"
            value={PLATFORM_LABELS[platform]}
          />
          <RecapItem
            icon={Briefcase}
            label="Type de prestation"
            value={SERVICE_TYPE_LABELS[serviceType]}
          />
          <RecapItem
            icon={Languages}
            label="Langue"
            value={language === "fr" ? "Français" : "Anglais"}
          />
        </dl>
      </CardContent>
    </Card>
  );
}

function RecapItem({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="truncate text-sm font-medium">{value}</dd>
        {sub && (
          <p className="truncate text-xs text-muted-foreground">{sub}</p>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                 */
/* -------------------------------------------------------------------------- */

function EmptyProjectsState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
      <div
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
      >
        <FolderKanban className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">Aucun projet disponible</p>
        <p className="text-xs text-muted-foreground">
          Créez un projet depuis la fiche client avant de lancer un audit.
        </p>
      </div>
      <Button asChild variant="outline" size="sm">
        <a href="/clients">Voir mes clients</a>
      </Button>
    </div>
  );
}
