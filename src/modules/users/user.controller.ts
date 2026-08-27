import { Request, Response } from "express";
import { UserService } from "./user.service";
import { userIdSchema } from "./user.validator";
import { RequestWithUser } from "../../types/auth";

export class UserController {
  static async getUserById(req: Request, res: Response) {
    const validated = userIdSchema.parse(req.params);

    const user = (req as RequestWithUser).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    const result = await UserService.getUserById(user.userId, validated.id, user.role);

    res.json({
      success: true,
      data: result,
    });
  }
}
