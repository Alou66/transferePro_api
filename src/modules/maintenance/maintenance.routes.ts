import { Router } from "express";
import { MaintenanceController } from "./maintenance.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";

const router = Router();

// Route de consultation : authentifié + ADMIN, sans effet de bord.
router.get(
  "/reset-data/available",
  authenticate,
  authorize("ADMIN"),
  MaintenanceController.getDataResetAvailability,
);

// Route destructrice : authentifié + ADMIN + double confirmation + variable
// d'environnement ENABLE_DATA_RESET=true. Aucune de ces trois protections ne
// peut être contournée depuis le client.
router.post(
  "/reset-data",
  authenticate,
  authorize("ADMIN"),
  MaintenanceController.resetData,
);

export default router;