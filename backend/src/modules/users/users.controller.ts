import { Request, Response, NextFunction } from "express";
import { UsersService } from "./users.service.js";
import { sendSuccess } from "../../utils/response.utils.js";

export class UsersController {
  static async censusResident(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UsersService.censusResident(req.body);
      return sendSuccess(res, result, 201, "Residente censado exitosamente");
    } catch (error) {
      next(error);
    }
  }

  static async listBySector(req: Request, res: Response, next: NextFunction) {
    try {
      const sectorId = String(req.params.sectorId);
      const { role } = req.query;
      const users = await UsersService.listBySector(sectorId, role as any);
      return sendSuccess(res, users, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getCensusSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const sectorId = String(req.params.sectorId);
      const summary = await UsersService.getCensusSummary(sectorId);
      return sendSuccess(res, summary, 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = String(req.params.id);
      const result = await UsersService.updateUserRole(userId, req.body);
      return sendSuccess(res, result, 200, "Rol de usuario actualizado");
    } catch (error) {
      next(error);
    }
  }
}
