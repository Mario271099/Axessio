import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const profile = await requireProfile();
  const t = await getTranslations("settings");
  const tRoles = await getTranslations("roles");

  return (
    <div className="container mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("myProfile")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row
            label={t("name")}
            value={`${profile.firstName} ${profile.lastName}`}
          />
          <Row label={t("email")} value={profile.email} />
          <Row label={t("role")} value={tRoles(profile.role)} />
          <Row
            label={t("language")}
            value={profile.language === "fr" ? t("languageFr") : t("languageEn")}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
