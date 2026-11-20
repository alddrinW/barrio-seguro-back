import { Request, Response, NextFunction } from "express";
import { VacantHousesService } from "./vacant-houses.service.js";
import { sendSuccess } from "../../utils/response.utils.js";

export class VacantHousesController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const residentId = req.user!.userId;
      const vacantHouse = await VacantHousesService.create(req.body, residentId);
      return sendSuccess(res, vacantHouse, 201, "Notificacion de casa vacia registrada");
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const user = {
        userId: req.user!.userId,
        role: req.user!.role,
        sectorId: req.user!.sectorId
      };
      const { status } = req.query;
      const vacantHouses = await VacantHousesService.list(user, {
        status: status as any
      });
      return sendSuccess(res, vacantHouses, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = {
        userId: req.user!.userId,
        role: req.user!.role,
        sectorId: req.user!.sectorId
      };
      const vacantHouseId = String(req.params.id);
      const vacantHouse = await VacantHousesService.getById(vacantHouseId, user);
      return sendSuccess(res, vacantHouse, 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const user = {
        userId: req.user!.userId,
        role: req.user!.role
      };
      const vacantHouseId = String(req.params.id);
      const updated = await VacantHousesService.updateStatus(
        vacantHouseId,
        req.body.status,
        user
      );
      return sendSuccess(res, updated, 200, "Estado de vigilancia actualizado");
    } catch (error) {
      next(error);
    }
  }

  static async addInspectionLog(req: Request, res: Response, next: NextFunction) {
    try {
      const vacantHouseId = String(req.params.id);
      const inspectorId = req.user!.userId;
      const log = await VacantHousesService.addInspectionLog(
        vacantHouseId,
        inspectorId,
        req.body
      );
      return sendSuccess(res, log, 201, "Ronda de patrullaje registrada en bitacora");
    } catch (error) {
      next(error);
    }
  }

  static async getInspectionLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const vacantHouseId = String(req.params.id);
      const logs = await VacantHousesService.getInspectionLogs(vacantHouseId);
      return sendSuccess(res, logs, 200);
    } catch (error) {
      next(error);
    }
  }
}
