import { Request, Response, NextFunction } from "express";
import { PoisService } from "./pois.service.js";
import { sendSuccess } from "../../utils/response.utils.js";

export class PoisController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = {
        userId: req.user!.userId,
        role: req.user!.role
      };
      const poi = await PoisService.create(req.body, user);
      return sendSuccess(res, poi, 201, "Punto geografico registrado exitosamente");
    } catch (error) {
      next(error);
    }
  }

  static async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { sectorId, type, isVerified, search } = req.query;
      const pois = await PoisService.listAll({
        sectorId: sectorId as string,
        type: type as any,
        isVerified: isVerified !== undefined ? isVerified === "true" : undefined,
        search: search as string
      });
      return sendSuccess(res, pois, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getGeoJson(req: Request, res: Response, next: NextFunction) {
    try {
      const { sectorId, type } = req.query;
      const geojson = await PoisService.getGeoJson({
        sectorId: sectorId as string,
        type: type as any
      });
      res.setHeader("Content-Type", "application/geo+json");
      return res.status(200).json(geojson);
    } catch (error) {
      next(error);
    }
  }

  static async findNearby(req: Request, res: Response, next: NextFunction) {
    try {
      const { lat, lng, radiusKm, type, sectorId } = req.query as any;
      const nearby = await PoisService.findNearby({
        lat: Number(lat),
        lng: Number(lng),
        radiusKm: Number(radiusKm || 3),
        type: type as any,
        sectorId: sectorId as string
      });
      return sendSuccess(res, nearby, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const poiId = String(req.params.id);
      const poi = await PoisService.getById(poiId);
      return sendSuccess(res, poi, 200);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const poiId = String(req.params.id);
      const updated = await PoisService.update(poiId, req.body);
      return sendSuccess(res, updated, 200, "Punto geografico actualizado");
    } catch (error) {
      next(error);
    }
  }

  static async setVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const poiId = String(req.params.id);
      const { isVerified } = req.body;
      const updated = await PoisService.setVerification(poiId, isVerified);
      return sendSuccess(res, updated, 200, "Estado de verificacion modificado");
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const poiId = String(req.params.id);
      const result = await PoisService.delete(poiId);
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}
