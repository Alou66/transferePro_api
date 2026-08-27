import { z } from "zod";

export const createTransferSchema = z.object({
  senderName: z.string().min(1, "Le nom de l'expéditeur est requis"),
  senderPhone: z.string().min(1, "Le téléphone de l'expéditeur est requis"),
  recipientName: z.string().min(1, "Le nom du bénéficiaire est requis"),
  recipientPhone: z.string().min(1, "Le téléphone du bénéficiaire est requis"),
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
