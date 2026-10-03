import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

/**
 * Activation d'une opération destructrice (réinitialisation des données).
 *
 *.Parse volontairement en « fail-closed » : seule la chaîne exacte "true"
 * (insensible à la casse et aux espaces) active l'opération. Toute autre
 * valeur — variable absente, vide, "1", "yes", "false" — la laisse désactivée.
 * On n'utilise pas z.coerce.boolean() ici : il convertit en true n'importe
 * quelle chaîne non vide, y compris "false", ce qui ouvrirait par erreur une
 * fonctionnalité de destruction de données.
 */
const destructiveFeatureFlag = (defaultValue: boolean) =>
  z
    .string()
    .optional()
    .transform((value) => {
      if (value === undefined || value.trim() === "") {
        return defaultValue;
      }
      return value.trim().toLowerCase() === "true";
    });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().default("24h"),
  FRONTEND_URL: z.string().url(),
  // Réinitialisation des données transactionnelles et des comptes agents :
  // refusée par défaut. Le contrôle est effectué côté backend, indépendamment
  // de ce qu'affiche le frontend.
  ENABLE_DATA_RESET: destructiveFeatureFlag(false),
});

export const env = envSchema.parse(process.env);
