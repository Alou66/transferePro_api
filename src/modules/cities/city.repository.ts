import { prisma } from "../../config/database";

export const cityRepository = {
  findAll: () =>
    prisma.city.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }),

  findActive: () =>
    prisma.city.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    }),

  findById: (id: string) =>
    prisma.city.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }),

  findByName: (name: string) =>
    prisma.city.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
      },
    }),

  create: (name: string) =>
    prisma.city.create({
      data: {
        name,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }),

  update: (id: string, name: string) =>
    prisma.city.update({
      where: { id },
      data: { name },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }),

  updateActive: (id: string, isActive: boolean) =>
    prisma.city.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
};
