import { Router } from "express";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "API TransferePro is running",
  } as const);
});

export default router;
