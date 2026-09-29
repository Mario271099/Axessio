import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { STORAGE_KEY } from "./storage-key";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: STORAGE_KEY,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // CRITIQUE : ne RIEN exécuter entre createServerClient et getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Si l'utilisateur est connecté → on laisse passer partout, sans aucune redirection.
  if (user) {
    return response;
  }

  // Pas connecté : seuls les espaces privés redirigent vers /login. Tout le
  // reste passe (pages marketing/légales, auth, images OG générées sans
  // extension comme /opengraph-image, et URL inconnues qui doivent tomber sur
  // la page 404 plutôt que sur /login - sinon Google y voit des "soft 404").
  // Les layouts privés re-vérifient la session via requireProfile() : ce
  // proxy n'est qu'un premier filtre. Tout nouvel espace privé doit être
  // ajouté ici.
  if (!isPrivateRoute(pathname)) {
    return response;
  }

  // Pas connecté + route privée → /login
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

const PRIVATE_PREFIXES = [
  "/dashboard",
  "/admin",
  "/audits",
  "/clients",
  "/projects",
  "/users",
  "/settings",
  "/notifications",
  "/organizations",
  "/planning",
  "/onboarding",
  // Les crons, webhooks et /api/v1 s'authentifient par Bearer dans leur
  // handler : ils ne doivent jamais être redirigés (cf. CLAUDE.md #10).
  "/api/audits",
];

export function isPrivateRoute(pathname: string): boolean {
  return PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
