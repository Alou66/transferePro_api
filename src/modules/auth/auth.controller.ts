import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { registerSchema, loginSchema } from "./auth.validator";
import { RequestWithUser } from "../../types/auth";

export class AuthController {
  static async register(req: Request, res: Response) {
    const validated = registerSchema.parse(req.body);

    const result = await AuthService.register(validated);

    res.status(201).json({
      success: true,
      data: result,
    });
  }

  static async login(req: Request, res: Response) {
    const validated = loginSchema.parse(req.body);

    const result = await AuthService.login(validated.email, validated.password);

    res.json({
      success: true,
      data: result,
    });
  }

  static async getMe(req: Request, res: Response) {
    const user = (req as RequestWithUser).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    const result = await AuthService.getMe(user.userId);

    res.json({
      success: true,
      data: result,
    });
  }
}
