"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Save } from "lucide-react";
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
  updateAudit,
  type ActionState,
} from "@/app/(dashboard)/audits/actions";
import { REFERENCE_TYPE_LABELS } from "@/lib/constants";
import type { AuditStatus, ReferenceType } from "@/types/domain";

interface EditAuditFormProps {
  auditId: string;
  initial: {
    referenceId: string;
    platform: string;
    serviceType: string;
    status: string;
    language: string;
    expectedStartAt: string | null;
    expectedEndAt: string | null;
    accessibilityLink: string | null;
    notes: string | null;
  };
  references: Array<{ id: string; type: ReferenceType; version: string }>;
}

const initialState: ActionState = { error: null };

const ALL_STATUSES: AuditStatus[] = [
  "PENDING",
  "PLANNED",
  "IN_PROGRESS",
  "DELIVERED",
  "REMEDIATION",
  "COUNTER_AUDIT",
  "ONLINE",
  "COMPLETED",
  "ARCHIVED",
];

export function EditAuditForm({
  auditId,
  initial,
  references,
}: EditAuditFormProps) {
  const router = useRouter();
  const t = useTranslations("audits.edit");
  const tPlatform = useTranslations("constants.platform");
  const tServiceType = useTranslations("constants.serviceType");
  const tStatus = useTranslations("constants.auditStatus");
  const tNew = useTranslations("audits.new");
  const [state, formAction, pending] = useActionState(
    updateAudit.bind(null, auditId),
    initialState,
  );

  const [referenceId, setReferenceId] = useState(initial.referenceId);
  const [platform, setPlatform] = useState(initial.platform);
  const [serviceType, setServiceType] = useState(initial.serviceType);
  const [status, setStatus] = useState(initial.status);
  const [language, setLanguage] = useState(initial.language);

  if (state.success) {
    router.push(`/audits/${auditId}`);
    router.refresh();
  }

  const formatForInput = (iso: string | null) =>
    iso ? new Date(iso).toISOString().slice(0, 10) : "";

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="referenceId" value={referenceId} />
      <input type="hidden" name="platform" value={platform} />
      <input type="hidden" name="serviceType" value={serviceType} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="language" value={language} />

      {state.error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("section1")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ref-edit">{t("reference")}</Label>
            <Select value={referenceId} onValueChange={setReferenceId}>
              <SelectTrigger id="ref-edit">
                <SelectValue />
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
              <Label htmlFor="platform-edit">{t("platform")}</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger id="platform-edit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEB">{tPlatform("WEB")}</SelectItem>
                  <SelectItem value="MOBILE">{tPlatform("MOBILE")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-edit">{t("serviceType")}</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger id="service-edit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUDIT">{tServiceType("AUDIT")}</SelectItem>
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
              <Label htmlFor="status-edit">{t("status")}</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status-edit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {tStatus(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lang-edit">{t("language")}</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="lang-edit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("section2")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start-edit">{t("startDate")}</Label>
              <Input
                id="start-edit"
                name="expectedStartAt"
                type="date"
                defaultValue={formatForInput(initial.expectedStartAt)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-edit">{t("endDate")}</Label>
              <Input
                id="end-edit"
                name="expectedEndAt"
                type="date"
                defaultValue={formatForInput(initial.expectedEndAt)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="a11y-edit">{t("a11yLink")}</Label>
            <Input
              id="a11y-edit"
              name="accessibilityLink"
              type="url"
              defaultValue={initial.accessibilityLink ?? ""}
              placeholder={tNew("steps.planning.a11yLinkPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes-edit">{t("notes")}</Label>
            <Textarea
              id="notes-edit"
              name="notes"
              defaultValue={initial.notes ?? ""}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(`/audits/${auditId}`)}
        >
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("saving")}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {t("save")}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
