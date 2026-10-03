import { UserRole } from "@prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../config/database";
import { AppError } from "../../types/errors";
import { maintenanceRepository } from "./maintenance.repository";

const AUDIT_ACTION = "RESET_TRANSACTIONAL_DATA";

/**
 * Journalisation de l'opération.
 *
 * Le projet n'a pas de système d'audit en base : on suit donc la convention
 * existante, qui est un simple `console.log`/`console.error` (cf. database.ts et
 * errorHandler). Aucun secret n'est journalisé : on ne consigne que l'identifiant
 * opaque du compte à l'origine de la requête, jamais son email, son téléphone
 * ni son mot de passe.
 */
function logAudit(
  outcome: "SUCCESS" | "FAILED",
  adminId: string,
  details: Record<string, unknown> = {},
) {
  const entry = `[AUDIT] action=${AUDIT_ACTION} actor=${adminId} role=${UserRole.ADMIN} outcome=${outcome} date=${new Date().toISOString()}`;

  if (outcome === "SUCCESS") {
    console.log(entry, details);
    return;
  }

  console.error(entry, details);
}

export class MaintenanceService {
  /**
   * Indique au frontend si la réinitialisation est autorisée sur cet
   * environnement. Le frontend masque le bouton si elle est désactivée, mais
   * cette valeur ne sert qu'à l'affichage : la décision reste prise par
   * `resetTransactionalData`.
   */
  static isDataResetEnabled() {
    return env.ENABLE_DATA_RESET;
  }

  /**
   * Réinitialisation des données de test.
   *
   * Portée, dans l'ordre imposé par les clés étrangères :
   *   1. cash_collections — encaissements
   *   2. transfers        — transferts, bénéficiaires, paiements
   *   3. users            — comptes agents UNIQUEMENT (jamais les admins)
   *
   * Conservés : cities, comptes administrateurs, _prisma_migrations.
   *
   * Les trois suppressions s'exécutent dans une seule transaction Prisma : en
   * cas d'erreur, Prisma émet un ROLLBACK et aucune suppression partielle ne
   * subsiste. L'ordre est celui de l'énumération ci-dessus, respecté par une
   * transaction interactive.
   */
  static async resetTransactionalData(adminId: string) {
    if (!env.ENABLE_DATA_RESET) {
      throw new AppError(
        "La réinitialisation des données est désactivée sur cet environnement.",
        403,
      );
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const cashCollections = await maintenanceRepository.deleteAllCashCollections(tx);
        const transfers = await maintenanceRepository.deleteAllTransfers(tx);
        const agents = await maintenanceRepository.deleteAllAgents(tx);

        // Dernier rempart : le compte qui a lancé l'opération doit être
        // toujours là et toujours administrateur. Si ce n'est pas le cas, on
        // lève une erreur, ce qui annule l'intégralité de la transaction.
        const admin = await maintenanceRepository.findAdminById(adminId, tx);

        if (!admin || admin.role !== UserRole.ADMIN) {
          throw new AppError(
            "Le compte administrateur à l'origine de la réinitialisation est introuvable. Opération annulée.",
            500,
          );
        }

        return {
          cashCollections: cashCollections.count,
          transfers: transfers.count,
          agents: agents.count,
        };
      });

      logAudit("SUCCESS", adminId, result);

      return result;
    } catch (error) {
      // La transaction a été annulée par Prisma : aucune donnée n'a été
      // supprimée. On trace l'échec sans exposer le détail technique au client,
      // l'errorHandler se charge du message.
      logAudit("FAILED", adminId, {
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });

      throw error;
    }
  }
}