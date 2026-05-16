"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface FileDropZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  className?: string;
}

function fileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function FileDropZone({
  files,
  onFilesChange,
  accept = "image/png,image/jpeg,image/webp,application/pdf",
  maxSizeMB = 5,
  disabled = false,
  className,
}: FileDropZoneProps) {
  const t = useTranslations("fileDropZone");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatBytes = (size: number): string => {
    if (size < 1024) return t("bytes", { size });
    if (size < 1024 * 1024)
      return t("kilobytes", { size: (size / 1024).toFixed(1) });
    return t("megabytes", { size: (size / (1024 * 1024)).toFixed(1) });
  };

  const acceptedSet = useMemo(
    () =>
      new Set(
        accept
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    [accept],
  );

  const maxBytes = maxSizeMB * 1024 * 1024;

  const previews = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of files) {
      if (f.type.startsWith("image/")) {
        map.set(fileKey(f), URL.createObjectURL(f));
      }
    }
    return map;
  }, [files]);

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const validateAndAdd = (incoming: FileList | File[]) => {
    const list = Array.from(incoming);
    if (list.length === 0) return;

    const accepted: File[] = [];
    const errors: string[] = [];

    for (const file of list) {
      if (acceptedSet.size > 0 && !acceptedSet.has(file.type)) {
        errors.push(t("unsupportedFormat", { name: file.name }));
        continue;
      }
      if (file.size > maxBytes) {
        errors.push(t("tooLarge", { name: file.name, max: maxSizeMB }));
        continue;
      }
      accepted.push(file);
    }

    setError(errors.length > 0 ? errors.join(" ") : null);
    if (accepted.length > 0) {
      const existing = new Set(files.map((f) => fileKey(f)));
      const deduped = accepted.filter((f) => !existing.has(fileKey(f)));
      if (deduped.length > 0) onFilesChange([...files, ...deduped]);
    }
  };

  const openPicker = () => {
    if (disabled) return;
    setError(null);
    inputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAdd(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    if (!dragOver) setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setDragOver(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPicker();
    }
  };

  const handleRemove = (key: string) => {
    onFilesChange(files.filter((f) => fileKey(f) !== key));
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={t("dropZoneAria")}
        aria-disabled={disabled}
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 text-center transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          disabled && "cursor-not-allowed opacity-60",
          !disabled &&
            (dragOver
              ? "border-primary bg-primary/10"
              : "border-border bg-muted/30 hover:bg-muted/50 cursor-pointer"),
        )}
      >
        <Upload
          className={cn(
            "h-6 w-6",
            dragOver ? "text-primary" : "text-muted-foreground",
          )}
          aria-hidden="true"
        />
        <p className="text-sm">
          <span className="font-medium">{t("dropHint")}</span>
          <span className="text-muted-foreground">{t("clickHint")}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {t("fileTypes", { max: maxSizeMB })}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => {
          const picked = e.target.files;
          e.target.value = "";
          if (picked) validateAndAdd(picked);
        }}
        aria-hidden="true"
        tabIndex={-1}
      />

      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 p-2 text-xs text-destructive"
        >
          {error}
        </p>
      )}

      {files.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {files.map((file) => {
            const key = fileKey(file);
            const isImage = file.type.startsWith("image/");
            const previewUrl = previews.get(key);
            return (
              <li key={key} className="space-y-1.5">
                <div className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted">
                  {isImage && previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={file.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center text-xs text-muted-foreground">
                      <FileText className="h-8 w-8" aria-hidden="true" />
                      <span className="line-clamp-2 break-all">PDF</span>
                    </div>
                  )}
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute right-1.5 top-1.5 h-7 w-7 opacity-0 shadow transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(key);
                    }}
                    disabled={disabled}
                    aria-label={t("removeAria", { name: file.name })}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
                <p
                  className="truncate text-xs font-medium"
                  title={file.name}
                >
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
