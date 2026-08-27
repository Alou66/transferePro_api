import { UserRole, UserStatus } from "@prisma/client";
import { prisma } from "../../config/database";

export const agentRepository = {
  findById: (id: string) =>
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        cityId: true,
        city: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    }),

  findManyAgents: (where: { status?: UserStatus; cityId?: string; email?: string; phone?: string }) => {
    const query: Parameters<typeof prisma.user.findMany>[0] = {
      where: {
        role: UserRole.AGENT,
        ...(where.status ? { status: where.status } : {}),
        ...(where.cityId ? { cityId: where.cityId } : {}),
        ...(where.email ? { email: where.email } : {}),
        ...(where.phone ? { phone: where.phone } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        cityId: true,
        city: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    };

    return prisma.user.findMany(query);
  },

  findActiveAgentByCity: (cityId: string, excludeAgentId?: string) =>
    prisma.user.findFirst({
      where: {
        role: UserRole.AGENT,
        status: UserStatus.ACTIVE,
        cityId,
        ...(excludeAgentId ? { id: { not: excludeAgentId } } : {}),
      },
      select: {
        id: true,
      },
    }),

  updateStatus: (id: string, status: UserStatus) =>
    prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        cityId: true,
        city: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    }),
};
