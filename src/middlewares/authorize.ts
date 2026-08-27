import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { AppError } from "../types/errors";
import { RequestWithUser } from "../types/auth";

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as RequestWithUser).user;

    if (!user) {
      throw new AppError("Utilisateur non authentifié", 401);
    }

    if (!allowedRoles.includes(user.role)) {
      throw new AppError("Accès interdit", 403);
    }

    next();
  };
};
