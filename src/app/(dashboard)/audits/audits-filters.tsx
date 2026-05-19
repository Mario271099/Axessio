"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { RotateCcw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AuditStatus, PlatformType } from "@/types/domain";

const ALL = "ALL";
const SEARCH_DEBOUNCE_MS = 300;

const STATUSES: AuditStatus[] = [
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

const PLATFORMS: PlatformType[] = ["WEB", "MOBILE"];

interface Props {
  initialQuery: string;
  initialStatus: string;
  initialPlatform: string;
}

export function AuditsFilters({
  initialQuery,
  initialStatus,
  initialPlatform,
}: Props) {
  const t = useTranslations("audits.list");
  const tStatus = useTranslations("constants.auditStatus");
  const tPlatform = useTranslations("constants.platform");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus || ALL);
  const [platform, setPlatform] = useState(initialPlatform || ALL);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Construit une URL nouvelle en mergeant les paramètres existants et en
  // remettant la pagination à la page 1 quand un filtre change.
  const pushParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "" || value === ALL) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      // Toute modification de filtre réinitialise la pagination.
      next.delete("page");
      const search = next.toString();
      router.replace(search ? `${pathname}?${search}` : pathname);
    },
    [pathname, router, searchParams],
  );

  // Debounce la recherche pour ne pas navigate à chaque keystroke.
  useEffect(() => {
    if (query === initialQuery) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushParams({ q: query.trim() || null });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, initialQuery, pushParams]);

  const filtersActive = useMemo(
    () => query.trim() !== "" || status !== ALL || platform !== ALL,
    [query, status, platform],
  );

  const reset = () => {
    setQuery("");
    setStatus(ALL);
    setPlatform(ALL);
    router.replace(pathname);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchAria")}
          className="pl-9"
        />
      </div>

      <Select
        value={status}
        onValueChange={(v) => {
          setStatus(v);
          pushParams({ status: v === ALL ? null : v });
        }}
      >
        <SelectTrigger className="sm:w-48" aria-label={t("filterStatusAria")}>
          <SelectValue placeholder={t("filterStatusPlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("filterAllStatuses")}</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {tStatus(s)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={platform}
        onValueChange={(v) => {
          setPlatform(v);
          pushParams({ platform: v === ALL ? null : v });
        }}
      >
        <SelectTrigger className="sm:w-40" aria-label={t("filterPlatformAria")}>
          <SelectValue placeholder={t("filterPlatformPlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("filterAllPlatforms")}</SelectItem>
          {PLATFORMS.map((p) => (
            <SelectItem key={p} value={p}>
              {tPlatform(p)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {filtersActive && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={reset}
          className="gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          {t("resetFilters")}
        </Button>
      )}
    </div>
  );
}
