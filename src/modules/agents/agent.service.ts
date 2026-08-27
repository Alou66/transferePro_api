import { UserRole, UserStatus } from "@prisma/client";
import { AppError } from "../../types/errors";
import { agentRepository } from "./agent.repository";

export class AgentService {
  static async getAll(status?: UserStatus, cityId?: string, email?: string, phone?: string) {
    return agentRepository.findManyAgents({
      ...(status ? { status } : {}),
      ...(cityId ? { cityId } : {}),
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
    });
  }

  static async getById(id: string) {
    const user = await agentRepository.findById(id);

    if (!user) {
      throw new AppError("Utilisateur introuvable", 404);
    }

    if (user.role !== UserRole.AGENT) {
      throw new AppError("Cet utilisateur n'est pas un agent", 400);
    }

    return user;
  }

  static async activate(id: string) {
    const user = await agentRepository.findById(id);

    if (!user) {
      throw new AppError("Utilisateur introuvable", 404);
    }

    if (user.role !== UserRole.AGENT) {
      throw new AppError("Cet utilisateur n'est pas un agent", 400);
    }

    if (user.status !== UserStatus.PENDING) {
      throw new AppError("Transition de statut non autorisée", 400);
    }

    if (!user.cityId) {
      throw new AppError("Cet agent n'est rattaché à aucune ville", 400);
    }

    const existingActiveAgent = await agentRepository.findActiveAgentByCity(user.cityId, id);
    if (existingActiveAgent) {
      throw new AppError("Un agent actif est déjà affecté à cette ville", 400);
    }

    return agentRepository.updateStatus(id, UserStatus.ACTIVE);
  }

  static async refuse(id: string) {
    const user = await agentRepository.findById(id);

    if (!user) {
      throw new AppError("Utilisateur introuvable", 404);
    }

    if (user.role !== UserRole.AGENT) {
      throw new AppError("Cet utilisateur n'est pas un agent", 400);
    }

    if (user.status !== UserStatus.PENDING) {
      throw new AppError("Transition de statut non autorisée", 400);
    }

    return agentRepository.updateStatus(id, UserStatus.REFUSED);
  }

  static async block(id: string) {
    const user = await agentRepository.findById(id);

    if (!user) {
      throw new AppError("Utilisateur introuvable", 404);
    }

    if (user.role !== UserRole.AGENT) {
      throw new AppError("Cet utilisateur n'est pas un agent", 400);
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new AppError("Transition de statut non autorisée", 400);
    }

    return agentRepository.updateStatus(id, UserStatus.BLOCKED);
  }

  static async reactivate(id: string) {
    const user = await agentRepository.findById(id);

    if (!user) {
      throw new AppError("Utilisateur introuvable", 404);
    }

    if (user.role !== UserRole.AGENT) {
      throw new AppError("Cet utilisateur n'est pas un agent", 400);
    }

    if (user.status !== UserStatus.BLOCKED) {
      throw new AppError("Transition de statut non autorisée", 400);
    }

    if (!user.cityId) {
      throw new AppError("Cet agent n'est rattaché à aucune ville", 400);
    }

    const existingActiveAgent = await agentRepository.findActiveAgentByCity(user.cityId, id);
    if (existingActiveAgent) {
      throw new AppError("Un agent actif est déjà affecté à cette ville", 400);
    }

    return agentRepository.updateStatus(id, UserStatus.ACTIVE);
  }
}
