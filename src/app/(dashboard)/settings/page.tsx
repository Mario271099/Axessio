import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";
import { AvatarUpload } from "./avatar-upload";
import { DeleteAccountForm } from "./delete-account-form";
import { NotificationPreferencesForm } from "./notification-preferences-form";
import { MfaSection } from "./mfa-section";
import { getMfaStatus, getNotificationPreferences } from "./actions";

function buildInitials(firstName: string, lastName: string, email: string) {
  const first = firstName?.trim()[0] ?? "";
  const last = lastName?.trim()[0] ?? "";
  if (first || last) return `${first}${last}`.toUpperCase();
  return (email[0] ?? "?").toUpperCase();
}

export default async function SettingsPage() {
  const profile = await requireProfile();
  const t = await getTranslations("settings");
  const tRoles = await getTranslations("roles");

  const initials = buildInitials(
    profile.firstName,
    profile.lastName,
    profile.email,
  );

  const [notificationPreferences, mfaStatus] = await Promise.all([
    getNotificationPreferences(),
    getMfaStatus(),
  ]);

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

      {/* Section Avatar ------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("avatarSection.title")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("avatarSection.description")}
          </p>
        </CardHeader>
        <CardContent>
          <AvatarUpload
            initialAvatarUrl={profile.avatarUrl}
            initials={initials}
          />
        </CardContent>
      </Card>

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

      {/* Section 2FA ---------------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("mfaSection.title")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("mfaSection.description")}
          </p>
        </CardHeader>
        <CardContent>
          <MfaSection
            initialEnabled={mfaStatus.enabled}
            initialFactorId={mfaStatus.factorId}
          />
        </CardContent>
      </Card>

      {/* Section Notifications ----------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("notificationsSection.title")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("notificationsSection.description")}
          </p>
        </CardHeader>
        <CardContent>
          <NotificationPreferencesForm
            initialPreferences={notificationPreferences}
          />
        </CardContent>
      </Card>

      {/* Section Danger zone -------------------------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("dangerZone.section")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("dangerZone.sectionDescription")}
          </p>
        </CardHeader>
        <CardContent>
          <DeleteAccountForm email={profile.email} />
        </CardContent>
      </Card>
    </div>
  );
}
