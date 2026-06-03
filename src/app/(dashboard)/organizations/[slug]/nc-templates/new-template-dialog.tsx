"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createNCTemplate } from "./actions";
import { TemplateForm, type TemplateFormReference } from "./template-form";

interface Props {
  organizationId: string;
  references: TemplateFormReference[];
}

export function NewTemplateDialog({ organizationId, references }: Props) {
  const t = useTranslations("organizations.ncTemplates");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const FORM_ID = "new-nc-template-form";

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createNCTemplate(organizationId, formData);
      if (res.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("newCta")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("newTitle")}</DialogTitle>
          <DialogDescription>{t("newDesc")}</DialogDescription>
        </DialogHeader>
        {error && (
          <p
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <TemplateForm
          formId={FORM_ID}
          references={references}
          onSubmit={submit}
        />
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            {t("cancel")}
          </Button>
          <Button type="submit" form={FORM_ID} disabled={pending} className="gap-2">
            {pending && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
