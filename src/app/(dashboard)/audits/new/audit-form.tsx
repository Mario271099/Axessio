"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
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
import { REFERENCE_TYPE_LABELS } from "@/lib/constants";
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

const STEP_ICONS = {
  1: FolderKanban,
  2: Library,
  3: CalendarDays,
} as const;

export function AuditForm({ projects, references }: AuditFormProps) {
  const t = useTranslations("audits.new");
  const tPlatform = useTranslations("constants.platform");
  const tServiceType = useTranslations("constants.serviceType");

  const [step, setStep] = useState<StepId>(1);
  const [state, formAction, pending] = useActionState(
    createAudit,
    initialState,
  );

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
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="referenceId" value={referenceId} />
      <input type="hidden" name="platform" value={platform} />
      <input type="hidden" name="serviceType" value={serviceType} />
      <input type="hidden" name="language" value={language} />

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Stepper
          currentStep={step}
          onStepClick={setStep}
          canGoNext1={canGoNext1}
          canGoNext2={canGoNext2}
        />

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
              title={t("steps.project.title")}
              description={t("steps.project.description")}
            >
              {projects.length === 0 ? (
                <EmptyProjectsState />
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="project-select">
                    {t("steps.project.field")} *
                  </Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger id="project-select" aria-required="true">
                      <SelectValue
                        placeholder={t("steps.project.placeholder")}
                      />
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
                      {t("steps.project.clientLabel")}{" "}
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
              title={t("steps.reference.title")}
              description={t("steps.reference.description")}
            >
              <div className="space-y-2">
                <Label htmlFor="ref-select">
                  {t("steps.reference.field")} *
                </Label>
                <Select value={referenceId} onValueChange={setReferenceId}>
                  <SelectTrigger id="ref-select" aria-required="true">
                    <SelectValue
                      placeholder={t("steps.reference.placeholder")}
                    />
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
                  <Label htmlFor="platform-select">
                    {t("steps.reference.platform")} *
                  </Label>
                  <Select
                    value={platform}
                    onValueChange={(v) => setPlatform(v as PlatformType)}
                  >
                    <SelectTrigger id="platform-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEB">{tPlatform("WEB")}</SelectItem>
                      <SelectItem value="MOBILE">
                        {tPlatform("MOBILE")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service-select">
                    {t("steps.reference.serviceType")} *
                  </Label>
                  <Select
                    value={serviceType}
                    onValueChange={(v) => setServiceType(v as ServiceType)}
                  >
                    <SelectTrigger id="service-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AUDIT">
                        {tServiceType("AUDIT")}
                      </SelectItem>
                      <SelectItem value="NO_COUNTER_AUDIT">
                        {tServiceType("NO_COUNTER_AUDIT")}
                      </SelectItem>
                      <SelectItem value="COMPLIANCE_AUDIT">
                        {tServiceType("COMPLIANCE_AUDIT")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language-select">
                  {t("steps.reference.language")}
                </Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
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
                title={t("steps.planning.title")}
                description={t("steps.planning.description")}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">
                      {t("steps.planning.startDate")}
                    </Label>
                    <Input id="start-date" name="expectedStartAt" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">
                      {t("steps.planning.endDate")}
                    </Label>
                    <Input id="end-date" name="expectedEndAt" type="date" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="a11y-link">
                    {t("steps.planning.a11yLink")}
                  </Label>
                  <Input
                    id="a11y-link"
                    name="accessibilityLink"
                    type="url"
                    placeholder={t("steps.planning.a11yLinkPlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">{t("steps.planning.notes")}</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder={t("steps.planning.notesPlaceholder")}
                    rows={4}
                  />
                </div>
              </StepCard>

              <Recap
                project={selectedProject}
                reference={selectedReference}
                platform={platform}
                serviceType={serviceType}
                language={language}
              />

              <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
                <Layers
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-medium">
                    {t("steps.planning.mandatoryPagesTitle")}
                  </p>
                  <p className="mt-0.5 text-muted-foreground">
                    {t("steps.planning.mandatoryPagesDesc")}
                  </p>
                </div>
              </div>
            </>
          )}

          <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/75 md:-mx-6 md:px-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((step - 1) as StepId)}
              disabled={step === 1 || pending}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              {t("previous")}
            </Button>

            <span className="text-xs text-muted-foreground tabular-nums">
              {t("stepCount", { current: step, total: 3 })}
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
                    {t("creating")}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    {t("create")}
                  </>
                )
              ) : (
                <>
                  {t("next")}
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
  const t = useTranslations("audits.new");
  const stepDefs: { id: StepId; labelKey: "project" | "reference" | "planning" }[] = [
    { id: 1, labelKey: "project" },
    { id: 2, labelKey: "reference" },
    { id: 3, labelKey: "planning" },
  ];

  const canAccess = (id: StepId): boolean => {
    if (id <= currentStep) return true;
    if (id === 2) return canGoNext1;
    if (id === 3) return canGoNext1 && canGoNext2;
    return false;
  };

  return (
    <aside
      aria-label={t("stepsAria")}
      className="lg:sticky lg:top-20 lg:self-start"
    >
      <Card className="p-2">
        <ol className="space-y-1">
          {stepDefs.map((s, idx) => {
            const completed = currentStep > s.id;
            const current = currentStep === s.id;
            const accessible = canAccess(s.id);

            const Icon = STEP_ICONS[s.id];

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
                      {t("stepLabel")} {idx + 1}
                    </span>
                    <span className="block truncate text-sm font-medium text-foreground">
                      {t(`steps.${s.labelKey}.label`)}
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
  const t = useTranslations("audits.new.recap");
  const tPlatform = useTranslations("constants.platform");
  const tServiceType = useTranslations("constants.serviceType");
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("title")}
          </h3>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          <RecapItem
            icon={Briefcase}
            label={t("project")}
            value={project ? project.name : "—"}
            sub={project?.clientName}
          />
          <RecapItem
            icon={Library}
            label={t("reference")}
            value={
              reference
                ? `${REFERENCE_TYPE_LABELS[reference.type]} ${reference.version}`
                : "—"
            }
          />
          <RecapItem
            icon={Layers}
            label={t("platform")}
            value={tPlatform(platform)}
          />
          <RecapItem
            icon={Briefcase}
            label={t("serviceType")}
            value={tServiceType(serviceType)}
          />
          <RecapItem
            icon={Languages}
            label={t("language")}
            value={language === "fr" ? "Français" : "English"}
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

function EmptyProjectsState() {
  const t = useTranslations("audits.new.steps.project");
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
      <div
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
      >
        <FolderKanban className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{t("emptyTitle")}</p>
        <p className="text-xs text-muted-foreground">{t("emptyDesc")}</p>
      </div>
      <Button asChild variant="outline" size="sm">
        <a href="/clients">{t("emptyCta")}</a>
      </Button>
    </div>
  );
}
