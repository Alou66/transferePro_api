import { Request, Response, NextFunction } from "express";
import { AppError } from "../types/errors";

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    } as const);
  }

  console.error(err);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  } as const);
};
