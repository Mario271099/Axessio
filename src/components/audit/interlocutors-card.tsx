import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Pencil, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Palette d'avatars dérivée du hash de l'id (cohérent avec nc-detail).
const AVATAR_COLORS = [
  "bg-emerald-500 text-white",
  "bg-zinc-800 text-white",
  "bg-blue-600 text-white",
  "bg-amber-500 text-white",
  "bg-rose-500 text-white",
  "bg-violet-600 text-white",
];

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]!;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

export type InterlocutorRole = "auditor" | "proofreader" | "client";

export interface Interlocutor {
  id: string;
  name: string;
  email: string | null;
  /** Rôle métier — détermine la légende secondaire affichée. */
  role: InterlocutorRole;
  /** Contexte secondaire (ex: nom du projet pour les clients). */
  subtitle: string | null;
}

interface InterlocutorsCardProps {
  interlocutors: Interlocutor[];
  /** href du bouton "Modifier" — affiché seulement si canEdit. */
  manageHref?: string;
  canEdit: boolean;
  /** Lien CTA "Envoyer un message" (mailto: ou bien interne). */
  messageHref?: string;
}

/**
 * Carte de droite "Interlocuteurs" inspirée du design de référence : liste
 * compacte d'avatars colorés + nom + rôle secondaire, avec un bouton crayon
 * pour gérer les assignations et un CTA "Message" en tête.
 */
export async function InterlocutorsCard({
  interlocutors,
  manageHref,
  canEdit,
  messageHref,
}: InterlocutorsCardProps) {
  const t = await getTranslations("audits.interlocutors");

  return (
    <div className="space-y-3">
      {messageHref && (
        <Button asChild variant="outline" className="w-full rounded-full">
          <Link href={messageHref}>
            {t("messageCta")}
          </Link>
        </Button>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          {canEdit && manageHref && (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              aria-label={t("manage")}
            >
              <Link href={manageHref}>
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {interlocutors.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <ul className="space-y-3">
              {interlocutors.map((i) => (
                <li key={i.id} className="flex items-center gap-3">
                  <div
                    aria-hidden="true"
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      avatarColor(i.id),
                    )}
                  >
                    {initialsFor(i.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-tight">
                      {i.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {i.role === "auditor"
                        ? t("roleAuditor")
                        : i.role === "proofreader"
                          ? t("roleProofreader")
                          : (i.subtitle ?? "")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
