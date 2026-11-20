import { Request, Response, NextFunction } from "express";
import { SectorsService } from "./sectors.service.js";
import { sendSuccess } from "../../utils/response.utils.js";

export class SectorsController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const sector = await SectorsService.create(req.body);
      return sendSuccess(res, sector, 201, "Sector registrado exitosamente");
    } catch (error) {
      next(error);
    }
  }

  static async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { city, status } = req.query;
      const sectors = await SectorsService.listAll({
        city: city as string,
        status: status as any
      });
      return sendSuccess(res, sectors, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const sectorId = String(req.params.id);
      const sector = await SectorsService.getById(sectorId);
      return sendSuccess(res, sector, 200);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const sectorId = String(req.params.id);
      const sector = await SectorsService.update(sectorId, req.body);
      return sendSuccess(res, sector, 200, "Sector actualizado exitosamente");
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const sectorId = String(req.params.id);
      const stats = await SectorsService.getStats(sectorId);
      return sendSuccess(res, stats, 200);
    } catch (error) {
      next(error);
    }
  }
}
