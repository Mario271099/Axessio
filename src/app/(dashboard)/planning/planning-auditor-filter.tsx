"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Users } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PlanningAuditorFilterProps {
  auditors: Array<{ id: string; label: string }>;
  currentAuditor: string | null;
  /** Conservé dans la nouvelle URL pour ne pas perdre la nav mensuelle. */
  month: string;
}

const ALL_VALUE = "all";

export function PlanningAuditorFilter({
  auditors,
  currentAuditor,
  month,
}: PlanningAuditorFilterProps) {
  const router = useRouter();
  const t = useTranslations("planning.filter");

  function onChange(value: string) {
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    if (value !== ALL_VALUE) params.set("auditor", value);
    router.push(`/planning?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-1.5 sm:min-w-[260px]">
      <Label
        htmlFor="planning-auditor-filter"
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <Users className="h-3.5 w-3.5" aria-hidden="true" />
        {t("label")}
      </Label>
      <Select value={currentAuditor ?? ALL_VALUE} onValueChange={onChange}>
        <SelectTrigger id="planning-auditor-filter">
          <SelectValue placeholder={t("placeholder")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>{t("all")}</SelectItem>
          {auditors.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
