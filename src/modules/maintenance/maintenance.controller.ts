import { Request, Response } from "express";
import { MaintenanceService } from "./maintenance.service";
import { resetDataSchema } from "./maintenance.validator";
import { RequestWithUser } from "../../types/auth";

export class MaintenanceController {
  /**
   * GET /api/admin/maintenance/reset-data/available
   *
   * Renseigne l'interface sur l'autorisation de l'opération. Réservé aux
   * administrateurs authentifiés (le routage en impose le rôle), mais ne peut
   * pas déclencher de suppression.
   */
  static async getDataResetAvailability(_req: Request, res: Response) {
    res.json({
      success: true,
      data: {
        enabled: MaintenanceService.isDataResetEnabled(),
      },
    });
  }

  /**
   * POST /api/admin/maintenance/reset-data
   *
   * Opération destructive. Le rôle ADMIN est déjà garanti par le middleware
   * `authorize("ADMIN")` monté sur la route ; on ne fait que lire le corps
   * validé et l'identifiant de l'appelant.
   */
  static async resetData(req: Request, res: Response) {
    // La validation du corps est la double confirmation : resetDataSchema
    // refuse toute valeur autre que la chaîne exacte "RESET" et répond 400
    // sinon. Elle est évaluée avant tout accès à la base, et avant même de
    // regarder qui est l'appelant. Le rôle ADMIN, lui, est garanti en amont par
    // le middleware authorize("ADMIN") monté sur la route.
    resetDataSchema.parse(req.body);

    const user = (req as RequestWithUser).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    const result = await MaintenanceService.resetTransactionalData(user.userId);

    res.status(200).json({
      success: true,
      message: "Les données transactionnelles ont été réinitialisées.",
      data: result,
    });
  }
}