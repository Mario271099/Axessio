"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { postReviewComment } from "@/app/(dashboard)/audits/[uuid]/review-comments/actions";

interface ReviewCommentFormProps {
  auditId: string;
}

const MAX_LENGTH = 4000;

export function ReviewCommentForm({ auditId }: ReviewCommentFormProps) {
  const t = useTranslations("audits.reviewComments");
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    const trimmed = body.trim();
    if (!trimmed) return;
    setError(null);
    startTransition(async () => {
      const result = await postReviewComment(auditId, trimmed);
      if (result.error) {
        setError(result.error);
        return;
      }
      setBody("");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-2"
    >
      <Label htmlFor="review-comment-body" className="text-xs text-muted-foreground">
        {t("label")}
      </Label>
      <Textarea
        id="review-comment-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t("placeholder")}
        rows={3}
        maxLength={MAX_LENGTH}
        disabled={pending}
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{t("hint")}</p>
        <Button
          type="submit"
          size="sm"
          className="gap-2"
          disabled={pending || body.trim().length === 0}
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {t("submit")}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
