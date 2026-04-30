import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default async function ClientsPage() {
  const profile = await requireProfile();

  if (profile.role !== "auditor") {
    return (
      <div className="container mx-auto max-w-3xl p-6 md:p-8">
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
          Accès réservé aux auditeurs internes.
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, contract_start_at, has_subscription")
    .order("name");

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tous les clients</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(clients ?? []).map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-md border border-border p-3"
            >
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  Contrat depuis le {formatDate(c.contract_start_at)}
                </p>
              </div>
              {c.has_subscription && (
                <span className="rounded-md bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                  Abonnement actif
                </span>
              )}
            </div>
          ))}
          {(clients ?? []).length === 0 && (
            <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Aucun client.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
