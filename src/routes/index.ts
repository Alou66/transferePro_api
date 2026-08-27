import { Router } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "../modules/auth/auth.routes";
import userRoutes from "../modules/users/user.routes";
import cityRoutes from "../modules/cities/city.routes";
import agentRoutes from "../modules/agents/agent.routes";
import transferRoutes from "../modules/transfers/transfer.routes";

const router = Router();

router.use("/", healthRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/cities", cityRoutes);
router.use("/agents", agentRoutes);
router.use("/transfers", transferRoutes);

export default router;
