// Route de test TEMPORAIRE pour vérifier la remontée d'erreurs vers Sentry.
// À SUPPRIMER une fois le test validé (cf. demande utilisateur).
//
// GET /api/sentry-test  → lève une exception non capturée que Sentry doit
// intercepter via l'instrumentation Next.js et faire apparaître dans le dashboard.

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  throw new Error("Sentry test — erreur volontaire (route /api/sentry-test)");

  // Inaccessible : présent uniquement pour le typage du handler.
  return NextResponse.json({ ok: true });
}
