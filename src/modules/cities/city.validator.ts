import { z } from "zod";

export const createCitySchema = z.object({
  name: z.string().trim().min(1, "Le nom de la ville est requis"),
});

export const updateCitySchema = z.object({
  name: z.string().trim().min(1, "Le nom de la ville est requis"),
});

export const cityIdSchema = z.object({
  id: z.string().uuid("Identifiant de ville invalide"),
});
