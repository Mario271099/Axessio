"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { switchOrganization } from "./actions";

interface SwitchOrgButtonProps {
  organizationId: string;
}

export function SwitchOrgButton({ organizationId }: SwitchOrgButtonProps) {
  const t = useTranslations("organizations");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-1.5"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await switchOrganization(organizationId);
          if (!result.error) router.refresh();
        });
      }}
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {t("switchCta")}
    </Button>
  );
}
