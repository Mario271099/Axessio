// Configuration ESLint (flat config, ESLint 9).
//
// `next lint` a été supprimé de Next 16 : le lint passe désormais par la CLI
// ESLint directement (`npm run lint`). eslint-config-next 16 exporte des flat
// configs natives - pas besoin de FlatCompat.

import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    // Ignorés globaux : build, rapports de tests, et le fichier de types
    // généré par `supabase gen types` (jamais édité à la main).
    ignores: [
      ".next/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "verify-screenshots/**",
      "next-env.d.ts",
      "src/types/database.ts",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Règle stricte arrivée avec react-hooks v6 (ère React Compiler) : elle
      // interdit tout setState synchrone dans un effet. Le codebase utilise
      // plusieurs patterns légitimes qui la déclenchent (flag `mounted` pour
      // l'hydratation next-themes, lecture de localStorage au montage). On la
      // garde visible en warning comme dette de refactor - ne PAS ajouter de
      // nouvelles occurrences.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default eslintConfig;
