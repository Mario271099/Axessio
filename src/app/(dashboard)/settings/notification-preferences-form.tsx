"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { setNotificationPreference } from "./actions";
import {
  NOTIFICATION_TYPES,
  type NotificationType,
} from "./notification-types";

interface Props {
  initialPreferences: Record<NotificationType, boolean>;
}

export function NotificationPreferencesForm({ initialPreferences }: Props) {
  const t = useTranslations("settings.notificationsSection");
  const tTypes = useTranslations("settings.notificationsSection.types");
  const [prefs, setPrefs] = useState(initialPreferences);
  const [pendingType, setPendingType] = useState<NotificationType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const toggle = (type: NotificationType) => {
    const next = !prefs[type];
    // Optimistic — feedback immédiat, on rollback si la server action échoue.
    setPrefs((prev) => ({ ...prev, [type]: next }));
    setError(null);
    setPendingType(type);
    startTransition(async () => {
      const res = await setNotificationPreference(type, next);
      setPendingType(null);
      if (res.error) {
        setPrefs((prev) => ({ ...prev, [type]: !next }));
        setError(res.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-border rounded-md border border-border">
        {NOTIFICATION_TYPES.map((type) => {
          // next-intl utilise le `.` comme séparateur de namespace : on
          // sanitize la clé pour les types qui en contiennent (`nc.review_*`).
          const i18nKey = type.replace(/\./g, "_");
          const id = `notif-${i18nKey}`;
          const isPending = pendingType === type;
          return (
            <li
              key={type}
              className="flex items-start justify-between gap-3 px-4 py-3"
            >
              <div className="space-y-1">
                <Label
                  htmlFor={id}
                  className="cursor-pointer text-sm font-medium"
                >
                  {tTypes(`${i18nKey}.label`)}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {tTypes(`${i18nKey}.description`)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isPending && (
                  <Loader2
                    className="h-3.5 w-3.5 animate-spin text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
                <Checkbox
                  id={id}
                  checked={prefs[type]}
                  onCheckedChange={() => toggle(type)}
                  aria-label={tTypes(`${i18nKey}.label`)}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {error && (
        <p
          role="alert"
          className={cn(
            "inline-flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive",
          )}
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}

      <p className="text-xs text-muted-foreground">{t("hint")}</p>
    </div>
  );
}
