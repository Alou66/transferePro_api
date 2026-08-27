import { UserRole } from "@prisma/client";
import { AppError } from "../../types/errors";
import { prisma } from "../../config/database";
import { cashCollectionRepository } from "./cashCollection.repository";

// Prisma sérialise le champ Decimal (amount) en chaîne de caractères dans le
// JSON de réponse. On le reconvertit systématiquement en number ici.
function serializeCashCollection<T extends { amount: unknown }>(collection: T) {
  return {
    ...collection,
    amount: Number(collection.amount),
  };
}

export class CashCollectionService {
  static async getAgentFinancialSummary(agentId: string) {
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        cityId: true,
        createdAt: true,
        city: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!agent) {
      throw new AppError("Agent introuvable", 404);
    }

    if (agent.role !== UserRole.AGENT) {
      throw new AppError("Cet utilisateur n'est pas un agent", 400);
    }

    const lastCollection = await cashCollectionRepository.findLastByAgent(agentId);

    let periodStartedAt: Date;
    if (lastCollection) {
      periodStartedAt = new Date(lastCollection.collectedAt);
    } else {
      periodStartedAt = new Date(agent.createdAt);
    }

    const stats = await cashCollectionRepository.getFinancialStats(agentId, periodStartedAt);

    return {
      agent: {
        id: agent.id,
        firstName: agent.firstName,
        lastName: agent.lastName,
        email: agent.email,
        phone: agent.phone,
        city: agent.city,
      },
      period: {
        startedAt: periodStartedAt.toISOString(),
        lastCollectionAt: lastCollection ? lastCollection.collectedAt.toISOString() : null,
      },
      financial: {
        ...stats,
        periodStart: periodStartedAt.toISOString(),
      },
    };
  }

  static async createCashCollection(agentId: string, adminId: string, amount: number, notes?: string) {
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: { id: true, role: true, createdAt: true },
    });

    if (!agent) {
      throw new AppError("Agent introuvable", 404);
    }

    if (agent.role !== UserRole.AGENT) {
      throw new AppError("Cet utilisateur n'est pas un agent", 400);
    }

    const lastCollection = await cashCollectionRepository.findLastByAgent(agentId);
    const periodStart = lastCollection ? new Date(lastCollection.collectedAt) : new Date(agent.createdAt);

    const stats = await cashCollectionRepository.getFinancialStats(agentId, periodStart);
    const availableBalance = stats.currentBalance;

    if (amount <= 0) {
      throw new AppError("Le montant de récupération doit être supérieur à 0", 400);
    }

    if (amount > availableBalance) {
      throw new AppError("Le montant de récupération ne peut pas dépasser le solde disponible", 400);
    }

    const cashCollection = await cashCollectionRepository.create({
      agentId,
      amount,
      collectedAt: new Date(),
      createdBy: adminId,
      notes,
    });

    return serializeCashCollection(cashCollection);
  }

  static async getCashCollections(agentId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      cashCollectionRepository.findByAgent(agentId, skip, limit),
      cashCollectionRepository.countByAgent(agentId),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: items.map(serializeCashCollection),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}
