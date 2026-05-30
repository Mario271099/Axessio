import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";

export default async function SettingsPage() {
  const profile = await requireProfile();
  const t = await getTranslations("settings");
  const tRoles = await getTranslations("roles");

  return (
    <div className="container mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>{profile.email}</span>
          <span aria-hidden="true">·</span>
          <Badge variant="secondary">{tRoles(profile.role)}</Badge>
        </div>
      </header>

      {/* Section Profil ------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("profileSection.title")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("profileSection.description")}
          </p>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initialFirstName={profile.firstName}
            initialLastName={profile.lastName}
            initialLanguage={profile.language}
            email={profile.email}
          />
        </CardContent>
      </Card>

      {/* Section Mot de passe ------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("passwordSection.title")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("passwordSection.description")}
          </p>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
