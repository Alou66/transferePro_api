import { Request, Response } from "express";
import { TransferService } from "./transfer.service";
import { createTransferSchema, transferIdSchema, agentIdSchema, listTransfersQuerySchema, incomingTransfersQuerySchema, verifyWithdrawalCodeSchema } from "./transfer.validator";
import { RequestWithUser } from "../../types/auth";
import { UserRole } from "@prisma/client";

export class TransferController {
  static async createTransfer(req: Request, res: Response) {
    const validated = createTransferSchema.parse(req.body);
    const user = (req as RequestWithUser).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    const transfer = await TransferService.createTransfer(user.userId, validated);

    res.status(201).json({
      success: true,
      data: transfer,
    });
  }

  static async getTransferById(req: Request, res: Response) {
    const validated = transferIdSchema.parse(req.params);
    const user = (req as RequestWithUser).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    const transfer = await TransferService.getTransferById(validated.id, user.userId, user.role);

    res.json({
      success: true,
      data: transfer,
    });
  }

  static async getWithdrawalCode(req: Request, res: Response) {
    const validated = transferIdSchema.parse(req.params);
    const user = (req as RequestWithUser).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    const result = await TransferService.getWithdrawalCode(validated.id, user.userId, user.role);

    res.json({
      success: true,
      data: {
        withdrawalCode: result.withdrawalCode,
      },
    });
  }

  static async getAllForAdmin(req: Request, res: Response) {
    const query = listTransfersQuerySchema.parse(req.query);
    const user = (req as RequestWithUser).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    if (user.role !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        message: "Accès interdit",
      });
    }

    const result = await TransferService.getAllForAdmin(
      query.page,
      query.limit,
      query.status
    );

    res.json({
      success: true,
      data: result,
    });
  }

  static async getMyAll(req: Request, res: Response) {
    const query = listTransfersQuerySchema.parse(req.query);
    const user = (req as RequestWithUser).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    const result = await TransferService.getMyAll(
      user.userId,
      query.page,
      query.limit,
      query.status
    );

    res.json({
      success: true,
      data: result,
    });
  }

  static async getTransfersByAgentForAdmin(req: Request, res: Response) {
    const { agentId } = req.params;
    const validatedAgentId = agentIdSchema.parse({ agentId });
    const query = listTransfersQuerySchema.parse(req.query);
    const user = (req as RequestWithUser).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    if (user.role !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        message: "Accès interdit",
      });
    }

    const result = await TransferService.getTransfersByAgentForAdmin(
      validatedAgentId.agentId,
      query.page,
      query.limit,
      query.status
    );

    res.json({
      success: true,
      data: result,
    });
  }

  static async getIncomingTransfers(req: Request, res: Response) {
    const query = incomingTransfersQuerySchema.parse(req.query);
    const user = (req as RequestWithUser).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    const result = await TransferService.getIncomingTransfers(
      user.userId,
      query.page,
      query.limit,
      query.status
    );

    res.json({
      success: true,
      data: result,
    });
  }

  static async verifyWithdrawalCode(req: Request, res: Response) {
    const transferId = transferIdSchema.parse(req.params);
    const validated = verifyWithdrawalCodeSchema.parse(req.body);
    const user = (req as RequestWithUser).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    const result = await TransferService.verifyWithdrawalCode(
      transferId.id,
      user.userId,
      validated.withdrawalCode
    );

    res.json({
      success: true,
      message: result.message,
      data: {
        id: result.id,
        reference: result.reference,
        status: result.status,
      },
    });
  }

  static async payTransfer(req: Request, res: Response) {
    const transferId = transferIdSchema.parse(req.params);
    const user = (req as RequestWithUser).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    const transfer = await TransferService.payTransfer(transferId.id, user.userId);

    res.json({
      success: true,
      message: "Transfert payé avec succès",
      data: transfer,
    });
  }

  static async cancelTransfer(req: Request, res: Response) {
    const transferId = transferIdSchema.parse(req.params);
    const user = (req as RequestWithUser).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    const result = await TransferService.cancelTransfer(transferId.id, user.userId);

    res.json({
      success: true,
      message: result.message,
      data: {
        id: result.id,
        reference: result.reference,
        status: result.status,
      },
    });
  }

  static async cancelTransferByAdmin(req: Request, res: Response) {
    const transferId = transferIdSchema.parse(req.params);
    const user = (req as RequestWithUser).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié",
      });
    }

    if (user.role !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        message: "Accès interdit",
      });
    }

    const result = await TransferService.cancelTransferByAdmin(transferId.id);

    res.json({
      success: true,
      message: result.message,
      data: {
        id: result.id,
        reference: result.reference,
        status: result.status,
      },
    });
  }
}
