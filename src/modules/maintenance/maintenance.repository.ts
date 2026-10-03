import { UserRole } from "@prisma/client";
import { prisma } from "../../config/database";

/**
 * Client de transaction fourni par `prisma.$transaction(async tx => ...)`.
 *
 * Il est dérivé du client réel plutôt que typé `Prisma.TransactionClient` :
 * `src/config/database.ts` utilise `$extends` pour ajouter une relance sur les
 * coupures réseau transitoires, ce qui change la signature des delegates de
 * modèle. Un client étendu n'est donc pas assignable au TransactionClient de
 * base, alors qu'il est exactement ce que la transaction interactive fournit.
 */
export type MaintenanceTransactionClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Opérations de la réinitialisation des données.
 *
 * Toutes les suppressions passent par `deleteMany`, et toutes exigent un
 * client de transaction explicite : aucune de ces requêtes ne doit pouvoir
 * être exécutée en dehors de la transaction pilotée par
 * `MaintenanceService.resetTransactionalData`. Aucune n'utilise `TRUNCATE`,
 * qui refuse les contraintes de clé étrangère sans `CASCADE` et échappe à
 * l'annulation par une transaction applicative.
 *
 * L'ordre des appels est imposé par les clés étrangères `ON DELETE RESTRICT` :
 * `cash_collections` et `transfers` référencent toutes deux `users`.
 */
export const maintenanceRepository = {
  /**
   * Encaissements d'espèces : données 100 % transactionnelles, sans aucune
   * référence entrante. À purger avant les transferts et les comptes agents.
   */
  deleteAllCashCollections: (tx: MaintenanceTransactionClient) =>
    tx.cashCollection.deleteMany({}),

  /**
   * Transferts : données 100 % transactionnelles (contenu des transferts,
   * bénéficiaires, paiements). Aucune référence entrante.
   */
  deleteAllTransfers: (tx: MaintenanceTransactionClient) =>
    tx.transfer.deleteMany({}),

  /**
   * Comptes agents.
   *
   * Le filtre `role: AGENT` est la protection essentielle de cette
   * fonctionnalité : il garantit qu'aucun compte administrateur ne peut être
   * supprimé. Il ne doit jamais être omis ni remplacé par un `deleteMany({})`
   * sans condition, qui viderait `users` y compris l'admin connecté.
   */
  deleteAllAgents: (tx: MaintenanceTransactionClient) =>
    tx.user.deleteMany({ where: { role: UserRole.AGENT } }),

  /**
   * Relit le compte à l'origine de la requête pour vérifier, dans la
   * transaction, qu'il est toujours présent et toujours administrateur après
   * les suppressions. Si ce contrôle échoue, la transaction est annulée : on ne
   * valide jamais une réinitialisation qui aurait verrouillé l'accès à
   * l'administration.
   */
  findAdminById: (id: string, tx: MaintenanceTransactionClient) =>
    tx.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        status: true,
      },
    }),
};