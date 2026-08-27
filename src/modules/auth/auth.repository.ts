import { UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { JwtPayload } from "../../types/auth";
import { prisma } from "../../config/database";

export const authRepository = {
  findByEmail: (email: string) =>
    prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        password: true,
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

  findByPhone: (phone: string) =>
    prisma.user.findUnique({
      where: { phone },
    }),

  findCityById: (cityId: string) =>
    prisma.city.findUnique({
      where: { id: cityId },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    }),

  createAgent: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    cityId: string;
  }) =>
    prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: UserRole.AGENT,
        status: UserStatus.PENDING,
        cityId: data.cityId,
      },
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

  generateToken: (payload: JwtPayload) =>
    jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    }),
};

export const comparePassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, 10);
};
