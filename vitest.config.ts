import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    globals: false,
    // Workaround Vitest 4 sur Windows : le pool `threads` par défaut peut
    // déclencher des erreurs « Cannot read properties of undefined (reading
    // 'config') » en exécution parallèle. `forks` (processus enfants) est
    // plus stable au prix d'un démarrage légèrement plus lent.
    pool: "forks",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
