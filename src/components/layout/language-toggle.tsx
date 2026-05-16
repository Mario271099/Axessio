"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setLocale } from "@/i18n/actions";
import {
  LOCALES,
  LOCALE_FLAGS,
  LOCALE_LABELS,
  type Locale,
} from "@/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const currentLocale = useLocale() as Locale;
  const t = useTranslations("topbar.language");
  const [pending, startTransition] = useTransition();

  const handleSelect = (locale: Locale) => {
    if (locale === currentLocale) return;
    startTransition(async () => {
      await setLocale(locale);
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("current", {
            language: LOCALE_LABELS[currentLocale],
          })}
          title={t("label")}
          disabled={pending}
          className="relative"
        >
          <Globe className="h-4 w-4" aria-hidden="true" />
          <span
            aria-hidden="true"
            className="absolute -bottom-0.5 right-0.5 rounded-sm bg-background px-0.5 font-mono text-[9px] font-semibold leading-none tabular-nums text-muted-foreground shadow-xs"
          >
            {LOCALE_FLAGS[currentLocale]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {LOCALES.map((locale) => {
          const isCurrent = locale === currentLocale;
          return (
            <DropdownMenuItem
              key={locale}
              onSelect={() => handleSelect(locale)}
              className={cn(
                "gap-2",
                isCurrent && "font-semibold text-primary focus:text-primary",
              )}
              aria-current={isCurrent ? "true" : undefined}
            >
              <span
                aria-hidden="true"
                className="inline-flex h-5 w-7 items-center justify-center rounded border border-border bg-muted font-mono text-[10px] font-semibold tabular-nums"
              >
                {LOCALE_FLAGS[locale]}
              </span>
              {LOCALE_LABELS[locale]}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
