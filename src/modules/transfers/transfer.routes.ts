import { Router } from "express";
import { TransferController } from "./transfer.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";

const router = Router();

router.post("/", authenticate, authorize("AGENT"), TransferController.createTransfer);
router.get("/", authenticate, authorize("ADMIN"), TransferController.getAllForAdmin);
router.get("/my-all", authenticate, authorize("AGENT"), TransferController.getMyAll);
router.get("/incoming", authenticate, authorize("AGENT"), TransferController.getIncomingTransfers);
router.get("/agent/:agentId", authenticate, authorize("ADMIN"), TransferController.getTransfersByAgentForAdmin);
router.get("/:id/withdrawal-code", authenticate, TransferController.getWithdrawalCode);
router.post("/:id/verify-code", authenticate, authorize("AGENT"), TransferController.verifyWithdrawalCode);
router.post("/:id/pay", authenticate, authorize("AGENT"), TransferController.payTransfer);
router.post("/:id/cancel", authenticate, authorize("AGENT"), TransferController.cancelTransfer);
router.post("/:id/admin-cancel", authenticate, authorize("ADMIN"), TransferController.cancelTransferByAdmin);
router.get("/:id", authenticate, TransferController.getTransferById);

export default router;
