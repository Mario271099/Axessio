"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { USER_ROLE_BADGE_VARIANT, USER_ROLE_LABELS } from "@/lib/constants";
import {
  assignProofreader,
  unassignProofreader,
} from "@/app/(dashboard)/audits/[uuid]/proofreaders/actions";
import type { UserRole } from "@/types/domain";

export interface ProofreaderEntry {
  profileId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: UserRole;
}

export interface ProofreaderCandidate {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: UserRole;
}

interface AuditProofreadersProps {
  auditId: string;
  proofreaders: ProofreaderEntry[];
  available: ProofreaderCandidate[];
  canManage: boolean;
}

function fullName(p: {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}): string {
  const name = [p.firstName, p.lastName]
    .filter((v) => v && v.trim().length > 0)
    .join(" ")
    .trim();
  return name || p.email || "—";
}

export function AuditProofreaders({
  auditId,
  proofreaders,
  available,
  canManage,
}: AuditProofreadersProps) {
  const t = useTranslations("audits.proofreaders");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);

  function submitAssign() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const result = await assignProofreader(auditId, selected);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setSelected("");
      router.refresh();
    });
  }

  function handleRemove(profileId: string) {
    setRemovingId(profileId);
    setError(null);
    startTransition(async () => {
      const result = await unassignProofreader(auditId, profileId);
      setRemovingId(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {proofreaders.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="space-y-2">
          {proofreaders.map((p) => (
            <li
              key={p.profileId}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <div
                  aria-hidden="true"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning"
                >
                  <Eye className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{fullName(p)}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.email}
                  </p>
                </div>
                <Badge
                  variant={USER_ROLE_BADGE_VARIANT[p.role]}
                  className="ml-1 h-5 px-1.5 text-[10px]"
                >
                  {USER_ROLE_LABELS[p.role]}
                </Badge>
              </div>
              {canManage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 shrink-0 p-0"
                  onClick={() => handleRemove(p.profileId)}
                  disabled={pending}
                  aria-label={t("removeAria", { name: fullName(p) })}
                >
                  {removingId === p.profileId ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {canManage && available.length > 0 && (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            {t("addCta")}
          </Button>

          <Dialog open={open} onOpenChange={(v) => !pending && setOpen(v)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("dialogTitle")}</DialogTitle>
                <DialogDescription>{t("dialogDesc")}</DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <Label htmlFor="proofreader-select">{t("selectLabel")}</Label>
                <Select value={selected} onValueChange={setSelected}>
                  <SelectTrigger id="proofreader-select">
                    <SelectValue placeholder={t("selectPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {available.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {fullName(p)} · {USER_ROLE_LABELS[p.role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="button"
                  onClick={submitAssign}
                  disabled={pending || !selected}
                >
                  {pending && (
                    <Loader2
                      className="mr-2 h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  {t("confirm")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
