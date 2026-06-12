// Types partagés entre NCDetail et ses sous-composants (discussion,
// captures, carte de détails). Extraits dans un module dédié pour éviter
// les imports circulaires entre nc-detail.tsx et les sous-composants.

import type { NCReviewStatus, NCSeverity } from "@/types/domain";

export interface CriterionData {
  id: string;
  identifier: string;
  name: string;
  url: string | null;
  methodology: string | null;
}

export interface PageData {
  id: string;
  name: string;
}

export interface MessageData {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  author: { firstName: string; lastName: string } | null;
  /** Fil de discussion (migration 34). Défaut 'client' pour rétrocompat. */
  thread?: "client" | "review";
}

export interface AttachmentData {
  id: string;
  storagePath: string;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  uploadedBy: string | null;
  createdAt: string;
  signedUrl: string | null;
}

export interface NCData {
  id: string;
  title: string;
  description: string | null;
  actualResult: string | null;
  recommendation: string | null;
  severity: NCSeverity;
  status: string;
  pageId: string | null;
  testReference: string | null;
  criterion: CriterionData | null;
  page: PageData | null;
  /** Statut de relecture (migration 33). */
  reviewStatus: NCReviewStatus;
  /** Numéro séquentiel par audit (migration 41). 0 = legacy non backfillé. */
  displayNumber: number;
}

export interface NCSibling {
  id: string;
  displayNumber: number;
}
