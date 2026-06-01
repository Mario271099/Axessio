"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  Check,
  Copy,
  Loader2,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  cancelMfaEnrollment,
  enrollMfa,
  unenrollMfa,
  verifyMfaEnrollment,
} from "./actions";

interface Props {
  initialEnabled: boolean;
  initialFactorId: string | null;
}

type Mode = "idle" | "enrolling" | "enabled";

interface EnrollmentData {
  factorId: string;
  qrCode: string;
  secret: string;
}

function svgToDataUri(svg: string): string {
  // Le QR code renvoyé par Supabase est un SVG brut. On l'encode en data
  // URI pour pouvoir le poser dans un <img src>. encodeURIComponent suffit
  // tant que le SVG n'est pas trop gros (~quelques Ko).
  return `data:image/svg+xml;utf-8,${encodeURIComponent(svg)}`;
}

export function MfaSection({ initialEnabled, initialFactorId }: Props) {
  const t = useTranslations("settings.mfaSection");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [mode, setMode] = useState<Mode>(
    initialEnabled ? "enabled" : "idle",
  );
  const [factorId, setFactorId] = useState<string | null>(initialFactorId);
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [code, setCode] = useState("");
  const [secretCopied, setSecretCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disableOpen, setDisableOpen] = useState(false);
  const [disableCode, setDisableCode] = useState("");

  const handleEnroll = () => {
    setError(null);
    startTransition(async () => {
      const res = await enrollMfa();
      if (res.error || !res.factorId || !res.qrCode || !res.secret) {
        setError(res.error ?? t("errorEnroll"));
        return;
      }
      setEnrollment({
        factorId: res.factorId,
        qrCode: res.qrCode,
        secret: res.secret,
      });
      setMode("enrolling");
      setCode("");
    });
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollment) return;
    setError(null);
    startTransition(async () => {
      const res = await verifyMfaEnrollment(enrollment.factorId, code);
      if (res.error) {
        setError(res.error);
        return;
      }
      setMode("enabled");
      setFactorId(enrollment.factorId);
      setEnrollment(null);
      setCode("");
      router.refresh();
    });
  };

  const handleCancel = () => {
    if (!enrollment) {
      setMode(initialEnabled ? "enabled" : "idle");
      return;
    }
    const fid = enrollment.factorId;
    setEnrollment(null);
    setCode("");
    setError(null);
    setMode(initialEnabled ? "enabled" : "idle");
    // Nettoyage best-effort en arrière-plan — l'utilisateur n'a pas à
    // attendre que le facteur unverified soit retiré.
    startTransition(async () => {
      await cancelMfaEnrollment(fid);
    });
  };

  const handleDisable = () => {
    if (!factorId) return;
    setError(null);
    startTransition(async () => {
      const res = await unenrollMfa(factorId, disableCode);
      if (res.error) {
        setError(res.error);
        return;
      }
      setMode("idle");
      setFactorId(null);
      setDisableOpen(false);
      setDisableCode("");
      router.refresh();
    });
  };

  const copySecret = async () => {
    if (!enrollment) return;
    try {
      await navigator.clipboard.writeText(enrollment.secret);
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);
    } catch {
      // Pas de clipboard API (HTTP, ancien navigateur) — silencieux, le
      // secret reste sélectionnable dans l'input.
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {mode === "enabled" ? (
              <Badge variant="default" className="gap-1">
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                {t("statusEnabled")}
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <ShieldOff className="h-3 w-3" aria-hidden="true" />
                {t("statusDisabled")}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {mode === "enabled" ? t("hintEnabled") : t("hintDisabled")}
          </p>
        </div>

        {mode === "idle" && (
          <Button
            type="button"
            size="sm"
            onClick={handleEnroll}
            disabled={pending}
            className="gap-1.5"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            )}
            {t("enable")}
          </Button>
        )}

        {mode === "enabled" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDisableOpen(true)}
            disabled={pending}
            className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <ShieldOff className="h-4 w-4" aria-hidden="true" />
            {t("disable")}
          </Button>
        )}
      </div>

      {mode === "enrolling" && enrollment && (
        <form
          onSubmit={handleVerify}
          className="space-y-4 rounded-md border border-border bg-muted/30 p-4"
          noValidate
        >
          <p className="text-sm font-medium">{t("enrollTitle")}</p>
          <ol className="list-decimal space-y-3 pl-5 text-sm text-muted-foreground">
            <li>{t("enrollStep1")}</li>
            <li>
              <div className="my-2 inline-block rounded-md border border-border bg-background p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={svgToDataUri(enrollment.qrCode)}
                  alt={t("qrAlt")}
                  className="h-40 w-40"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="mfa-secret"
                  className="text-xs text-muted-foreground"
                >
                  {t("secretLabel")}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="mfa-secret"
                    value={enrollment.secret}
                    readOnly
                    className="font-mono text-xs"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copySecret}
                    className="gap-1.5"
                    disabled={pending}
                  >
                    {secretCopied ? (
                      <Check
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    ) : (
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {secretCopied ? t("copied") : t("copy")}
                  </Button>
                </div>
              </div>
            </li>
            <li>
              <div className="space-y-1.5">
                <Label htmlFor="mfa-code">{t("codeLabel")}</Label>
                <Input
                  id="mfa-code"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\s/g, ""))
                  }
                  placeholder="123456"
                  className="max-w-[10rem] font-mono"
                  disabled={pending}
                  required
                />
              </div>
            </li>
          </ol>

          {error && (
            <p
              role="alert"
              className={cn(
                "inline-flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive",
              )}
            >
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <span>{error}</span>
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={pending || code.length !== 6}>
              {pending && (
                <Loader2
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {t("verifyCta")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={pending}
            >
              {tCommon("cancel")}
            </Button>
          </div>
        </form>
      )}

      {mode !== "enrolling" && error && (
        <p
          role="alert"
          className="inline-flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <span>{error}</span>
        </p>
      )}

      <AlertDialog open={disableOpen} onOpenChange={setDisableOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("disableDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("disableDialogDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="mfa-disable-code">{t("codeLabel")}</Label>
            <Input
              id="mfa-disable-code"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={6}
              value={disableCode}
              onChange={(e) =>
                setDisableCode(e.target.value.replace(/\s/g, ""))
              }
              placeholder="123456"
              className="max-w-[10rem] font-mono"
              disabled={pending}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                handleDisable();
              }}
              disabled={pending || disableCode.length !== 6}
            >
              {pending && (
                <Loader2
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {t("disableConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
