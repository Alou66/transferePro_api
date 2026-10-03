import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],

    // Variables d'environnement injectées avant tout import de l'application.
    //
    // Elles sont volontairement factices : `src/config/env.ts` valide
    // process.env au chargement de n'importe quel module, y compris via
    // src/app.ts. Aucune connexion n'est ouverte : le module
    // src/config/database est remplacé par un double de test dans chaque
    // fichier de test (cf. tests/maintenance.test.ts), donc la base de
    // données de production n'est jamais sollicitée.
    //
    // ENABLE_DATA_RESET n'est pas défini ici : il est piloté test par test avec
    // vi.stubEnv(), puisque src/config/env.ts est évalué une seule fois au
    // chargement du module.
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://test:test@localhost:5432/transferepro_test",
      JWT_SECRET: "test-jwt-secret",
      JWT_EXPIRES_IN: "24h",
      FRONTEND_URL: "http://localhost:5173",
    },
  },
});