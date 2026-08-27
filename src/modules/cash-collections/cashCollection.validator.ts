import { z } from "zod";

export const agentIdSchema = z.object({
  id: z.string().uuid("Identifiant d'agent invalide"),
});

export const createCashCollectionSchema = z.object({
  amount: z.coerce.number().positive("Le montant doit être supérieur à 0"),
  notes: z.string().optional(),
});

export const cashCollectionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
