import { Request, Response, NextFunction } from "express";
import { IncidentsService } from "./incidents.service.js";
import { sendSuccess } from "../../utils/response.utils.js";

export class IncidentsController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const reporterId = req.user!.userId;
      const incident = await IncidentsService.create(req.body, reporterId);
      return sendSuccess(res, incident, 201, "Alerta ciudadana emitida exitosamente");
    } catch (error) {
      next(error);
    }
  }

  static async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { sectorId, category, severity, status } = req.query;
      const incidents = await IncidentsService.listAll({
        sectorId: sectorId as string,
        category: category as any,
        severity: severity as any,
        status: status as any
      });
      return sendSuccess(res, incidents, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getGeoJson(req: Request, res: Response, next: NextFunction) {
    try {
      const { sectorId, severity, status } = req.query;
      const geojson = await IncidentsService.getGeoJson({
        sectorId: sectorId as string,
        severity: severity as any,
        status: status as any
      });
      res.setHeader("Content-Type", "application/geo+json");
      return res.status(200).json(geojson);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const incidentId = String(req.params.id);
      const incident = await IncidentsService.getById(incidentId);
      return sendSuccess(res, incident, 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const incidentId = String(req.params.id);
      const user = {
        userId: req.user!.userId,
        role: req.user!.role
      };
      const result = await IncidentsService.updateStatus(incidentId, req.body, user);
      return sendSuccess(res, result, 200, "Estado del incidente actualizado con bitacora");
    } catch (error) {
      next(error);
    }
  }

  static async addUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const incidentId = String(req.params.id);
      const userId = req.user!.userId;
      const updateLog = await IncidentsService.addUpdate(incidentId, req.body, userId);
      return sendSuccess(res, updateLog, 201, "Actualizacion agregada al incidente");
    } catch (error) {
      next(error);
    }
  }
}
