import { Router } from "express";
import { AgentController } from "./agent.controller";
import { CashCollectionController } from "../cash-collections/cashCollection.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";

const router = Router();

router.get("/", authenticate, authorize("ADMIN"), AgentController.getAll);
router.get("/:id/statistics", authenticate, CashCollectionController.getStatistics);
router.post("/:id/cash-collections", authenticate, authorize("ADMIN"), CashCollectionController.create);
router.get("/:id/cash-collections", authenticate, CashCollectionController.list);
router.get("/:id", authenticate, authorize("ADMIN"), AgentController.getById);
router.patch("/:id/activate", authenticate, authorize("ADMIN"), AgentController.activate);
router.patch("/:id/refuse", authenticate, authorize("ADMIN"), AgentController.refuse);
router.patch("/:id/block", authenticate, authorize("ADMIN"), AgentController.block);
router.patch("/:id/reactivate", authenticate, authorize("ADMIN"), AgentController.reactivate);

export default router;
