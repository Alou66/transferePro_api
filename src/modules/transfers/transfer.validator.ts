import { z } from "zod";

/**
 * Champ téléphone facultatif.
 *
 * La valeur peut être absente (undefined), nulle (null) ou vide ("" / espaces).
 * Ces trois cas sont normalisés en chaîne vide afin de respecter la colonne
 * TEXT NOT NULL existante en base : aucune migration ni perte de données n'est
 * nécessaire. La validation existante est conservée dès que le téléphone est
 * réellement renseigné (il ne peut pas être composé uniquement d'espaces).
 */
const optionalPhoneSchema = (requiredMessage: string) =>
  z.preprocess(
    (value) => {
      if (value === undefined || value === null) return null;
      return typeof value === "string" && value.trim() === "" ? null : value;
    },
    z
      .string()
      .trim()
      .min(1, requiredMessage)
      .nullable()
      .optional()
      .transform((value) => value ?? ""),
  );

export const createTransferSchema = z.object({
  senderName: z.string().min(1, "Le nom de l'expéditeur est requis"),
  senderPhone: optionalPhoneSchema("Le téléphone de l'expéditeur doit contenir au moins un caractère"),
  recipientName: z.string().min(1, "Le nom du bénéficiaire est requis"),
  recipientPhone: optionalPhoneSchema("Le téléphone du bénéficiaire doit contenir au moins un caractère"),
  amount: z.coerce.number().min(1000, "Le montant minimum est de 1000 FCFA"),
  destinationCityId: z.string().uuid("Identifiant de ville invalide"),
});

export const transferIdSchema = z.object({
  id: z.string().uuid("Identifiant de transfert invalide"),
});

export const agentIdSchema = z.object({
  agentId: z.string().uuid("Identifiant d'agent invalide"),
});

const transferStatusEnum = z.enum(["CREATED", "READY_FOR_PAYMENT", "PAID", "CANCELLED"]);

export const listTransfersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: transferStatusEnum.optional(),
});

// Accepte une liste de statuts séparés par des virgules (ex: "CREATED,READY_FOR_PAYMENT")
// pour permettre de filtrer une file de travail sur plusieurs statuts en une seule requête.
const transferStatusListSchema = z.preprocess((val) => {
  if (typeof val !== "string") return val;

  const values = val
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return values.length > 0 ? values : undefined;
}, z.array(transferStatusEnum).optional());

export const incomingTransfersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: transferStatusListSchema,
});

export const verifyWithdrawalCodeSchema = z.object({
  withdrawalCode: z.string().length(4, "Le code de retrait doit contenir exactement 4 chiffres"),
});
