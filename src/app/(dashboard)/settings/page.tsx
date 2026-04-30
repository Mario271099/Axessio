import { requireProfile } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { USER_ROLE_LABELS } from "@/lib/constants";

export default async function SettingsPage() {
  const profile = await requireProfile();

  return (
    <div className="container mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mon profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Nom" value={`${profile.firstName} ${profile.lastName}`} />
          <Row label="Email" value={profile.email} />
          <Row label="Rôle" value={USER_ROLE_LABELS[profile.role]} />
          <Row label="Langue" value={profile.language === "fr" ? "Français" : "English"} />
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
