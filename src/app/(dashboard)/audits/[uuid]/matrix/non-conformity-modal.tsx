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
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { NC_SEVERITY_LABELS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { addAttachment } from "@/app/(dashboard)/audits/[uuid]/anomalies/[ncId]/actions";
import { createNonConformity } from "./actions";
import type { AuditPage, Criterion, NCSeverity } from "@/types/domain";

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

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
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setTitle("");
    setDescription("");
    setRecommendation("");
    setSeverity("MEDIUM");
    setFiles([]);
    setError(null);
    setWarning(null);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const uploadFiles = async (ncId: string): Promise<string[]> => {
    if (files.length === 0) return [];
    const supabase = createClient();
    const failures: string[] = [];

    for (const file of files) {
      const fallbackExt = MIME_TO_EXT[file.type] ?? "bin";
      const nameExt = file.name.includes(".")
        ? file.name.split(".").pop()!.toLowerCase()
        : null;
      const ext = nameExt && nameExt.length <= 5 ? nameExt : fallbackExt;
      const path = `${auditId}/${ncId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("nc-attachments")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadErr) {
        failures.push(`${file.name}: ${uploadErr.message}`);
        continue;
      }

      const result = await addAttachment(
        ncId,
        auditId,
        path,
        file.name,
        file.size,
        file.type,
      );
      if (result.error) {
        // Best-effort : on tente de retirer le fichier orphelin du bucket.
        await supabase.storage.from("nc-attachments").remove([path]);
        failures.push(`${file.name}: ${result.error}`);
      }
    }

    return failures;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Le titre est requis.");
      return;
    }
    setError(null);
    setWarning(null);

    startTransition(async () => {
      const result = await createNonConformity(auditId, page.id, criterion.id, {
        title: title.trim(),
        description: description.trim() || null,
        recommendation: recommendation.trim() || null,
        severity,
      });
      if (result.error || !result.ncId) {
        setError(result.error ?? "Échec de la création.");
        return;
      }

      const failures = await uploadFiles(result.ncId);
      if (failures.length > 0) {
        // La NC est créée — on garde la modale ouverte pour informer.
        setWarning(
          `Non-conformité créée, mais ${failures.length} capture(s) en erreur : ${failures.join(" ; ")}`,
        );
        // On purge les fichiers déjà tentés pour éviter un double upload si
        // l'utilisateur clique à nouveau.
        setFiles([]);
        onCreated(criterion.id, page.id);
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

          {warning && (
            <p
              role="alert"
              className="rounded-md bg-warning/10 p-3 text-sm text-warning"
            >
              {warning}
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

          <div className="space-y-2">
            <Label>Captures d&apos;écran</Label>
            <FileDropZone
              files={files}
              onFilesChange={setFiles}
              accept="image/png,image/jpeg,image/webp,application/pdf"
              maxSizeMB={5}
              disabled={isPending}
            />
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
