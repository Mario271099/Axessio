"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateProfile } from "./actions";

interface Props {
  initialFirstName: string;
  initialLastName: string;
  initialLanguage: "fr" | "en";
  email: string;
}

export function ProfileForm({
  initialFirstName,
  initialLastName,
  initialLanguage,
  email,
}: Props) {
  const t = useTranslations("settings.profileSection");
  const tParent = useTranslations("settings");
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [language, setLanguage] = useState<"fr" | "en">(initialLanguage);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("language", language);
    setFeedback(null);
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result.error) {
        setFeedback({ kind: "error", message: result.error });
        return;
      }
      setFeedback({ kind: "success", message: t("success") });
    });
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">{t("firstName")}</Label>
          <Input
            id="firstName"
            name="firstName"
            defaultValue={initialFirstName}
            required
            maxLength={80}
            disabled={pending}
            autoComplete="given-name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">{t("lastName")}</Label>
          <Input
            id="lastName"
            name="lastName"
            defaultValue={initialLastName}
            required
            maxLength={80}
            disabled={pending}
            autoComplete="family-name"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">{tParent("email")}</Label>
        <Input id="email" value={email} disabled readOnly />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="language">{tParent("language")}</Label>
        <Select
          value={language}
          onValueChange={(v) => setLanguage(v as "fr" | "en")}
          disabled={pending}
        >
          <SelectTrigger id="language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fr">{tParent("languageFr")}</SelectItem>
            <SelectItem value="en">{tParent("languageEn")}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{t("languageHint")}</p>
      </div>

      {feedback && (
        <p
          role={feedback.kind === "error" ? "alert" : "status"}
          className={
            feedback.kind === "error"
              ? "inline-flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
              : "inline-flex items-start gap-2 rounded-md bg-success/10 p-3 text-sm text-success"
          }
        >
          {feedback.kind === "error" ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span>{feedback.message}</span>
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t("saving")}
            </>
          ) : (
            t("save")
          )}
        </Button>
      </div>
    </form>
  );
}
