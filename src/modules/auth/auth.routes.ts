import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authenticate } from "../../middlewares/authenticate";
import { forgotPasswordLimiter } from "../../middlewares/rateLimit";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/forgot-password/verify-phone", forgotPasswordLimiter, AuthController.verifyPhoneForReset);
router.post("/forgot-password/reset", forgotPasswordLimiter, AuthController.resetPassword);
router.get("/me", authenticate, AuthController.getMe);

export default router;
