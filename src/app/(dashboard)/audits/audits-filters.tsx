"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LayoutGrid, List, RotateCcw, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AuditStatus, PlatformType } from "@/types/domain";
import type { AuditsView } from "./audits-table";

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

/**
 * Statuts proposés en accès direct sous forme de pilules, comme dans les
 * maquettes. Les autres restent accessibles par la liste déroulante.
 */
const QUICK_STATUSES: AuditStatus[] = [
  "IN_PROGRESS",
  "REMEDIATION",
  "COUNTER_AUDIT",
  "COMPLETED",
];

const PLATFORMS: PlatformType[] = ["WEB", "MOBILE"];

interface Props {
  initialQuery: string;
  initialStatus: string;
  initialPlatform: string;
  initialMine: boolean;
  /** Si false, on n'affiche pas le toggle « Mes audits » (non-staff). */
  canSeeMine: boolean;
  initialView: AuditsView;
}

export function AuditsFilters({
  initialQuery,
  initialStatus,
  initialPlatform,
  initialMine,
  canSeeMine,
  initialView,
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
  const [mine, setMine] = useState(initialMine);

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
    () => query.trim() !== "" || status !== ALL || platform !== ALL || mine,
    [query, status, platform, mine],
  );

  const reset = () => {
    setQuery("");
    setStatus(ALL);
    setPlatform(ALL);
    setMine(false);
    // La vue choisie (liste / cartes) est une préférence d'affichage :
    // elle survit à la remise à zéro des filtres.
    const next = new URLSearchParams();
    if (initialView !== "list") next.set("view", initialView);
    const search = next.toString();
    router.replace(search ? `${pathname}?${search}` : pathname);
  };

  const toggleMine = () => {
    const next = !mine;
    setMine(next);
    pushParams({ mine: next ? "1" : null });
  };

  const pickStatus = (value: string) => {
    setStatus(value);
    pushParams({ status: value === ALL ? null : value });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-80">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchAria")}
            className="rounded-row pl-11"
          />
        </div>

        <div
          role="group"
          aria-label={t("filterStatusAria")}
          className="flex flex-wrap items-center gap-2"
        >
          <FilterChip
            label={t("filterAllStatuses")}
            pressed={status === ALL}
            onClick={() => pickStatus(ALL)}
          />
          {QUICK_STATUSES.map((s) => (
            <FilterChip
              key={s}
              label={tStatus(s)}
              pressed={status === s}
              onClick={() => pickStatus(s)}
            />
          ))}
        </div>

        <ViewToggle
          view={initialView}
          listLabel={t("view.list")}
          cardsLabel={t("view.cards")}
          groupLabel={t("view.ariaLabel")}
          onChange={(next) =>
            pushParams({ view: next === "list" ? null : next })
          }
          className="sm:ml-auto"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={status} onValueChange={pickStatus}>
          <SelectTrigger
            className="h-9 w-48 rounded-full text-sm font-bold"
            aria-label={t("filterStatusAria")}
          >
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
          <SelectTrigger
            className="h-9 w-44 rounded-full text-sm font-bold"
            aria-label={t("filterPlatformAria")}
          >
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

        {canSeeMine && (
          <FilterChip
            label={t("filterMine")}
            pressed={mine}
            onClick={toggleMine}
            ariaLabel={t("filterMineAria")}
            icon={<User className="size-3.5" aria-hidden="true" />}
          />
        )}

        {filtersActive && (
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            <RotateCcw aria-hidden="true" />
            {t("resetFilters")}
          </Button>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/** Pilule de filtre : pressée = fond encre, texte blanc. */
function FilterChip({
  label,
  pressed,
  onClick,
  ariaLabel,
  icon,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
  ariaLabel?: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-sm font-bold",
        "transition-[background-color,border-color,color] duration-150",
        pressed
          ? "border-ink bg-ink text-ink-foreground"
          : "border-border-strong bg-card text-foreground hover:border-primary",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/** Bascule liste / cartes. */
function ViewToggle({
  view,
  listLabel,
  cardsLabel,
  groupLabel,
  onChange,
  className,
}: {
  view: AuditsView;
  listLabel: string;
  cardsLabel: string;
  groupLabel: string;
  onChange: (view: AuditsView) => void;
  className?: string;
}) {
  const button =
    "flex h-9 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:text-foreground aria-pressed:bg-card aria-pressed:text-primary aria-pressed:shadow-sm";
  return (
    <div
      role="group"
      aria-label={groupLabel}
      className={cn(
        "flex shrink-0 items-center gap-1 rounded-row bg-secondary p-[3px]",
        className,
      )}
    >
      <button
        type="button"
        aria-pressed={view === "list"}
        aria-label={listLabel}
        onClick={() => onChange("list")}
        className={button}
      >
        <List className="size-[18px]" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-pressed={view === "cards"}
        aria-label={cardsLabel}
        onClick={() => onChange("cards")}
        className={button}
      >
        <LayoutGrid className="size-[18px]" aria-hidden="true" />
      </button>
    </div>
  );
}
