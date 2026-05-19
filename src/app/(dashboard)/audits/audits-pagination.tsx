import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  /** 1-indexed. */
  currentPage: number;
  totalPages: number;
  total: number;
  from: number;
  to: number;
  /** URLSearchParams figés à passer aux liens — sans le param `page`. */
  baseParams: URLSearchParams;
  pathname: string;
}

export async function AuditsPagination({
  currentPage,
  totalPages,
  total,
  from,
  to,
  baseParams,
  pathname,
}: Props) {
  const t = await getTranslations("audits.list.pagination");

  const buildHref = (page: number): string => {
    const next = new URLSearchParams(baseParams.toString());
    if (page <= 1) next.delete("page");
    else next.set("page", String(page));
    const search = next.toString();
    return search ? `${pathname}?${search}` : pathname;
  };

  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  return (
    <nav
      aria-label={t("page", { current: currentPage, total: totalPages })}
      className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row"
    >
      <p
        className="text-xs text-muted-foreground tabular-nums"
        aria-live="polite"
      >
        {t("summary", { from, to, total })}
      </p>

      <div className="flex items-center gap-1">
        <PageButton
          href={buildHref(currentPage - 1)}
          disabled={prevDisabled}
          aria-label={t("previous")}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t("previous")}</span>
        </PageButton>

        <span className="px-2 text-xs font-medium tabular-nums">
          {t("page", { current: currentPage, total: totalPages })}
        </span>

        <PageButton
          href={buildHref(currentPage + 1)}
          disabled={nextDisabled}
          aria-label={t("next")}
        >
          <span className="hidden sm:inline">{t("next")}</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </PageButton>
      </div>
    </nav>
  );
}

function PageButton({
  href,
  disabled,
  children,
  ...props
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
} & React.AriaAttributes) {
  const className = cn(
    "inline-flex h-8 items-center gap-1 rounded-md border border-border px-2 text-xs font-medium",
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    disabled
      ? "cursor-not-allowed opacity-50"
      : "hover:bg-accent hover:text-foreground",
  );

  if (disabled) {
    return (
      <span aria-disabled="true" className={className} {...props}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={className} {...props}>
      {children}
    </Link>
  );
}
