import { Request, Response } from "express";
import { AgentService } from "./agent.service";
import { agentIdSchema, agentQuerySchema } from "./agent.validator";

export class AgentController {
  static async getAll(req: Request, res: Response) {
    const validated = agentQuerySchema.parse(req.query);

    const agents = await AgentService.getAll(validated.status, validated.cityId);

    res.json({
      success: true,
      data: agents,
    });
  }

  static async getById(req: Request, res: Response) {
    const validated = agentIdSchema.parse(req.params);

    const agent = await AgentService.getById(validated.id);

    res.json({
      success: true,
      data: agent,
    });
  }

  static async activate(req: Request, res: Response) {
    const validated = agentIdSchema.parse(req.params);

    const agent = await AgentService.activate(validated.id);

    res.json({
      success: true,
      data: agent,
    });
  }

  static async refuse(req: Request, res: Response) {
    const validated = agentIdSchema.parse(req.params);

    const agent = await AgentService.refuse(validated.id);

    res.json({
      success: true,
      data: agent,
    });
  }

  static async block(req: Request, res: Response) {
    const validated = agentIdSchema.parse(req.params);

    const agent = await AgentService.block(validated.id);

    res.json({
      success: true,
      data: agent,
    });
  }

  static async reactivate(req: Request, res: Response) {
    const validated = agentIdSchema.parse(req.params);

    const agent = await AgentService.reactivate(validated.id);

    res.json({
      success: true,
      data: agent,
    });
  }
}
