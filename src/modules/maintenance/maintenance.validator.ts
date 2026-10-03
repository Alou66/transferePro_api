import { z } from "zod";

/**
 * Double confirmation de la réinitialisation des données.
 *
 * Le client doit renvoyer exactement la chaîne "RESET". La comparaison est
 * stricte : aucun trim, aucune normalisation de casse. Une saisie approximative
 * ("reset", "RESET ", "RESET!") est donc refusée, ce qui évite qu'un clic
 * involontaire suffise à déclencher une suppression.
 *
 * Ce contrôle est fait côté serveur : l'absence ou la désactivation du bouton
 * dans l'interface ne constitue en aucun cas une sécurité.
 */
export const resetDataSchema = z.object({
  confirmation: z.string().refine((value) => value === "RESET", {
    message: "Vous devez saisir exactement RESET pour confirmer la réinitialisation",
  }),
});