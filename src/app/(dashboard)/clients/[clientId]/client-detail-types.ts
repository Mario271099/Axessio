// Types et helpers partagés entre ClientDetail et ses dialogues.
// Extraits de client-detail.tsx (découpage des gros composants).

export interface ClientData {
  id: string;
  name: string;
  website: string | null;
  contactEmail: string | null;
  contactName: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  url: string | null;
  auditCount: number;
}

export interface ClientStats {
  projectCount: number;
  auditCount: number;
  activeAuditCount: number;
}

export interface ActivityEvent {
  id: string;
  projectName: string;
  auditId: string;
  status: string;
  at: string;
}

export function normalizeUrl(raw: string): string {
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}
