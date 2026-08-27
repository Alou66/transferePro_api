import { AppError } from "../../types/errors";
import { userRepository } from "./user.repository";
import { UserRole } from "@prisma/client";

export class UserService {
  static async getUserById(requestUserId: string, targetUserId: string, requesterRole: UserRole) {
    const isSelf = requestUserId === targetUserId;
    const isAdmin = requesterRole === UserRole.ADMIN;

    if (!isSelf && !isAdmin) {
      throw new AppError("Accès interdit", 403);
    }

    const user = await userRepository.findById(targetUserId);

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
