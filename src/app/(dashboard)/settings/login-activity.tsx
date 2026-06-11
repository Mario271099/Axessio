// Carte « Connexions récentes » — server component pur (pas d'interactivité).
// Affiche les derniers login.success / login.failed du compte courant pour
// que l'utilisateur repère une activité qu'il ne reconnaît pas.

import { getLocale, getTranslations } from "next-intl/server";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LoginActivityEntry } from "./actions";

// Résumé lisible du user-agent : navigateur + OS. Volontairement grossier —
// l'objectif est « Chrome · Windows », pas une détection exhaustive.
function summarizeUserAgent(ua: string | null): string | null {
  if (!ua) return null;

  let browser: string | null = null;
  if (/edg(e|a|ios)?\//i.test(ua)) browser = "Edge";
  else if (/opr\/|opera/i.test(ua)) browser = "Opera";
  else if (/firefox\//i.test(ua)) browser = "Firefox";
  else if (/chrome\/|crios\//i.test(ua)) browser = "Chrome";
  else if (/safari\//i.test(ua)) browser = "Safari";

  let os: string | null = null;
  if (/windows/i.test(ua)) os = "Windows";
  else if (/iphone|ipad|ios/i.test(ua)) os = "iOS";
  else if (/mac os x|macintosh/i.test(ua)) os = "macOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/linux/i.test(ua)) os = "Linux";

  if (browser && os) return `${browser} · ${os}`;
  return browser ?? os;
}

export async function LoginActivity({
  entries,
}: {
  entries: LoginActivityEntry[];
}) {
  const t = await getTranslations("settings.loginActivity");
  const locale = await getLocale();

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <ul className="divide-y divide-border">
      {entries.map((entry) => {
        const isSuccess = entry.kind === "success";
        const Icon = isSuccess ? CheckCircle2 : ShieldAlert;
        const device = summarizeUserAgent(entry.userAgent);
        return (
          <li key={entry.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <Icon
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                isSuccess ? "text-success" : "text-destructive",
              )}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {isSuccess ? t("success") : t("failed")}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatter.format(new Date(entry.createdAt))}
                {device && <> · {device}</>}
                {entry.ip && (
                  <>
                    {" "}
                    · <span className="tabular-nums">{entry.ip}</span>
                  </>
                )}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
