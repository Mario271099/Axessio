import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="max-w-md space-y-4 text-center">
        <p className="text-sm font-mono text-muted-foreground">{t("code")}</p>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        <Button asChild>
          <Link href="/dashboard">{t("cta")}</Link>
        </Button>
      </div>
    </main>
  );
}
