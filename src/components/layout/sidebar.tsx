"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  UserCog,
  Building2,
  BookOpen,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/domain";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  /** Si null, visible pour tous. */
  roles: UserRole[] | null;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, roles: null },
  { href: "/audits",    label: "Audits",          icon: ClipboardCheck,  roles: null },
  { href: "/projects",  label: "Projets",         icon: Building2,       roles: null },
  { href: "/clients",   label: "Clients",         icon: Users,           roles: ["auditor"] },
  { href: "/users",     label: "Utilisateurs",    icon: UserCog,         roles: ["auditor"] },
  { href: "/references", label: "Référentiels",   icon: BookOpen,        roles: ["auditor"] },
  { href: "/settings",  label: "Paramètres",      icon: Settings,        roles: null },
];

export function Sidebar({ userRole }: { userRole: UserRole }) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter(
    (item) => item.roles === null || item.roles.includes(userRole),
  );

  return (
    <nav
      aria-label="Navigation principale"
      className="hidden w-64 shrink-0 border-r border-border bg-card md:flex md:flex-col"
    >
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <span className="text-sm font-bold">A</span>
          </div>
          Axessio
        </Link>
      </div>

      {/* Navigation */}
      <ul className="flex-1 space-y-1 p-3">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Footer (version) */}
      <div className="border-t border-border p-4 text-xs text-muted-foreground">
        Axessio · v0.1.0
      </div>
    </nav>
  );
}
