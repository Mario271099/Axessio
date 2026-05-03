"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NC_SEVERITY_LABELS } from "@/lib/constants";
import { createNonConformity } from "./actions";
import type { AuditPage, Criterion, NCSeverity } from "@/types/domain";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auditId: string;
  page: AuditPage;
  criterion: Criterion;
  onCreated: (criteriaId: string, pageId: string) => void;
}

export function NonConformityModal({
  open,
  onOpenChange,
  auditId,
  page,
  criterion,
  onCreated,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [severity, setSeverity] = useState<NCSeverity>("MEDIUM");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setTitle("");
    setDescription("");
    setRecommendation("");
    setSeverity("MEDIUM");
    setError(null);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Le titre est requis.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await createNonConformity(auditId, page.id, criterion.id, {
        title: title.trim(),
        description: description.trim() || null,
        recommendation: recommendation.trim() || null,
        severity,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      reset();
      onCreated(criterion.id, page.id);
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Créer une non-conformité</DialogTitle>
          <DialogDescription className="space-y-1">
            <span className="block">
              <span className="font-mono text-xs">
                Critère {criterion.identifier}
              </span>
              <span className="ml-2">{criterion.name}</span>
            </span>
            <span className="block text-xs">Page : {page.name}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="nc-title">Titre *</Label>
            <Input
              id="nc-title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              placeholder="Ex : Lien sans intitulé dans le pied de page"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nc-description">Description</Label>
            <Textarea
              id="nc-description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Décrire le problème observé."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nc-recommendation">Recommandation</Label>
            <Textarea
              id="nc-recommendation"
              name="recommendation"
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              rows={3}
              placeholder="Décrire la correction attendue."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nc-severity">Sévérité</Label>
            <Select
              name="severity"
              value={severity}
              onValueChange={(v) => setSeverity(v as NCSeverity)}
            >
              <SelectTrigger id="nc-severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">{NC_SEVERITY_LABELS.LOW}</SelectItem>
                <SelectItem value="MEDIUM">
                  {NC_SEVERITY_LABELS.MEDIUM}
                </SelectItem>
                <SelectItem value="HIGH">{NC_SEVERITY_LABELS.HIGH}</SelectItem>
                <SelectItem value="CRITICAL">
                  {NC_SEVERITY_LABELS.CRITICAL}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleClose(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              Créer la NC
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
