import { Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { CashCollectionService } from "./cashCollection.service";
import { agentIdSchema, createCashCollectionSchema, cashCollectionsQuerySchema } from "./cashCollection.validator";
import { RequestWithUser } from "../../types/auth";

export class CashCollectionController {
  static async getStatistics(req: Request, res: Response) {
    const { id } = agentIdSchema.parse(req.params);
    const user = (req as RequestWithUser).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    if (user.role !== UserRole.ADMIN && user.userId !== id) {
      return res.status(403).json({
        success: false,
        message: "Accès interdit",
      });
    }

    const result = await CashCollectionService.getAgentFinancialSummary(id);

    res.json({
      success: true,
      data: result,
    });
  }

  static async create(req: Request, res: Response) {
    const { id } = agentIdSchema.parse(req.params);
    const validated = createCashCollectionSchema.parse(req.body);
    const user = (req as RequestWithUser).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    const cashCollection = await CashCollectionService.createCashCollection(
      id,
      user.userId,
      validated.amount,
      validated.notes
    );

    res.status(201).json({
      success: true,
      data: cashCollection,
    });
  }

  static async list(req: Request, res: Response) {
    const { id } = agentIdSchema.parse(req.params);
    const query = cashCollectionsQuerySchema.parse(req.query);
    const user = (req as RequestWithUser).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    if (user.role !== UserRole.ADMIN && user.userId !== id) {
      return res.status(403).json({
        success: false,
        message: "Accès interdit",
      });
    }

    const result = await CashCollectionService.getCashCollections(id, query.page, query.limit);

    res.json({
      success: true,
      data: result,
    });
  }
}
