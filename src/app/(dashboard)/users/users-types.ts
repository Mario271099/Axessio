// Types et helpers partagés entre UsersList, UserRow et les dialogues.
// Extraits de users-list.tsx (découpage des gros composants).

import type { UserRole } from "@/types/domain";

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  clientId: string | null;
  clientName: string | null;
  isActive: boolean;
  createdAt: string;
  hasLoggedIn: boolean;
  isEmailConfirmed: boolean;
}

export interface ClientOption {
  id: string;
  name: string;
}

export type UserStatus = "INACTIVE" | "PENDING" | "ACTIVE";

export function getUserStatus(user: UserListItem): UserStatus {
  if (!user.isActive) return "INACTIVE";
  if (!user.isEmailConfirmed) return "PENDING";
  return "ACTIVE";
}
