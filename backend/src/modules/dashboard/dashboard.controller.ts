import { Request, Response, NextFunction } from "express";
import { DashboardService } from "./dashboard.service.js";
import { sendSuccess } from "../../utils/response.utils.js";

export class DashboardController {
  static async getSectorMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const sectorId = (req.params.sectorId || req.user?.sectorId) as string;
      const metrics = await DashboardService.getSectorMetrics(sectorId);
      return sendSuccess(res, metrics, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getGlobalMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await DashboardService.getGlobalMetrics();
      return sendSuccess(res, metrics, 200);
    } catch (error) {
      next(error);
    }
  }
}
