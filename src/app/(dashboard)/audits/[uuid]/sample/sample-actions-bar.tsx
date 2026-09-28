"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Plus, Trash2, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  addPage,
  deletePage,
  updatePage,
  type ActionState,
} from "@/app/(dashboard)/audits/actions";
import { cn, monogram, themeColorVar } from "@/lib/utils";
import type { ComplexityLevel, PageType } from "@/types/domain";

interface PageData {
  id: string;
  name: string;
  url: string | null;
  page_type: PageType;
  complexity: ComplexityLevel | null;
}

interface Props {
  auditId: string;
  pages: PageData[];
  canEdit: boolean;
}

const initialState: ActionState = { error: null };

/** Ordre d'affichage des groupes, comme dans le rapport. */
const GROUPS: Array<{ type: PageType; titleKey: string; hintKey: string }> = [
  {
    type: "MANDATORY",
    titleKey: "groups.mandatory",
    hintKey: "groups.mandatoryHint",
  },
  {
    type: "REPRESENTATIVE",
    titleKey: "groups.representative",
    hintKey: "groups.representativeHint",
  },
  {
    type: "TRANSVERSAL",
    titleKey: "groups.transversal",
    hintKey: "groups.transversalHint",
  },
];

/**
 * Échantillon de l'audit : les pages groupées par type à gauche, le
 * formulaire d'ajout et le rappel de méthodologie à droite.
 */
export function SampleActionsBar({ auditId, pages, canEdit }: Props) {
  const t = useTranslations("audits.sample");
  const [editingPageId, setEditingPageId] = useState<string | null>(null);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex flex-col gap-4">
        {pages.length === 0 && (
          <p className="rounded-card border border-dashed border-border-strong p-8 text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        )}

        {GROUPS.map((group) => {
          const groupPages = pages.filter((p) => p.page_type === group.type);
          if (groupPages.length === 0) return null;
          return (
            <Card key={group.type} className="p-2.5">
              <div className="flex items-center gap-2.5 px-3 pb-2 pt-1.5">
                <h2 className="text-base font-extrabold">
                  {t(group.titleKey)}
                </h2>
                <Badge variant="secondary" size="count">
                  {groupPages.length}
                </Badge>
                <span className="ml-auto text-sm text-muted-foreground">
                  {t(group.hintKey)}
                </span>
              </div>

              <ul className="flex flex-col gap-0.5">
                {groupPages.map((p) =>
                  editingPageId === p.id ? (
                    <li key={p.id}>
                      <PageEditForm
                        page={p}
                        auditId={auditId}
                        onCancel={() => setEditingPageId(null)}
                        onSaved={() => setEditingPageId(null)}
                      />
                    </li>
                  ) : (
                    <li key={p.id}>
                      <PageRowItem
                        page={p}
                        auditId={auditId}
                        canEdit={canEdit}
                        onEdit={() => setEditingPageId(p.id)}
                      />
                    </li>
                  ),
                )}
              </ul>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col gap-4">
        {canEdit && <AddPageForm auditId={auditId} />}

        <Card tone="ink" className="p-5">
          <h2 className="text-base font-extrabold">{t("helpTitle")}</h2>
          <dl className="mt-2 space-y-2 text-sm leading-relaxed text-ink-muted">
            {(["mandatory", "representative", "transversal"] as const).map(
              (kind) => (
                <div key={kind}>
                  <dt className="inline font-bold text-ink-foreground">
                    {t(`pageTypesHelp.${kind}.label`)}{" "}
                  </dt>
                  <dd className="m-0 inline">
                    {t(`pageTypesHelp.${kind}.text`)}
                  </dd>
                </div>
              ),
            )}
          </dl>
        </Card>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function AddPageForm({ auditId }: { auditId: string }) {
  const t = useTranslations("audits.sample");
  const tComplexity = useTranslations("constants.complexity");
  const [addState, addAction, addPending] = useActionState(
    addPage.bind(null, auditId),
    initialState,
  );

  return (
    <Card className="p-5">
      <h2 className="text-base font-extrabold">{t("addPage")}</h2>
      <form action={addAction} className="mt-3 flex flex-col gap-3.5">
        {addState.error && (
          <p
            role="alert"
            className="rounded-row bg-destructive/10 p-3 text-sm font-semibold text-destructive"
          >
            {addState.error}
          </p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="page-name">{t("pageName")} *</Label>
          <Input
            id="page-name"
            name="name"
            required
            placeholder={t("pageNamePlaceholder")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="page-url">{t("pageUrl")}</Label>
          <Input
            id="page-url"
            name="url"
            type="url"
            placeholder={t("pageUrlPlaceholder")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="page-complexity">{t("complexity")}</Label>
          <Select name="complexity" defaultValue="NONE">
            <SelectTrigger id="page-complexity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">{t("complexityNone")}</SelectItem>
              <SelectItem value="ULTRA_SIMPLE">
                {tComplexity("ULTRA_SIMPLE")}
              </SelectItem>
              <SelectItem value="SIMPLE">{tComplexity("SIMPLE")}</SelectItem>
              <SelectItem value="MINIMAL">{tComplexity("MINIMAL")}</SelectItem>
              <SelectItem value="COMPLEX">{tComplexity("COMPLEX")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={addPending}>
          {addPending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              {t("adding")}
            </>
          ) : (
            <>
              <Plus data-anim="spin" aria-hidden="true" />
              {t("add")}
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}

function PageRowItem({
  page,
  auditId,
  canEdit,
  onEdit,
}: {
  page: PageData;
  auditId: string;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const t = useTranslations("audits.sample");
  const tCommon = useTranslations("common");
  const tComplexity = useTranslations("constants.complexity");
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isTransversal = page.page_type === "TRANSVERSAL";

  async function performDelete() {
    setPending(true);
    const result = await deletePage(page.id, auditId);
    setPending(false);
    setConfirmOpen(false);
    if (result.error) alert(t("errorPrefix", { message: result.error }));
  }

  return (
    <div className="axs-row group grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 rounded-row px-3 py-2">
      <span
        aria-hidden="true"
        className={cn(
          "axs-mono flex size-10 items-center justify-center rounded-row text-sm font-extrabold text-white",
        )}
        style={{
          background: isTransversal
            ? "hsl(var(--ink-surface))"
            : themeColorVar(page.name),
        }}
      >
        {monogram(page.name)}
      </span>

      <span className="min-w-0">
        <span className="block truncate font-bold">{page.name}</span>
        <PageUrlDisplay url={page.url} isTransversal={isTransversal} />
      </span>

      <span className="flex shrink-0 items-center gap-2">
        {page.complexity && (
          <Badge variant="secondary" size="sm">
            {tComplexity(page.complexity)}
          </Badge>
        )}

        {canEdit && !isTransversal && (
          <span className="flex gap-0.5 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100">
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={onEdit}
              aria-label={t("editAria", { name: page.name })}
            >
              <Pencil aria-hidden="true" />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => setConfirmOpen(true)}
              disabled={pending}
              aria-label={t("deleteAria", { name: page.name })}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 aria-hidden="true" />
            </Button>
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogContent>
                <AlertDialogHeader icon={<Trash2 aria-hidden="true" />}>
                  <AlertDialogTitle>{t("confirmDeleteTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("confirmDelete", { name: page.name })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={pending}>
                    {tCommon("cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={pending}
                    onClick={(e) => {
                      // Empêche la fermeture auto du AlertDialog avant que
                      // la requête de suppression ait fini.
                      e.preventDefault();
                      void performDelete();
                    }}
                  >
                    {tCommon("delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </span>
        )}
      </span>
    </div>
  );
}

function PageUrlDisplay({
  url,
  isTransversal,
}: {
  url: string | null;
  isTransversal: boolean;
}) {
  const t = useTranslations("audits.sample");
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="block truncate text-sm text-muted-foreground hover:text-primary hover:underline"
      >
        {url}
      </a>
    );
  }
  if (!isTransversal) {
    return (
      <span className="block text-sm italic text-muted-foreground">
        {t("noUrl")}
      </span>
    );
  }
  return null;
}

function PageEditForm({
  page,
  auditId,
  onCancel,
  onSaved,
}: {
  page: PageData;
  auditId: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("audits.sample");
  const tComplexity = useTranslations("constants.complexity");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await updatePage(page.id, auditId, formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
    } else {
      onSaved();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3.5 rounded-row border border-primary bg-primary-softer p-4"
    >
      {error && (
        <p
          role="alert"
          className="rounded-row bg-destructive/10 p-3 text-sm font-semibold text-destructive"
        >
          {error}
        </p>
      )}

      <div className="grid gap-3.5 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`name-${page.id}`}>{t("pageName")} *</Label>
          <Input
            id={`name-${page.id}`}
            name="name"
            required
            defaultValue={page.name}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`complexity-${page.id}`}>{t("complexity")}</Label>
          <Select name="complexity" defaultValue={page.complexity ?? "NONE"}>
            <SelectTrigger id={`complexity-${page.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">{t("complexityNone")}</SelectItem>
              <SelectItem value="ULTRA_SIMPLE">
                {tComplexity("ULTRA_SIMPLE")}
              </SelectItem>
              <SelectItem value="SIMPLE">{tComplexity("SIMPLE")}</SelectItem>
              <SelectItem value="MINIMAL">{tComplexity("MINIMAL")}</SelectItem>
              <SelectItem value="COMPLEX">{tComplexity("COMPLEX")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`url-${page.id}`}>{t("pageUrl")}</Label>
        <Input
          id={`url-${page.id}`}
          name="url"
          type="url"
          defaultValue={page.url ?? ""}
          placeholder={t("pageUrlPlaceholder")}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              {t("saving")}
            </>
          ) : (
            t("save")
          )}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          <X aria-hidden="true" />
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
