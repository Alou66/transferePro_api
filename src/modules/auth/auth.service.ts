import crypto from "crypto";
import { AppError } from "../../types/errors";
import { prisma } from "../../config/database";
import { authRepository, comparePassword, hashPassword } from "./auth.repository";

const RESET_TOKEN_TTL_MS = 10 * 60 * 1000;

const hashResetToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export class AuthService {
  static async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    cityId: string;
  }) {
    const existingEmail = await authRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new AppError("Cet email est déjà utilisé", 409);
    }

    const existingPhone = await authRepository.findByPhone(data.phone);
    if (existingPhone) {
      throw new AppError("Ce numéro de téléphone est déjà utilisé", 409);
    }

    const city = await authRepository.findCityById(data.cityId);
    if (!city) {
      throw new AppError("Ville introuvable", 404);
    }

    if (!city.isActive) {
      throw new AppError("Cette ville n'est plus disponible pour l'inscription", 400);
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await authRepository.createAgent({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      cityId: data.cityId,
    });

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      city: user.city,
    };
  }

  static async login(email: string, password: string) {
    const user = await authRepository.findByEmail(email);

    if (!user) {
      throw new AppError("Email ou mot de passe incorrect", 401);
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new AppError("Email ou mot de passe incorrect", 401);
    }

    if (user.status === "PENDING") {
      throw new AppError("Votre compte est en attente de validation", 403);
    }

    if (user.status === "BLOCKED") {
      throw new AppError("Votre compte est bloqué", 403);
    }

    if (user.status === "REFUSED") {
      throw new AppError("Votre compte a été refusé", 403);
    }

    const token = authRepository.generateToken({
      userId: user.id,
      role: user.role,
    });

    return {
      accessToken: token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        city: user.city,
      },
    };
  }

  static async verifyPhoneForReset(phone: string) {
    const user = await authRepository.findByPhone(phone);

    if (!user) {
      throw new AppError("Aucun compte trouvé avec ce numéro de téléphone", 404);
    }

    if (user.status === "BLOCKED" || user.status === "REFUSED") {
      throw new AppError("Ce compte n'est pas actif", 403);
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await authRepository.setResetPasswordToken(user.id, hashResetToken(rawToken), expiresAt);

    return {
      resetToken: rawToken,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  static async resetPasswordWithToken(resetToken: string, newPassword: string) {
    const user = await authRepository.findByValidResetToken(hashResetToken(resetToken));

    if (!user) {
      throw new AppError("Ce lien de réinitialisation est invalide ou a expiré", 400);
    }

    const hashedPassword = await hashPassword(newPassword);
    await authRepository.resetPassword(user.id, hashedPassword);
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
    });

    if (!user) {
      throw new AppError("Utilisateur non trouvé", 404);
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      city: user.city,
    };
  }
}
