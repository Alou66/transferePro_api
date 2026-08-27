import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const userRepository = {
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
      },
    }),
};
