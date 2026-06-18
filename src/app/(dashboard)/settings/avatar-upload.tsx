"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, Camera, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deleteAvatar, uploadAvatar } from "./actions";

interface Props {
  initialAvatarUrl: string | null;
  initials: string;
}

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ACCEPT = "image/png,image/jpeg,image/webp";

export function AvatarUpload({ initialAvatarUrl, initials }: Props) {
  const t = useTranslations("settings.avatarSection");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  const triggerPicker = () => inputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation côté client en miroir du serveur - feedback immédiat.
    if (file.size > MAX_AVATAR_SIZE) {
      setFeedback({ kind: "error", message: t("errorTooLarge") });
      e.target.value = "";
      return;
    }
    if (!ACCEPT.split(",").includes(file.type)) {
      setFeedback({ kind: "error", message: t("errorBadType") });
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);
    setFeedback(null);
    startTransition(async () => {
      const res = await uploadAvatar(formData);
      if (res.error) {
        setFeedback({ kind: "error", message: res.error });
        return;
      }
      setAvatarUrl(res.avatarUrl ?? null);
      setFeedback({ kind: "success", message: t("success") });
      router.refresh();
    });
    e.target.value = "";
  };

  const onDelete = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await deleteAvatar();
      if (res.error) {
        setFeedback({ kind: "error", message: res.error });
        return;
      }
      setAvatarUrl(null);
      setFeedback({ kind: "success", message: t("deleteSuccess") });
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div
          aria-hidden="true"
          className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xl font-semibold text-primary"
        >
          {avatarUrl ? (
            // Image is intentionally rendered without next/image - avatars
            // come from Supabase Storage with cache-busting UUIDs in the URL.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            initials || "?"
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            onChange={onFileChange}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={triggerPicker}
            disabled={pending}
            className="gap-1.5"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Camera className="h-4 w-4" aria-hidden="true" />
            )}
            {avatarUrl ? t("replace") : t("upload")}
          </Button>
          {avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={pending}
              className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {t("delete")}
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{t("hint")}</p>

      {feedback && (
        <p
          role={feedback.kind === "error" ? "alert" : "status"}
          className={cn(
            "inline-flex items-start gap-2 rounded-md p-3 text-sm",
            feedback.kind === "error"
              ? "bg-destructive/10 text-destructive"
              : "bg-success/10 text-success",
          )}
        >
          {feedback.kind === "error" && (
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
          )}
          <span>{feedback.message}</span>
        </p>
      )}
    </div>
  );
}
