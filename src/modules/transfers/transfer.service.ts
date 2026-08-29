import { UserRole, TransferStatus } from "@prisma/client";
import { AppError } from "../../types/errors";
import { prisma } from "../../config/database";
import { transferRepository } from "./transfer.repository";
import { calculateTransferFee } from "../../utils/feeCalculator";
import { generateUniqueReference } from "../../utils/transferReference";
import { generateWithdrawalCode } from "../../utils/withdrawalCode";

// Prisma sérialise les champs Decimal (amount, fee) en chaînes de caractères
// dans le JSON de réponse. On les reconvertit systématiquement en number ici,
// au point d'entrée unique, pour que le frontend reçoive toujours des nombres.
function serializeTransfer<T extends { amount: unknown; fee: unknown }>(transfer: T) {
  const amount = Number(transfer.amount);
  const fee = Number(transfer.fee);

  return {
    ...transfer,
    amount,
    fee,
    totalAmount: amount + fee,
  };
}

export class TransferService {
  static async createTransfer(agentId: string, data: {
    senderName: string;
    senderPhone: string;
    recipientName: string;
    recipientPhone: string;
    amount: number;
    destinationCityId: string;
  }) {
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        role: true,
        cityId: true,
        city: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    if (!agent) {
      throw new AppError("Utilisateur introuvable", 404);
    }

    if (agent.role !== UserRole.AGENT) {
      throw new AppError("Seul un agent peut créer un transfert", 403);
    }

    if (!agent.cityId || !agent.city) {
      throw new AppError("Vous n'êtes rattaché à aucune ville", 400);
    }

    const destinationCity = await transferRepository.findDestinationCity(data.destinationCityId);
    if (!destinationCity) {
      throw new AppError("Ville de destination introuvable", 404);
    }

    if (!destinationCity.isActive) {
      throw new AppError("Cette ville n'est pas disponible", 400);
    }

    if (agent.cityId === data.destinationCityId) {
      throw new AppError("La ville de destination doit être différente de la ville d'origine", 400);
    }

    const destinationAgent = await transferRepository.findActiveAgentByCity(data.destinationCityId);
    if (!destinationAgent) {
      throw new AppError("Aucun agent actif n'est disponible dans cette ville", 400);
    }

    const fee = calculateTransferFee(data.amount);
    const reference = await generateUniqueReference();
    const withdrawalCode = generateWithdrawalCode();

    const transfer = await transferRepository.create({
      reference,
      senderName: data.senderName,
      senderPhone: data.senderPhone,
      recipientName: data.recipientName,
      recipientPhone: data.recipientPhone,
      amount: String(data.amount),
      fee: String(fee),
      withdrawalCode,
      status: "CREATED",
      originCityId: agent.cityId,
      destinationCityId: data.destinationCityId,
      originAgentId: agentId,
      destinationAgentId: destinationAgent.id,
    });

    return serializeTransfer(transfer);
  }

  static async getTransferById(transferId: string, requesterId: string, requesterRole: UserRole) {
    const transfer = await transferRepository.findById(transferId);

    if (!transfer) {
      throw new AppError("Transfert introuvable", 404);
    }

    const isAdmin = requesterRole === UserRole.ADMIN;
    const isOriginAgent = transfer.originAgentId === requesterId;
    const isDestinationAgent = transfer.destinationAgentId === requesterId;

    if (!isAdmin && !isOriginAgent && !isDestinationAgent) {
      throw new AppError("Accès interdit", 403);
    }

    return serializeTransfer(transfer);
  }

  static async getWithdrawalCode(transferId: string, requesterId: string, requesterRole: UserRole) {
    const transfer = await transferRepository.findByIdWithCode(transferId);

    if (!transfer) {
      throw new AppError("Transfert introuvable", 404);
    }

    const isAdmin = requesterRole === UserRole.ADMIN;
    const isOriginAgent = transfer.originAgentId === requesterId;

    if (!isAdmin && !isOriginAgent) {
      throw new AppError("Accès interdit", 403);
    }

    if (transfer.status === "PAID") {
      throw new AppError("Ce transfert a déjà été payé, le code de retrait n'est plus disponible", 409);
    }

    return {
      withdrawalCode: transfer.withdrawalCode,
    };
  }

  static async getMyAll(agentId: string, page: number, limit: number, status?: string) {
    const skip = (page - 1) * limit;
    const transferStatus = status as TransferStatus | undefined;

    const [items, total] = await Promise.all([
      transferRepository.findByAgentId(agentId, skip, limit, transferStatus),
      transferRepository.countByAgentId(agentId, transferStatus),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: items.map(serializeTransfer),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  static async getTransfersByAgentForAdmin(targetAgentId: string, page: number, limit: number, status?: string) {
    const skip = (page - 1) * limit;
    const transferStatus = status as TransferStatus | undefined;

    const [items, total] = await Promise.all([
      transferRepository.findByAgentId(targetAgentId, skip, limit, transferStatus),
      transferRepository.countByAgentId(targetAgentId, transferStatus),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: items.map(serializeTransfer),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  static async getAllForAdmin(page: number, limit: number, status?: string) {
    const skip = (page - 1) * limit;
    const transferStatus = status as TransferStatus | undefined;

    const [items, total] = await Promise.all([
      transferRepository.findAllWithFilters(skip, limit, transferStatus),
      transferRepository.countAllWithFilters(transferStatus),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: items.map(serializeTransfer),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  static async getIncomingTransfers(agentId: string, page: number, limit: number, status?: TransferStatus[]) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      transferRepository.findIncomingByAgent(agentId, skip, limit, status),
      transferRepository.countByDestinationAgent(agentId, status),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: items.map(serializeTransfer),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  static async verifyWithdrawalCode(transferId: string, agentId: string, withdrawalCode: string) {
    const transfer = await transferRepository.findByIdWithCode(transferId);

    if (!transfer) {
      throw new AppError("Transfert introuvable", 404);
    }

    if (transfer.destinationAgentId !== agentId) {
      throw new AppError("Accès interdit", 403);
    }

    if (transfer.status !== "CREATED") {
      throw new AppError("Ce transfert ne peut pas être vérifié dans son état actuel", 400);
    }

    if (transfer.withdrawalCode !== withdrawalCode) {
      throw new AppError("Code de retrait incorrect", 400);
    }

    const result = await transferRepository.verifyWithdrawalCodeTransition(transferId);

    if (result.count === 0) {
      throw new AppError("Ce transfert ne peut pas être vérifié dans son état actuel", 400);
    }

    return {
      id: transfer.id,
      reference: transfer.reference,
      status: "READY_FOR_PAYMENT" as TransferStatus,
      message: "Code de retrait vérifié avec succès",
    };
  }

  static async payTransfer(transferId: string, agentId: string) {
    const transfer = await transferRepository.findById(transferId);

    if (!transfer) {
      throw new AppError("Transfert introuvable", 404);
    }

    if (transfer.destinationAgentId !== agentId) {
      throw new AppError("Accès interdit", 403);
    }

    if (transfer.status !== "READY_FOR_PAYMENT") {
      throw new AppError("Ce transfert n'est pas prêt pour le paiement", 400);
    }

    const updatedTransfer = await transferRepository.payTransfer(transferId, agentId);

    return serializeTransfer(updatedTransfer);
  }

  static async cancelTransfer(transferId: string, agentId: string) {
    const transfer = await transferRepository.findById(transferId);

    if (!transfer) {
      throw new AppError("Transfert introuvable", 404);
    }

    if (transfer.originAgentId !== agentId) {
      throw new AppError("Accès interdit", 403);
    }

    if (transfer.status !== "CREATED") {
      throw new AppError("Seul un transfert en attente peut être annulé", 400);
    }

    const result = await transferRepository.cancelTransferTransition(transferId, agentId);

    if (result.count === 0) {
      throw new AppError("Ce transfert ne peut pas être annulé dans son état actuel", 400);
    }

    return {
      id: transfer.id,
      reference: transfer.reference,
      status: "CANCELLED" as TransferStatus,
      message: "Transfert annulé avec succès",
    };
  }

  static async cancelTransferByAdmin(transferId: string) {
    const transfer = await transferRepository.findById(transferId);

    if (!transfer) {
      throw new AppError("Transfert introuvable", 404);
    }

    if (transfer.status !== "CREATED") {
      throw new AppError("Seul un transfert en attente peut être annulé", 400);
    }

    const result = await transferRepository.cancelTransferTransition(transferId, transfer.originAgentId);

    if (result.count === 0) {
      throw new AppError("Ce transfert ne peut pas être annulé dans son état actuel", 400);
    }

    return {
      id: transfer.id,
      reference: transfer.reference,
      status: "CANCELLED" as TransferStatus,
      message: "Transfert annulé avec succès",
    };
  }
}
