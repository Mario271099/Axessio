// Stub du package `server-only` pour les tests vitest. Le vrai module
// jette à l'import quand il n'est pas chargé en contexte React Server
// Components - comportement souhaité en prod, mais non testable en Node.
// Cf. vitest.config.ts (resolve.alias).
export {};
