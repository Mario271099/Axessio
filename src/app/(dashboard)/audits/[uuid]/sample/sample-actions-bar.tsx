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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  addPage,
  deletePage,
  updatePage,
  type ActionState,
} from "@/app/(dashboard)/audits/actions";
import { cn } from "@/lib/utils";
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

export function SampleActionsBar({ auditId, pages, canEdit }: Props) {
  const t = useTranslations("audits.sample");
  const tComplexity = useTranslations("constants.complexity");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);

  const [addState, addAction, addPending] = useActionState(
    addPage.bind(null, auditId),
    initialState,
  );

  if (addState.success && showAddForm) {
    setShowAddForm(false);
  }

  return (
    <div className="space-y-4">
      {canEdit && !showAddForm && (
        <Button onClick={() => setShowAddForm(true)} size="sm">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("addPage")}
        </Button>
      )}

      {showAddForm && (
        <Card>
          <CardContent className="pt-6">
            <form action={addAction} className="space-y-4">
              {addState.error && (
                <p
                  role="alert"
                  className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {addState.error}
                </p>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="page-name">{t("pageName")} *</Label>
                  <Input
                    id="page-name"
                    name="name"
                    required
                    placeholder={t("pageNamePlaceholder")}
                  />
                </div>

                <div className="space-y-2">
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
                      <SelectItem value="SIMPLE">
                        {tComplexity("SIMPLE")}
                      </SelectItem>
                      <SelectItem value="MINIMAL">
                        {tComplexity("MINIMAL")}
                      </SelectItem>
                      <SelectItem value="COMPLEX">
                        {tComplexity("COMPLEX")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="page-url">{t("pageUrl")}</Label>
                <Input
                  id="page-url"
                  name="url"
                  type="url"
                  placeholder={t("pageUrlPlaceholder")}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={addPending}>
                  {addPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("adding")}
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      {t("add")}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAddForm(false)}
                >
                  {t("cancel")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {pages.map((p) => {
          if (editingPageId === p.id) {
            return (
              <PageEditForm
                key={p.id}
                page={p}
                auditId={auditId}
                onCancel={() => setEditingPageId(null)}
                onSaved={() => setEditingPageId(null)}
              />
            );
          }
          return (
            <PageRowItem
              key={p.id}
              page={p}
              auditId={auditId}
              canEdit={canEdit}
              onEdit={() => setEditingPageId(p.id)}
            />
          );
        })}

        {pages.length === 0 && (
          <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        )}
      </div>
    </div>
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
  const tPageType = useTranslations("constants.pageType");
  const tComplexity = useTranslations("constants.complexity");
  const [pending, setPending] = useState(false);
  const isTransversal = page.page_type === "TRANSVERSAL";

  async function handleDelete() {
    const ok = confirm(t("confirmDelete", { name: page.name }));
    if (!ok) return;
    setPending(true);
    const result = await deletePage(page.id, auditId);
    setPending(false);
    if (result.error) alert(t("errorPrefix", { message: result.error }));
  }

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 rounded-md border border-border p-3",
        isTransversal && "border-dashed bg-muted/30",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium">{page.name}</p>
        <PageUrlDisplay url={page.url} isTransversal={isTransversal} />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="flex flex-col items-end gap-1.5">
          <Badge variant="outline">{tPageType(page.page_type)}</Badge>
          {page.complexity && (
            <Badge variant="muted">{tComplexity(page.complexity)}</Badge>
          )}
        </div>

        {canEdit && !isTransversal && (
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={onEdit}
              aria-label={t("editAria", { name: page.name })}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDelete}
              disabled={pending}
              aria-label={t("deleteAria", { name: page.name })}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
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
        className="truncate text-xs text-primary hover:underline"
      >
        {url}
      </a>
    );
  }
  if (!isTransversal) {
    return (
      <p className="text-xs italic text-muted-foreground">{t("noUrl")}</p>
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
    <Card className="border-primary/40 ring-1 ring-primary/20">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`name-${page.id}`}>{t("pageName")} *</Label>
              <Input
                id={`name-${page.id}`}
                name="name"
                required
                defaultValue={page.name}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`complexity-${page.id}`}>{t("complexity")}</Label>
              <Select
                name="complexity"
                defaultValue={page.complexity ?? "NONE"}
              >
                <SelectTrigger id={`complexity-${page.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">{t("complexityNone")}</SelectItem>
                  <SelectItem value="ULTRA_SIMPLE">
                    {tComplexity("ULTRA_SIMPLE")}
                  </SelectItem>
                  <SelectItem value="SIMPLE">
                    {tComplexity("SIMPLE")}
                  </SelectItem>
                  <SelectItem value="MINIMAL">
                    {tComplexity("MINIMAL")}
                  </SelectItem>
                  <SelectItem value="COMPLEX">
                    {tComplexity("COMPLEX")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
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
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                t("save")
              )}
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              <X className="h-4 w-4" />
              {t("cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
