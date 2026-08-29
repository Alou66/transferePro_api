import { Prisma, PrismaClient } from "@prisma/client";

// Codes Prisma correspondant à des coupures réseau transitoires (pas des
// erreurs métier) : la base est momentanément injoignable/lente, pas en panne.
const RETRYABLE_ERROR_CODES = new Set(["P1001", "P1002", "P1017"]);
// Neon (serverless) suspend son compute après inactivité et le réveil peut
// prendre plusieurs secondes : la fenêtre de retry doit être assez large pour
// couvrir ce cold start, pas juste une coupure réseau transitoire.
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 1000;

function isRetryableError(error: unknown): boolean {
  // Erreur levée quand le moteur Prisma n'a pas encore réussi à établir la
  // connexion (ex: tout premier appel après un (re)démarrage du serveur).
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    RETRYABLE_ERROR_CODES.has(error.code)
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const basePrisma = new PrismaClient();

export const prisma = basePrisma.$extends({
  query: {
    async $allOperations({ args, query }) {
      for (let attempt = 1; ; attempt++) {
        try {
          return await query(args);
        } catch (error) {
          if (!isRetryableError(error) || attempt >= MAX_RETRIES) {
            throw error;
          }
          console.warn(`Connexion base de données instable, nouvelle tentative (${attempt}/${MAX_RETRIES - 1})...`);
          await wait(RETRY_DELAY_MS * attempt);
        }
      }
    },
  },
});
