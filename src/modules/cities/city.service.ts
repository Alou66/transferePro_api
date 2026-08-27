import { AppError } from "../../types/errors";
import { cityRepository } from "./city.repository";
import { UserRole, UserStatus } from "@prisma/client";
import { prisma } from "../../config/database";

export class CityService {
  static async getAll() {
    return cityRepository.findAll();
  }

  static async getActive() {
    return cityRepository.findActive();
  }

  static async getById(id: string) {
    const city = await cityRepository.findById(id);

    if (!city) {
      throw new AppError("Ville introuvable", 404);
    }

    return city;
  }

  static async create(name: string) {
    const normalizedName = name.trim();

    const existingCity = await cityRepository.findByName(normalizedName);
    if (existingCity) {
      throw new AppError("Cette ville existe déjà", 409);
    }

    return cityRepository.create(normalizedName);
  }

  static async update(id: string, name: string) {
    const normalizedName = name.trim();

    await CityService.getById(id);

    const existingCity = await cityRepository.findByName(normalizedName);
    if (existingCity && existingCity.id !== id) {
      throw new AppError("Cette ville existe déjà", 409);
    }

    return cityRepository.update(id, normalizedName);
  }

  static async activate(id: string) {
    await CityService.getById(id);

    return cityRepository.updateActive(id, true);
  }

  static async deactivate(id: string) {
    await CityService.getById(id);

    return cityRepository.updateActive(id, false);
  }

  static async getAvailableForRegistration() {
    const cities = await cityRepository.findActive();

    const citiesWithActiveAgent = await prisma.user.findMany({
      where: {
        role: UserRole.AGENT,
        status: UserStatus.ACTIVE,
        cityId: {
          in: cities.map((city) => city.id),
        },
      },
      select: {
        cityId: true,
      },
    });

    const occupiedCityIds = new Set(citiesWithActiveAgent.map((agent) => agent.cityId));

    return cities.filter((city) => !occupiedCityIds.has(city.id));
  }
}
