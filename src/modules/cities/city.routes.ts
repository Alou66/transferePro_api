import { Router } from "express";
import { CityController } from "./city.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";

const router = Router();

router.get("/active", CityController.getActive);
router.get("/available-for-registration", CityController.getAvailableForRegistration);
router.get("/", authenticate, authorize("ADMIN"), CityController.getAll);
router.get("/:id", authenticate, authorize("ADMIN"), CityController.getById);
router.post("/", authenticate, authorize("ADMIN"), CityController.create);
router.patch("/:id", authenticate, authorize("ADMIN"), CityController.update);
router.patch("/:id/activate", authenticate, authorize("ADMIN"), CityController.activate);
router.patch("/:id/deactivate", authenticate, authorize("ADMIN"), CityController.deactivate);

export default router;
