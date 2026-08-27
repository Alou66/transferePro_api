import { Router } from "express";
import { UserController } from "./user.controller";
import { authenticate } from "../../middlewares/authenticate";

const router = Router();

router.get("/:id", authenticate, UserController.getUserById);

export default router;
