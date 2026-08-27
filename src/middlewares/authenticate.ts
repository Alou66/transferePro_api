import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../types/errors";
import { JwtPayload, RequestWithUser } from "../types/auth";

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Token d'accès requis", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    (req as RequestWithUser).user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch {
    throw new AppError("Token invalide ou expiré", 401);
  }
};
