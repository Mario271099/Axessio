// Forme des données passées au template de rapport par la route.
// Extrait de report-template.tsx (découpage des gros fichiers).

import type { OutputBranding } from "@/lib/branding/output";
import type {
  AuditStatus,
  ConformityStatus,
  NCSeverity,
  NCStatus,
  PageType,
  PlatformType,
  ReferenceType,
  ServiceType,
  UserRole,
  WCAGLevel,
} from "@/types/domain";

export type ReportLocale = "fr" | "en";

export interface ReportData {
  generatedAt: string;
  /** Branding de sortie (org white-label ou défauts Axessyo). */
  branding: OutputBranding;
  auditor: {
    name: string;
    role: UserRole;
  };
  audit: {
    id: string;
    status: AuditStatus;
    platform: PlatformType;
    serviceType: ServiceType;
    initialScore: number | null;
    finalScore: number | null;
    deliveredAt: string | null;
    onlineAt: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
  };
  project: {
    id: string;
    name: string;
    url: string | null;
  };
  client: {
    id: string;
    name: string;
    website: string | null;
  };
  reference: {
    id: string;
    type: ReferenceType;
    version: string;
  };
  pages: Array<{
    id: string;
    name: string;
    url: string | null;
    pageType: PageType;
    sortOrder: number;
  }>;
  thematics: Array<{
    id: string;
    identifier: string;
    name: string;
    sortOrder: number;
  }>;
  criteria: Array<{
    id: string;
    thematicId: string;
    identifier: string;
    name: string;
    nameEn: string | null;
    level: WCAGLevel | null;
  }>;
  pageConformities: Array<{
    id: string;
    pageId: string;
    criteriaId: string;
    status: ConformityStatus;
  }>;
  nonConformities: Array<{
    id: string;
    pageId: string | null;
    criteriaId: string;
    title: string;
    description: string | null;
    actualResult: string | null;
    recommendation: string | null;
    severity: NCSeverity;
    status: NCStatus;
    testReference: string | null;
    criterion: { identifier: string; name: string; url: string | null };
    page: { name: string; sortOrder: number } | null;
    attachments: Array<{
      id: string;
      storagePath: string;
      fileName: string | null;
      mimeType: string | null;
      kind: string;
      signedUrl: string | null;
    }>;
  }>;
}
