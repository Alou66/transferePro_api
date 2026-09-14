import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../types/errors";

// Mêmes codes que database.ts : la base est injoignable, ce n'est pas une
// erreur applicative — on veut un message explicite plutôt qu'un 500 générique.
const DB_UNAVAILABLE_ERROR_CODES = new Set(["P1001", "P1002", "P1017"]);

function isDatabaseUnavailableError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    DB_UNAVAILABLE_ERROR_CODES.has(err.code)
  );
}

export const errorHandler = (
  err: Error | AppError | ZodError,
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

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: err.issues[0]?.message || "Données invalides",
    } as const);
  }

  if (isDatabaseUnavailableError(err)) {
    console.error(err);
    return res.status(503).json({
      success: false,
      message: "Le service est momentanément indisponible. Veuillez réessayer dans quelques instants.",
    } as const);
  }

  console.error(err);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  } as const);
};
