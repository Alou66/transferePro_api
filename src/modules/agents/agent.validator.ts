import { z } from "zod";

export const agentIdSchema = z.object({
  id: z.string().uuid("Identifiant utilisateur invalide"),
});

export const agentQuerySchema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "BLOCKED", "REFUSED"]).optional(),
  cityId: z.string().uuid("Identifiant de ville invalide").optional(),
  email: z.string().email("Email invalide").optional(),
  phone: z.string().optional(),
});
