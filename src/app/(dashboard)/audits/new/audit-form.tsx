"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
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
import { REFERENCE_TYPE_LABELS, REFERENCE_TYPE_SHORT } from "@/lib/constants";
import { cn, themeColorVar } from "@/lib/utils";
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

/**
 * Descriptions déjà traduites, par référentiel. Les référentiels sans texte
 * dédié (PDF/UA, EN 301 549) s'affichent sans description plutôt qu'avec un
 * texte inventé.
 */
const REFERENCE_HELP_KEYS: Partial<Record<ReferenceType, string>> = {
  RGAA: "rgaa",
  WCAG: "wcag",
  RAWeb: "raweb",
  RAAM: "raam",
};

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
  const [siteName, setSiteName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");

  // Dates pour validation cliente (l'envoi reste contrôlé par le name
  // attribute des inputs). La date du jour sert de borne inférieure au
  // démarrage prévu.
  const today = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
      .toISOString()
      .slice(0, 10);
  }, []);
  const [expectedStartAt, setExpectedStartAt] = useState("");
  const [expectedEndAt, setExpectedEndAt] = useState("");
  const [restitutionAt, setRestitutionAt] = useState("");
  const [counterAuditAt, setCounterAuditAt] = useState("");

  // Validation chronologique des dates (cohérence métier du planning).
  // Strict > pour que deux dates identiques ne passent pas non plus.
  const dateError = useMemo<string | null>(() => {
    if (expectedStartAt && expectedStartAt <= today) {
      return t("steps.planning.errors.startBeforeToday");
    }
    if (
      expectedStartAt &&
      expectedEndAt &&
      expectedEndAt <= expectedStartAt
    ) {
      return t("steps.planning.errors.endBeforeStart");
    }
    if (expectedEndAt && restitutionAt && restitutionAt <= expectedEndAt) {
      return t("steps.planning.errors.restitutionBeforeEnd");
    }
    if (restitutionAt && counterAuditAt && counterAuditAt <= restitutionAt) {
      return t("steps.planning.errors.counterBeforeRestitution");
    }
    return null;
  }, [
    t,
    today,
    expectedStartAt,
    expectedEndAt,
    restitutionAt,
    counterAuditAt,
  ]);

  const canGoNext1 = projectId.length > 0;
  const canGoNext2 =
    referenceId.length > 0 &&
    platform.length > 0 &&
    serviceType.length > 0 &&
    siteName.trim().length > 0 &&
    siteUrl.trim().length > 0;
  const canSubmit = canGoNext1 && canGoNext2 && dateError === null;

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projects, projectId],
  );
  const selectedReference = useMemo(
    () => references.find((r) => r.id === referenceId) ?? null,
    [references, referenceId],
  );

  // RAAM = référentiel d'apps mobiles. La plateforme est implicite et
  // verrouillée sur MOBILE - sélectionner WEB n'aurait pas de sens.
  // L'utilisateur saisira un bundle id à la place d'une URL.
  const isMobileReference = selectedReference?.type === "RAAM";
  useEffect(() => {
    if (isMobileReference && platform !== "MOBILE") {
      setPlatform("MOBILE");
    }
  }, [isMobileReference, platform]);

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
      <input type="hidden" name="siteName" value={siteName} />
      <input type="hidden" name="siteUrl" value={siteUrl} />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Stepper
            currentStep={step}
            onStepClick={setStep}
            canGoNext1={canGoNext1}
            canGoNext2={canGoNext2}
          />

          {state.error && (
            <p
              role="alert"
              className="flex w-full items-start gap-2.5 rounded-row bg-severity-critical-bg px-3.5 py-3 text-[0.95rem] leading-snug text-severity-critical"
            >
              <AlertCircle className="mt-0.5 size-[18px] shrink-0" aria-hidden="true" />
              <span>{state.error}</span>
            </p>
          )}

          {step === 1 && (
            <StepCard
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
              title={t("steps.reference.title")}
              description={t("steps.reference.description")}
            >
              {/* Choix du référentiel en cartes : le libellé, la version et
                  ce que le référentiel couvre, visibles d'un coup d'oeil. */}
              <div
                role="radiogroup"
                aria-labelledby="ref-group-label"
                aria-required="true"
                className="grid gap-3 md:grid-cols-2"
              >
                <span id="ref-group-label" className="sr-only">
                  {t("steps.reference.field")}
                </span>
                {references.map((r) => {
                  const selected = referenceId === r.id;
                  const helpKey = REFERENCE_HELP_KEYS[r.type];
                  return (
                    <label
                      key={r.id}
                      className={cn(
                        "relative flex cursor-pointer flex-col gap-2.5 rounded-card border-2 bg-card p-4",
                        "transition-[border-color,box-shadow,transform] duration-200",
                        "has-[input:focus-visible]:outline has-[input:focus-visible]:outline-[3px]",
                        "has-[input:focus-visible]:outline-offset-[3px] has-[input:focus-visible]:outline-primary",
                        selected
                          ? "border-primary shadow-[0_0_0_4px_hsl(var(--primary-muted))]"
                          : "border-border hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg",
                      )}
                    >
                      <input
                        type="radio"
                        name="reference-choice"
                        className="absolute size-px opacity-0"
                        checked={selected}
                        onChange={() => setReferenceId(r.id)}
                      />

                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute right-3.5 top-3.5 flex size-[26px] items-center justify-center rounded-full border-2 text-white",
                          "transition-[background-color,border-color,transform] duration-200",
                          selected
                            ? "scale-105 border-primary bg-primary"
                            : "border-border-strong",
                        )}
                      >
                        <Check className="size-3.5" strokeWidth={3} />
                      </span>

                      <span className="flex items-center gap-2.5 pr-8">
                        <span
                          aria-hidden="true"
                          className="flex size-[42px] shrink-0 items-center justify-center rounded-xl text-[0.95rem] font-black text-white"
                          style={{ background: themeColorVar(r.type) }}
                        >
                          {REFERENCE_TYPE_SHORT[r.type]}
                        </span>
                        <span className="flex min-w-0 flex-col leading-tight">
                          <span className="text-[1.05rem] font-extrabold">
                            {REFERENCE_TYPE_LABELS[r.type]}
                          </span>
                          <span className="text-[0.82rem] tabular text-muted-foreground">
                            {t("steps.reference.versionLabel", {
                              version: r.version,
                            })}
                          </span>
                        </span>
                      </span>

                      {helpKey && (
                        <span className="text-[0.88rem] leading-snug text-secondary-foreground">
                          {t(`steps.reference.help.${helpKey}`)}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platform-select">
                    {t("steps.reference.platform")} *
                  </Label>
                  <Select
                    value={platform}
                    onValueChange={(v) => setPlatform(v as PlatformType)}
                    disabled={isMobileReference}
                  >
                    <SelectTrigger
                      id="platform-select"
                      aria-describedby={
                        isMobileReference ? "platform-locked" : undefined
                      }
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEB">{tPlatform("WEB")}</SelectItem>
                      <SelectItem value="MOBILE">
                        {tPlatform("MOBILE")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {isMobileReference && (
                    <p
                      id="platform-locked"
                      className="text-xs text-muted-foreground"
                    >
                      {t("steps.reference.platformLockedRaam")}
                    </p>
                  )}
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

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="site-name">
                    {t("steps.reference.siteName")} *
                  </Label>
                  <Input
                    id="site-name"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    required
                    aria-required="true"
                    placeholder={
                      platform === "MOBILE"
                        ? t("steps.reference.siteNamePlaceholderMobile")
                        : t("steps.reference.siteNamePlaceholderWeb")
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("steps.reference.siteNameHint")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="site-url">
                    {platform === "MOBILE"
                      ? t("steps.reference.siteIdMobile")
                      : t("steps.reference.siteUrlWeb")}{" "}
                    *
                  </Label>
                  <Input
                    id="site-url"
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    required
                    aria-required="true"
                    type={platform === "MOBILE" ? "text" : "url"}
                    placeholder={
                      platform === "MOBILE"
                        ? "com.exemple.monapp"
                        : "https://exemple.com"
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {platform === "MOBILE"
                      ? t("steps.reference.siteIdMobileHint")
                      : t("steps.reference.siteUrlWebHint")}
                  </p>
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
                title={t("steps.planning.title")}
                description={t("steps.planning.description")}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">
                      {t("steps.planning.startDate")}
                    </Label>
                    <Input
                      id="start-date"
                      name="expectedStartAt"
                      type="date"
                      value={expectedStartAt}
                      onChange={(e) => setExpectedStartAt(e.target.value)}
                      min={today}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">
                      {t("steps.planning.endDate")}
                    </Label>
                    <Input
                      id="end-date"
                      name="expectedEndAt"
                      type="date"
                      value={expectedEndAt}
                      onChange={(e) => setExpectedEndAt(e.target.value)}
                      min={expectedStartAt || today}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="restitution-date">
                      {t("steps.planning.restitutionDate")}
                    </Label>
                    <Input
                      id="restitution-date"
                      name="restitutionAt"
                      type="date"
                      value={restitutionAt}
                      onChange={(e) => setRestitutionAt(e.target.value)}
                      min={expectedEndAt || expectedStartAt || today}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="counter-audit-date">
                      {t("steps.planning.counterAuditDate")}
                    </Label>
                    <Input
                      id="counter-audit-date"
                      name="counterAuditAt"
                      type="date"
                      value={counterAuditAt}
                      onChange={(e) => setCounterAuditAt(e.target.value)}
                      min={restitutionAt || expectedEndAt || expectedStartAt || today}
                    />
                  </div>
                </div>

                {dateError && (
                  <p
                    role="alert"
                    className="inline-flex w-full items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
                  >
                    <AlertCircle
                      className="mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{dateError}</span>
                  </p>
                )}

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
            </>
          )}
        </div>

        {/* Récapitulatif : visible à chaque étape, il se remplit au fur et à
            mesure. C'est aussi lui qui porte la navigation. */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          <Recap
            project={selectedProject}
            reference={selectedReference}
            platform={platform}
            serviceType={serviceType}
            language={language}
          />

          {/* Ce que la création va produire d'office (5 pages obligatoires
              + les éléments transversaux), et qu'on peut ensuite retirer. */}
          <div className="flex items-start gap-3 rounded-row bg-primary-softer p-3.5 text-[0.85rem] leading-snug">
            <Layers
              className="mt-0.5 size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span>
              <span className="block font-bold">
                {t("steps.planning.mandatoryPagesTitle")}
              </span>
              <span className="text-muted-foreground">
                {t("steps.planning.mandatoryPagesDesc")}
              </span>
            </span>
          </div>

          <p className="text-[0.8rem] tabular text-muted-foreground">
            {t("stepCount", { current: step, total: 3 })}
          </p>

          <div className="flex gap-2.5">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setStep((step - 1) as StepId)}
              disabled={step === 1 || pending}
            >
              <ChevronLeft aria-hidden="true" />
              {t("previous")}
            </Button>

            <Button
              type="button"
              className="flex-[1.4]"
              onClick={handlePrimaryAction}
              disabled={
                pending ||
                (step === 1 && !canGoNext1) ||
                (step === 2 && !canGoNext2) ||
                (step === 3 && !canSubmit)
              }
            >
              {step === 3 ? (
                pending ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" />
                    {t("creating")}
                  </>
                ) : (
                  <>
                    <Plus data-anim="spin" aria-hidden="true" />
                    {t("create")}
                  </>
                )
              ) : (
                <>
                  {t("next")}
                  <ChevronRight data-anim="go" aria-hidden="true" />
                </>
              )}
            </Button>
          </div>
        </aside>
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
    <ol
      aria-label={t("stepsAria")}
      className="grid gap-2.5 sm:grid-cols-3"
    >
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
                "flex w-full items-center gap-3 rounded-[0.875rem] border bg-card px-3.5 py-3 text-left",
                "transition-[background-color,border-color,box-shadow] duration-150",
                current
                  ? "border-primary shadow-[0_0_0_3px_hsl(var(--primary-muted))]"
                  : "border-border",
                !current && accessible && "hover:border-primary hover:bg-primary-softer",
                !accessible && "cursor-not-allowed opacity-60",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-black transition-colors",
                  completed
                    ? "bg-success text-success-foreground"
                    : current
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground",
                )}
              >
                {completed ? (
                  <Check className="size-4" strokeWidth={3} />
                ) : (
                  <Icon className="size-4" />
                )}
              </span>
              <span className="min-w-0 flex-1 leading-[1.25]">
                <span className="block text-[0.78rem] font-semibold text-muted-foreground">
                  {t("stepLabel")} {idx + 1}
                </span>
                <span className="block truncate text-[0.9rem] font-extrabold">
                  {t(`steps.${s.labelKey}.label`)}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function StepCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 px-6 py-5">
        <div>
          <h2 className="text-[1.2rem] font-extrabold tracking-[-0.02em]">
            {title}
          </h2>
          <p className="mt-1 text-[0.95rem] text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="flex flex-col gap-4">{children}</div>
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
      <CardContent className="flex flex-col gap-4 px-5 py-5">
        <h2 className="text-[1.05rem] font-extrabold">{t("title")}</h2>

        <dl className="flex flex-col gap-3">
          <RecapItem
            label={t("project")}
            value={project ? project.name : "—"}
            sub={project?.clientName}
          />
          <RecapItem
            label={t("reference")}
            value={
              reference
                ? `${REFERENCE_TYPE_LABELS[reference.type]} ${reference.version}`
                : "—"
            }
          />
          <RecapItem
            label={t("platform")}
            value={tPlatform(platform)}
          />
          <RecapItem
            label={t("serviceType")}
            value={tServiceType(serviceType)}
          />
          <RecapItem
            label={t("language")}
            value={language === "fr" ? "Français" : "English"}
          />
        </dl>
      </CardContent>
    </Card>
  );
}

function RecapItem({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.82rem] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-[0.95rem] font-bold">{value}</dd>
      {sub && (
        <dd className="truncate text-[0.82rem] text-muted-foreground">
          {sub}
        </dd>
      )}
    </div>
  );
}

function EmptyProjectsState() {
  const t = useTranslations("audits.new.steps.project");
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border-2 border-dashed border-input p-8 text-center">
      <div
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground"
      >
        <FolderKanban className="size-6" />
      </div>
      <div>
        <p className="text-[0.95rem] font-extrabold">{t("emptyTitle")}</p>
        <p className="mt-0.5 text-[0.85rem] text-muted-foreground">
          {t("emptyDesc")}
        </p>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link href="/clients">{t("emptyCta")}</Link>
      </Button>
    </div>
  );
}
