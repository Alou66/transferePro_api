import { Request, Response } from "express";
import { CityService } from "./city.service";
import { createCitySchema, updateCitySchema, cityIdSchema } from "./city.validator";

export class CityController {
  static async getAll(_req: Request, res: Response) {
    const cities = await CityService.getAll();

    res.json({
      success: true,
      data: cities,
    });
  }

  static async getActive(_req: Request, res: Response) {
    const cities = await CityService.getActive();

    res.json({
      success: true,
      data: cities,
    });
  }

  static async getById(req: Request, res: Response) {
    const validated = cityIdSchema.parse(req.params);

    const city = await CityService.getById(validated.id);

    res.json({
      success: true,
      data: city,
    });
  }

  static async create(req: Request, res: Response) {
    const validated = createCitySchema.parse(req.body);

    const city = await CityService.create(validated.name);

    res.status(201).json({
      success: true,
      data: city,
    });
  }

  static async update(req: Request, res: Response) {
    const validated = updateCitySchema.parse(req.body);
    const { id } = cityIdSchema.parse(req.params);

    const city = await CityService.update(id, validated.name);

    res.json({
      success: true,
      data: city,
    });
  }

  static async activate(req: Request, res: Response) {
    const { id } = cityIdSchema.parse(req.params);

    const city = await CityService.activate(id);

    res.json({
      success: true,
      data: city,
    });
  }

  static async deactivate(req: Request, res: Response) {
    const { id } = cityIdSchema.parse(req.params);

    const city = await CityService.deactivate(id);

    res.json({
      success: true,
      data: city,
    });
  }

  static async getAvailableForRegistration(_req: Request, res: Response) {
    const cities = await CityService.getAvailableForRegistration();

    res.json({
      success: true,
      data: cities,
    });
  }
}
