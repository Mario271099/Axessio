// Configuration partagée de la navigation principale — utilisée par la
// sidebar desktop (`sidebar.tsx`) ET le drawer mobile (`mobile-nav-sheet.tsx`).
// Source unique de vérité pour éviter la divergence des deux navs.

import {
  BookMarked,
  Building2,
  CalendarDays,
  ClipboardCheck,
  KeyRound,
  LayoutDashboard,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import type { Permission } from "@/lib/permissions";

export type IconKey =
  | "dashboard"
  | "audits"
  | "planning"
  | "clients"
  | "users"
  | "references"
  | "settings"
  | "permissions"
  | "organizations"
  | "adminOverview";

export const ICONS = {
  dashboard: LayoutDashboard,
  audits: ClipboardCheck,
  planning: CalendarDays,
  clients: Building2,
  users: Users,
  references: BookMarked,
  settings: Settings,
  permissions: KeyRound,
  organizations: Building2,
  adminOverview: Shield,
} as const;

export type ItemKey =
  | "dashboard"
  | "audits"
  | "planning"
  | "clients"
  | "users"
  | "references"
  | "settings"
  | "permissions"
  | "organizations"
  | "adminOverview";

export type SectionKey = "main" | "management" | "admin" | "other";

export interface NavCounts {
  inProgressAudits: number;
}

export interface NavItem {
  href: string;
  itemKey: ItemKey;
  iconKey: IconKey;
  /**
   * Permission requise pour voir l'entrée. `null` = visible pour tous les
   * rôles authentifiés. Le contrôle final reste côté serveur (RLS + checks
   * dans les server actions) — la nav ne fait que cacher l'évident.
   */
  permission: Permission | null;
  /**
   * Si vrai, la permission est satisfiable via le rôle d'ORG (permissions
   * atomiques de `organization_members`), pas seulement via le rôle plateforme
   * legacy. Réservé aux entrées « métier » accessibles à un owner self-serve
   * (audits, planning, clients). Les entrées d'administration plateforme
   * (admin, users legacy, références) restent gated sur le rôle legacy : un
   * owner d'org a TOUTES les permissions atomiques de son org (`permissions.
   * debug`, `user.manage`…) mais ne doit PAS voir les pages plateforme.
   */
  orgScoped?: boolean;
  /** Clé du compteur à afficher en badge (depuis `counts`). */
  badgeKey?: keyof NavCounts;
}

export interface NavSection {
  sectionKey: SectionKey;
  items: NavItem[];
}

export const SECTIONS: NavSection[] = [
  {
    sectionKey: "main",
    items: [
      { href: "/dashboard", itemKey: "dashboard", iconKey: "dashboard", permission: null },
      { href: "/audits", itemKey: "audits", iconKey: "audits", permission: "audit.view", orgScoped: true, badgeKey: "inProgressAudits" },
      { href: "/planning", itemKey: "planning", iconKey: "planning", permission: "audit.edit", orgScoped: true },
    ],
  },
  {
    sectionKey: "management",
    items: [
      { href: "/clients", itemKey: "clients", iconKey: "clients", permission: "project.manage", orgScoped: true },
      { href: "/references", itemKey: "references", iconKey: "references", permission: "project.manage" },
    ],
  },
  {
    sectionKey: "admin",
    items: [
      { href: "/admin/overview", itemKey: "adminOverview", iconKey: "adminOverview", permission: "permissions.debug" },
      { href: "/users", itemKey: "users", iconKey: "users", permission: "user.manage" },
      { href: "/admin/permissions", itemKey: "permissions", iconKey: "permissions", permission: "permissions.debug" },
    ],
  },
  {
    sectionKey: "other",
    items: [
      { href: "/organizations", itemKey: "organizations", iconKey: "organizations", permission: null },
      { href: "/settings", itemKey: "settings", iconKey: "settings", permission: null },
    ],
  },
];
