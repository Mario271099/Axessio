"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Copy, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteOrgMember } from "./actions";

const ORG_ROLES = ["auditor", "admin", "viewer"] as const;

export function InviteMemberForm({ orgId }: { orgId: string }) {
  const t = useTranslations("organizations.invite");
  const tRole = useTranslations("organizations.role");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitedUrl, setInvitedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInvitedUrl(null);
    setCopied(false);
    setPending(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const result = await inviteOrgMember(orgId, formData);

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    setInvitedUrl(result.invitationUrl ?? null);
    form.reset();
    setPending(false);
  }

  async function copyLink() {
    if (!invitedUrl) return;
    try {
      await navigator.clipboard.writeText(invitedUrl);
      setCopied(true);
    } catch {
      // clipboard indisponible — l'URL reste sélectionnable manuellement.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p
          role="alert"
          className="inline-flex w-full items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}

      {invitedUrl && (
        <div
          role="status"
          className="space-y-2 rounded-md border border-success/40 bg-success/10 p-3 text-sm"
        >
          <p className="inline-flex items-start gap-2 text-success">
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span>{t("success")}</span>
          </p>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={invitedUrl}
              aria-label={t("inviteLinkLabel")}
              className="font-mono text-xs"
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyLink}
              className="shrink-0 gap-1"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              {copied ? t("copied") : t("copy")}
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="invite-first-name">{t("firstName")}</Label>
          <Input
            id="invite-first-name"
            name="first_name"
            type="text"
            autoComplete="given-name"
            required
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-last-name">{t("lastName")}</Label>
          <Input
            id="invite-last-name"
            name="last_name"
            type="text"
            autoComplete="family-name"
            required
            disabled={pending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="invite-email">{t("email")}</Label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          autoComplete="off"
          required
          placeholder={t("emailPlaceholder")}
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="invite-role">{t("role")}</Label>
        <select
          id="invite-role"
          name="org_role"
          defaultValue="auditor"
          disabled={pending}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {ORG_ROLES.map((role) => (
            <option key={role} value={role}>
              {tRole(role)}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">{t("roleHint")}</p>
      </div>

      <Button type="submit" disabled={pending} className="gap-2">
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <UserPlus className="h-4 w-4" aria-hidden="true" />
        )}
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
