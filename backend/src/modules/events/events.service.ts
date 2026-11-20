import { EventStatus, EventType, Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";

export class EventsService {
  /**
   * Convocatoria y creacion de evento o asamblea comunitaria
   */
  static async create(
    data: {
      sectorId: string;
      title: string;
      description: string;
      eventType: EventType;
      latitude: number;
      longitude: number;
      address: string;
      startDate: string;
      endDate: string;
      isPublic?: boolean;
    },
    organizerId: string
  ) {
    const sector = await prisma.sector.findUnique({
      where: { id: data.sectorId }
    });

    if (!sector) {
      throw { statusCode: 404, message: "Sector no encontrado" };
    }

    const event = await prisma.communityEvent.create({
      data: {
        sectorId: data.sectorId,
        organizerId,
        title: data.title,
        description: data.description,
        eventType: data.eventType,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isPublic: data.isPublic ?? true,
        status: EventStatus.PROGRAMADO
      },
      include: {
        organizer: {
          select: { id: true, firstName: true, lastName: true, role: true }
        }
      }
    });

    return event;
  }

  /**
   * Listado de eventos con filtros
   */
  static async listAll(filters?: {
    sectorId?: string;
    eventType?: EventType;
    status?: EventStatus;
    upcomingOnly?: boolean;
  }) {
    const whereClause: Prisma.CommunityEventWhereInput = {};

    if (filters?.sectorId) whereClause.sectorId = filters.sectorId;
    if (filters?.eventType) whereClause.eventType = filters.eventType;
    if (filters?.status) whereClause.status = filters.status;
    if (filters?.upcomingOnly) {
      whereClause.endDate = { gte: new Date() };
    }

    const events = await prisma.communityEvent.findMany({
      where: whereClause,
      include: {
        sector: { select: { id: true, name: true, code: true } },
        organizer: { select: { id: true, firstName: true, lastName: true, role: true } }
      },
      orderBy: { startDate: "asc" }
    });

    return events;
  }

  /**
   * Detalle de evento con lista de asistentes
   */
  static async getById(id: string) {
    const event = await prisma.communityEvent.findUnique({
      where: { id },
      include: {
        sector: true,
        organizer: {
          select: { id: true, firstName: true, lastName: true, role: true, phone: true }
        },
        attendances: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, role: true, familyUnitCode: true }
            }
          }
        }
      }
    });

    if (!event) {
      throw { statusCode: 404, message: "Evento no encontrado" };
    }

    return event;
  }

  /**
   * Confirmar asistencia de residente a evento
   */
  static async attend(eventId: string, userId: string) {
    const event = await prisma.communityEvent.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw { statusCode: 404, message: "Evento no encontrado" };
    }

    const existing = await prisma.eventAttendance.findUnique({
      where: {
        eventId_userId: { eventId, userId }
      }
    });

    if (existing) {
      throw { statusCode: 409, message: "El usuario ya confirmo asistencia a este evento" };
    }

    // Registrar asistencia e incrementar contador de forma transaccional
    const result = await prisma.$transaction(async (tx) => {
      const attendance = await tx.eventAttendance.create({
        data: { eventId, userId }
      });

      const updatedEvent = await tx.communityEvent.update({
        where: { id: eventId },
        data: { attendeesCount: { increment: 1 } },
        select: { id: true, title: true, attendeesCount: true }
      });

      return { attendance, event: updatedEvent };
    });

    return result;
  }

  /**
   * Cancelar confirmacion de asistencia
   */
  static async cancelAttendance(eventId: string, userId: string) {
    const existing = await prisma.eventAttendance.findUnique({
      where: {
        eventId_userId: { eventId, userId }
      }
    });

    if (!existing) {
      throw { statusCode: 404, message: "No se encontro confirmacion previa de asistencia" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.eventAttendance.delete({
        where: { id: existing.id }
      });

      await tx.communityEvent.update({
        where: { id: eventId },
        data: { attendeesCount: { decrement: 1 } }
      });
    });

    return { message: "Asistencia cancelada exitosamente" };
  }

  /**
   * Actualizar estado del evento (PROGRAMADO, EN_CURSO, FINALIZADO, CANCELADO)
   */
  static async updateStatus(id: string, status: EventStatus) {
    const event = await prisma.communityEvent.findUnique({ where: { id } });
    if (!event) {
      throw { statusCode: 404, message: "Evento no encontrado" };
    }

    const updated = await prisma.communityEvent.update({
      where: { id },
      data: { status }
    });

    return updated;
  }
}
