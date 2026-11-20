import { Request, Response, NextFunction } from "express";
import { EventsService } from "./events.service.js";
import { sendSuccess } from "../../utils/response.utils.js";

export class EventsController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const organizerId = req.user!.userId;
      const event = await EventsService.create(req.body, organizerId);
      return sendSuccess(res, event, 201, "Evento comunitario creado exitosamente");
    } catch (error) {
      next(error);
    }
  }

  static async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { sectorId, eventType, status, upcomingOnly } = req.query;
      const events = await EventsService.listAll({
        sectorId: sectorId as string,
        eventType: eventType as any,
        status: status as any,
        upcomingOnly: upcomingOnly === "true"
      });
      return sendSuccess(res, events, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = String(req.params.id);
      const event = await EventsService.getById(eventId);
      return sendSuccess(res, event, 200);
    } catch (error) {
      next(error);
    }
  }

  static async attend(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = String(req.params.id);
      const userId = req.user!.userId;
      const result = await EventsService.attend(eventId, userId);
      return sendSuccess(res, result, 200, "Asistencia confirmada al evento");
    } catch (error) {
      next(error);
    }
  }

  static async cancelAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = String(req.params.id);
      const userId = req.user!.userId;
      const result = await EventsService.cancelAttendance(eventId, userId);
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = String(req.params.id);
      const { status } = req.body;
      const updated = await EventsService.updateStatus(eventId, status);
      return sendSuccess(res, updated, 200, "Estado del evento modificado");
    } catch (error) {
      next(error);
    }
  }
}
