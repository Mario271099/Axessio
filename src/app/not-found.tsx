import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="max-w-md space-y-4 text-center">
        <p className="text-sm font-mono text-muted-foreground">404</p>
        <h1 className="text-2xl font-semibold">Page introuvable</h1>
        <p className="text-sm text-muted-foreground">
          La ressource demandée n&apos;existe pas ou vous n&apos;y avez pas accès.
        </p>
        <Button asChild>
          <Link href="/dashboard">Retour au tableau de bord</Link>
        </Button>
      </div>
    </main>
  );
}
