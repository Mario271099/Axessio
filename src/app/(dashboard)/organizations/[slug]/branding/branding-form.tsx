"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { OrgBranding } from "@/types/domain";
import { resetBranding, saveBranding } from "./actions";

interface Props {
  organizationId: string;
  initial: OrgBranding;
}

export function BrandingForm({ organizationId, initial }: Props) {
  const t = useTranslations("organizations.branding");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl ?? "");
  const [primaryColor, setPrimaryColor] = useState(
    initial.primaryColor ?? "#0f172a",
  );
  const [accentColor, setAccentColor] = useState(
    initial.accentColor ?? "#3b82f6",
  );
  const [supportEmail, setSupportEmail] = useState(initial.supportEmail ?? "");
  const [customDomain, setCustomDomain] = useState(initial.customDomain ?? "");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveBranding(organizationId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
    });
  }

  function handleReset() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await resetBranding(organizationId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setLogoUrl("");
      setPrimaryColor("#0f172a");
      setAccentColor("#3b82f6");
      setSupportEmail("");
      setCustomDomain("");
      setSuccess(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}
      {success && !error && (
        <div
          role="status"
          className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
        >
          {t("saved")}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("identitySection")}</CardTitle>
          <CardDescription>{t("identityDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="logoUrl">{t("logoUrl")}</Label>
            <Input
              id="logoUrl"
              name="logoUrl"
              type="url"
              placeholder="https://exemple.com/logo.svg"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">{t("logoHint")}</p>
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Logo preview"
                className="mt-2 h-10 w-auto max-w-[12rem] rounded border bg-background object-contain p-1"
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="supportEmail">{t("supportEmail")}</Label>
            <Input
              id="supportEmail"
              name="supportEmail"
              type="email"
              placeholder="support@acme.com"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              {t("supportEmailHint")}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("colorsSection")}</CardTitle>
          <CardDescription>{t("colorsDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <ColorField
            id="primaryColor"
            label={t("primaryColor")}
            value={primaryColor}
            onChange={setPrimaryColor}
          />
          <ColorField
            id="accentColor"
            label={t("accentColor")}
            value={accentColor}
            onChange={setAccentColor}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("domainSection")}</CardTitle>
          <CardDescription>{t("domainDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <Label htmlFor="customDomain">{t("customDomain")}</Label>
          <Input
            id="customDomain"
            name="customDomain"
            type="text"
            placeholder="audit.acme.com"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">{t("domainHint")}</p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleReset}
          disabled={pending}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {t("reset")}
        </Button>
        <Button type="submit" disabled={pending} className="gap-2">
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          {t("save")}
        </Button>
      </div>
    </form>
  );
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          id={`${id}-picker`}
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border bg-background"
        />
        <Input
          id={id}
          name={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          pattern="^#[0-9a-fA-F]{6}$"
          maxLength={7}
          className="flex-1 font-mono text-xs uppercase"
          autoComplete="off"
        />
      </div>
    </div>
  );
}
