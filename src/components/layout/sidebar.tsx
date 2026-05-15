"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookMarked,
  Building2,
  ChevronUp,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  UserCircle,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { AxIcon } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { USER_ROLE_LABELS } from "@/lib/constants";
import { signOut } from "@/app/(auth)/actions";
import type { Profile, UserRole } from "@/types/domain";

type IconKey =
  | "dashboard"
  | "audits"
  | "clients"
  | "users"
  | "references"
  | "settings";

const ICONS = {
  dashboard: LayoutDashboard,
  audits: ClipboardCheck,
  clients: Building2,
  users: Users,
  references: BookMarked,
  settings: Settings,
} as const;

interface NavItem {
  href: string;
  label: string;
  iconKey: IconKey;
  /** Si null, visible pour tous. */
  roles: UserRole[] | null;
  /** Clé du compteur à afficher en badge (depuis `counts`). */
  badgeKey?: keyof NavCounts;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: "Principal",
    items: [
      { href: "/dashboard", label: "Tableau de bord", iconKey: "dashboard", roles: null },
      { href: "/audits", label: "Audits", iconKey: "audits", roles: null, badgeKey: "inProgressAudits" },
    ],
  },
  {
    title: "Gestion",
    items: [
      { href: "/clients", label: "Clients", iconKey: "clients", roles: ["auditor"] },
      { href: "/users", label: "Utilisateurs", iconKey: "users", roles: ["auditor"] },
      { href: "/references", label: "Référentiels", iconKey: "references", roles: ["auditor"] },
    ],
  },
  {
    title: "Autres",
    items: [
      { href: "/settings", label: "Paramètres", iconKey: "settings", roles: null },
    ],
  },
];

export interface NavCounts {
  inProgressAudits: number;
}

interface SidebarProps {
  profile: Profile;
  counts: NavCounts;
}

export function Sidebar({ profile, counts }: SidebarProps) {
  const pathname = usePathname();
  const userRole = profile.role;

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
      {/* Header sidebar — logo + nom de marque */}
      <div className="flex h-16 items-center border-b border-border px-4">
        <Link
          href="/dashboard"
          aria-label="Axessio — retour au tableau de bord"
          className="-mx-2 inline-flex items-center gap-2 rounded-md px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <AxIcon size={28} aria-label="" />
          <span className="text-base font-bold tracking-tight">Axessio</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Navigation principale"
        className="flex-1 space-y-5 overflow-y-auto p-3"
      >
        {SECTIONS.map((section) => {
          const visibleItems = section.items.filter(
            (item) => item.roles === null || item.roles.includes(userRole),
          );
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.title}>
              <h2 className="px-3 pb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h2>
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  const Icon = ICONS[item.iconKey];
                  const badgeValue = item.badgeKey
                    ? counts[item.badgeKey]
                    : 0;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "relative flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-all duration-150",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                      >
                        {isActive && (
                          <span
                            aria-hidden="true"
                            className="absolute left-0 top-1 bottom-1 w-1 rounded-r bg-primary"
                          />
                        )}
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="flex-1 truncate">{item.label}</span>
                        {badgeValue > 0 && (
                          <Badge
                            variant="secondary"
                            className="ml-auto h-5 px-1.5 text-[10px] tabular-nums"
                          >
                            {badgeValue}
                          </Badge>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Footer — user card + dropdown */}
      <div className="border-t border-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <div
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
              >
                {initials(profile.firstName || "?", profile.lastName || "?")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight">
                  {profile.firstName} {profile.lastName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {USER_ROLE_LABELS[profile.role]}
                </p>
              </div>
              <ChevronUp
                className="h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <UserCircle className="h-4 w-4" aria-hidden="true" />
                Mon profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4" aria-hidden="true" />
                Paramètres
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                void signOut();
              }}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
