/**
 * Nom du cookie / clé de stockage utilisé par Supabase pour la session.
 * On force un nom explicite pour que les 3 environnements (navigateur,
 * Server Components, middleware) lisent et écrivent au même endroit.
 */
export const STORAGE_KEY = "axessio-auth";
