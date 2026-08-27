import { TransferStatus } from "@prisma/client";
import { prisma } from "../../config/database";

export const cashCollectionRepository = {
  findLastByAgent: (agentId: string) =>
    prisma.cashCollection.findFirst({
      where: { agentId },
      orderBy: { collectedAt: "desc" },
      select: { collectedAt: true },
    }),

  findByAgent: (agentId: string, skip: number, take: number) =>
    prisma.cashCollection.findMany({
      where: { agentId },
      skip,
      take,
      orderBy: { collectedAt: "desc" },
      select: {
        id: true,
        amount: true,
        collectedAt: true,
        notes: true,
        createdAt: true,
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    }),

  countByAgent: (agentId: string) =>
    prisma.cashCollection.count({ where: { agentId } }),

  create: (data: {
    agentId: string;
    amount: number;
    collectedAt: Date;
    createdBy: string;
    notes?: string;
  }) =>
    prisma.cashCollection.create({
      data: {
        agentId: data.agentId,
        amount: data.amount,
        collectedAt: data.collectedAt,
        createdBy: data.createdBy,
        notes: data.notes,
      },
      select: {
        id: true,
        amount: true,
        collectedAt: true,
        notes: true,
        createdAt: true,
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    }),

  getFinancialStats: async (agentId: string, periodStart: Date) => {
    const [createdAgg, paidAgg, collectedAgg] = await Promise.all([
      prisma.transfer.aggregate({
        where: {
          originAgentId: agentId,
          status: { not: TransferStatus.CANCELLED },
          createdAt: { gt: periodStart },
        },
        _sum: { amount: true, fee: true },
      }),
      prisma.transfer.aggregate({
        where: {
          destinationAgentId: agentId,
          status: TransferStatus.PAID,
          paidAt: { gt: periodStart },
        },
        _sum: { amount: true },
      }),
      prisma.cashCollection.aggregate({
        where: {
          agentId,
          collectedAt: { gt: periodStart },
        },
        _sum: { amount: true },
      }),
    ]);

    const totalCreated =
      Number(createdAgg._sum.amount || 0) + Number(createdAgg._sum.fee || 0);
    const totalPaid = Number(paidAgg._sum.amount || 0);
    const totalCollected = Number(collectedAgg._sum.amount || 0);
    const currentBalance = totalCreated - totalPaid - totalCollected;

    return {
      totalCreated,
      totalPaid,
      totalCollected,
      currentBalance,
    };
  },
};
