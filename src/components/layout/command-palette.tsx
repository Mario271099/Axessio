"use client";

// Palette de commandes / recherche globale. Ouverture via Cmd+K (macOS)
// ou Ctrl+K (Windows/Linux). Cherche en parallèle dans les audits, projets
// et clients de l'org active, et propose aussi des liens rapides vers les
// pages courantes du dashboard.
//
// Stratégie : queries Supabase côté client pour bénéficier de la RLS (un
// user ne voit jamais ce qu'il n'aurait pas le droit de voir). Debounce
// 200 ms pour ne pas spammer la base.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Building2,
  ClipboardList,
  CreditCard,
  FolderKanban,
  Layout,
  Loader2,
  Search,
  Settings,
  Users,
} from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type ResultKind = "audit" | "project" | "client" | "navigation";

interface SearchResult {
  kind: ResultKind;
  id: string;
  title: string;
  subtitle?: string | null;
  href: string;
}

const DEBOUNCE_MS = 200;
const MAX_PER_KIND = 5;

export function CommandPalette() {
  const t = useTranslations("commandPalette");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Liens rapides toujours visibles (même sans recherche) - bornes du
  // dashboard pour les power users.
  const navigationItems = useMemo<SearchResult[]>(
    () => [
      {
        kind: "navigation",
        id: "dashboard",
        title: t("nav.dashboard"),
        href: "/dashboard",
      },
      {
        kind: "navigation",
        id: "audits",
        title: t("nav.audits"),
        href: "/audits",
      },
      {
        kind: "navigation",
        id: "clients",
        title: t("nav.clients"),
        href: "/clients",
      },
      {
        kind: "navigation",
        id: "projects",
        title: t("nav.projects"),
        href: "/projects",
      },
      {
        kind: "navigation",
        id: "settings",
        title: t("nav.settings"),
        href: "/settings",
      },
    ],
    [t],
  );

  // Cmd+K / Ctrl+K ouvre la palette. Cmd+/ ouvre aussi (alternative
  // courante). Escape ferme (géré par Radix Dialog automatiquement).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "/")) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Reset à chaque ouverture pour ne pas garder la dernière recherche.
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
    }
  }, [open]);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const ilike = `%${trimmed.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

    const [auditsRes, projectsRes, clientsRes] = await Promise.all([
      supabase
        .from("audits")
        .select("id, site_name, status, project:projects(name, client:clients(name))")
        .ilike("site_name", ilike)
        .limit(MAX_PER_KIND),
      supabase
        .from("projects")
        .select("id, name, client:clients(name)")
        .ilike("name", ilike)
        .limit(MAX_PER_KIND),
      supabase
        .from("clients")
        .select("id, name")
        .ilike("name", ilike)
        .limit(MAX_PER_KIND),
    ]);

    type AuditRow = {
      id: string;
      site_name: string | null;
      status: string | null;
      project:
        | { name: string; client: { name: string } | { name: string }[] | null }
        | { name: string; client: { name: string } | { name: string }[] | null }[]
        | null;
    };
    type ProjectRow = {
      id: string;
      name: string;
      client: { name: string } | { name: string }[] | null;
    };
    type ClientRow = { id: string; name: string };

    const audits: SearchResult[] = ((auditsRes.data ?? []) as AuditRow[]).map(
      (a) => {
        const project = Array.isArray(a.project) ? a.project[0] : a.project;
        const client = project?.client
          ? Array.isArray(project.client)
            ? project.client[0]
            : project.client
          : null;
        return {
          kind: "audit",
          id: a.id,
          title: a.site_name || project?.name || "—",
          subtitle:
            [project?.name, client?.name].filter(Boolean).join(" · ") || null,
          href: `/audits/${a.id}`,
        };
      },
    );

    const projects: SearchResult[] = (
      (projectsRes.data ?? []) as ProjectRow[]
    ).map((p) => {
      const client = Array.isArray(p.client) ? p.client[0] : p.client;
      return {
        kind: "project",
        id: p.id,
        title: p.name,
        subtitle: client?.name ?? null,
        href: "/projects",
      };
    });

    const clients: SearchResult[] = ((clientsRes.data ?? []) as ClientRow[]).map(
      (c) => ({
        kind: "client",
        id: c.id,
        title: c.name,
        href: `/clients/${c.id}`,
      }),
    );

    setResults([...audits, ...projects, ...clients]);
    setLoading(false);
    setActiveIndex(0);
  }, []);

  // Debounce la frappe pour éviter une requête à chaque keystroke.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runSearch(query);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  const items: SearchResult[] =
    query.trim().length < 2 ? navigationItems : results;

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % Math.max(items.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(
        (i) => (i - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1),
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = items[activeIndex];
      if (target) {
        setOpen(false);
        router.push(target.href);
      }
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:animate-in data-[state=open]:fade-in",
          )}
        />
        <DialogPrimitive.Content
          aria-label={t("title")}
          className={cn(
            "fixed left-1/2 top-[15%] z-50 w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-background shadow-2xl",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:animate-in data-[state=open]:fade-in",
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            {t("title")}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {t("description")}
          </DialogPrimitive.Description>

          <div className="relative border-b border-border">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={t("placeholder")}
              className="border-0 pl-11 pr-12 text-base focus-visible:ring-0"
              aria-label={t("placeholder")}
            />
            {loading && (
              <Loader2
                className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
                aria-hidden="true"
              />
            )}
          </div>

          <ul role="listbox" className="max-h-80 overflow-y-auto py-1">
            {items.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                {query.trim().length < 2 ? t("startTyping") : t("noResults")}
              </li>
            ) : (
              items.map((r, i) => (
                <ResultItem
                  key={`${r.kind}-${r.id}`}
                  result={r}
                  active={i === activeIndex}
                  onSelect={() => {
                    setOpen(false);
                    router.push(r.href);
                  }}
                  onHover={() => setActiveIndex(i)}
                />
              ))
            )}
          </ul>

          <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
            <span>{t("hint")}</span>
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
              {t("kbdClose")}
            </kbd>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

const KIND_ICON: Record<ResultKind, typeof ClipboardList> = {
  audit: ClipboardList,
  project: FolderKanban,
  client: Building2,
  navigation: Layout,
};

function ResultItem({
  result,
  active,
  onSelect,
  onHover,
}: {
  result: SearchResult;
  active: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  // Icônes spéciales pour quelques destinations de navigation.
  const Icon =
    result.kind === "navigation" && result.id === "settings"
      ? Settings
      : result.kind === "navigation" && result.id === "clients"
        ? Users
        : result.kind === "navigation" && result.id === "billing"
          ? CreditCard
          : KIND_ICON[result.kind];

  return (
    <li role="option" aria-selected={active}>
      <button
        type="button"
        onClick={onSelect}
        onMouseEnter={onHover}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
          active ? "bg-accent text-foreground" : "text-foreground/90 hover:bg-accent/50",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
            active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">
            {result.title}
          </span>
          {result.subtitle && (
            <span className="block truncate text-xs text-muted-foreground">
              {result.subtitle}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}
