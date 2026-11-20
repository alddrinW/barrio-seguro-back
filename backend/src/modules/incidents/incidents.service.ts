import { IncidentCategory, IncidentSeverity, IncidentStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "../../config/database.js";
import { toPointFeatureCollection } from "../../utils/geo.utils.js";

export class IncidentsService {
  /**
   * Emision de alerta de incidente ciudadano
   */
  static async create(
    data: {
      sectorId: string;
      category: IncidentCategory;
      severity: IncidentSeverity;
      title: string;
      description: string;
      latitude: number;
      longitude: number;
      addressReference: string;
      isAnonymous?: boolean;
      evidenceUrls?: string[];
    },
    reporterId: string
  ) {
    const sector = await prisma.sector.findUnique({
      where: { id: data.sectorId }
    });

    if (!sector) {
      throw { statusCode: 404, message: "Sector no encontrado" };
    }

    // Generar codigo correlativo ALR-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const countThisYear = await prisma.incidentAlert.count();
    const code = `ALR-${currentYear}-${(countThisYear + 1).toString().padStart(4, "0")}`;

    const incident = await prisma.incidentAlert.create({
      data: {
        sectorId: data.sectorId,
        reportedById: reporterId,
        code,
        category: data.category,
        severity: data.severity,
        title: data.title,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        addressReference: data.addressReference,
        isAnonymous: data.isAnonymous ?? false,
        evidenceUrls: data.evidenceUrls ?? [],
        status: IncidentStatus.EMITIDA
      },
      include: {
        reportedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    });

    // Anonimizar en respuesta si el usuario lo indico
    if (incident.isAnonymous) {
      return {
        ...incident,
        reportedBy: { id: "ANONIMO", firstName: "Vecino", lastName: "Anonimo", phone: null }
      };
    }

    return incident;
  }

  /**
   * Listar denuncias ciudadanas con filtros
   */
  static async listAll(filters?: {
    sectorId?: string;
    category?: IncidentCategory;
    severity?: IncidentSeverity;
    status?: IncidentStatus;
  }) {
    const whereClause: Prisma.IncidentAlertWhereInput = {};

    if (filters?.sectorId) whereClause.sectorId = filters.sectorId;
    if (filters?.category) whereClause.category = filters.category;
    if (filters?.severity) whereClause.severity = filters.severity;
    if (filters?.status) whereClause.status = filters.status;

    const incidents = await prisma.incidentAlert.findMany({
      where: whereClause,
      include: {
        sector: { select: { id: true, name: true, code: true } },
        reportedBy: { select: { id: true, firstName: true, lastName: true, phone: true } },
        updates: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { status: true, comment: true, createdAt: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Aplicar anonimizacion en los reportes correspondientes
    return incidents.map((inc) => {
      if (inc.isAnonymous) {
        return {
          ...inc,
          reportedBy: { id: "ANONIMO", firstName: "Vecino", lastName: "Anonimo", phone: null }
        };
      }
      return inc;
    });
  }

  /**
   * Exportar incidentes en formato GeoJSON para OpenStreetMap
   */
  static async getGeoJson(filters?: {
    sectorId?: string;
    severity?: IncidentSeverity;
    status?: IncidentStatus;
  }) {
    const whereClause: Prisma.IncidentAlertWhereInput = {};
    if (filters?.sectorId) whereClause.sectorId = filters.sectorId;
    if (filters?.severity) whereClause.severity = filters.severity;
    if (filters?.status) whereClause.status = filters.status;

    const incidents = await prisma.incidentAlert.findMany({
      where: whereClause,
      select: {
        id: true,
        code: true,
        category: true,
        severity: true,
        title: true,
        description: true,
        latitude: true,
        longitude: true,
        addressReference: true,
        status: true,
        createdAt: true
      }
    });

    return toPointFeatureCollection(incidents, (item) => ({
      code: item.code,
      category: item.category,
      severity: item.severity,
      title: item.title,
      description: item.description,
      addressReference: item.addressReference,
      status: item.status,
      createdAt: item.createdAt
    }));
  }

  /**
   * Obtener detalle completo de incidente con historial de actualizaciones
   */
  static async getById(id: string) {
    const incident = await prisma.incidentAlert.findUnique({
      where: { id },
      include: {
        sector: true,
        reportedBy: {
          select: { id: true, firstName: true, lastName: true, phone: true }
        },
        updates: {
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true, role: true }
            }
          },
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!incident) {
      throw { statusCode: 404, message: "Incidente no encontrado" };
    }

    if (incident.isAnonymous) {
      return {
        ...incident,
        reportedBy: { id: "ANONIMO", firstName: "Vecino", lastName: "Anonimo", phone: null }
      };
    }

    return incident;
  }

  /**
   * Actualizar estado operativo e insertar bitacora de atencion policial/administrativa
   */
  static async updateStatus(
    id: string,
    data: { status: IncidentStatus; comment: string; officerBadge?: string },
    user: { userId: string; role: Role }
  ) {
    const incident = await prisma.incidentAlert.findUnique({ where: { id } });
    if (!incident) {
      throw { statusCode: 404, message: "Incidente no encontrado" };
    }

    // Transaccion para actualizar estatus e insertar log en incident_updates
    const result = await prisma.$transaction(async (tx) => {
      const updatedIncident = await tx.incidentAlert.update({
        where: { id },
        data: { status: data.status },
        include: { sector: true }
      });

      const updateLog = await tx.incidentUpdate.create({
        data: {
          incidentId: id,
          authorId: user.userId,
          status: data.status,
          comment: data.comment,
          officerBadge: data.officerBadge
        },
        include: {
          author: {
            select: { id: true, firstName: true, lastName: true, role: true }
          }
        }
      });

      return { incident: updatedIncident, updateLog };
    });

    return result;
  }

  /**
   * Agregar actualizacion o comentario de seguimiento a un incidente
   */
  static async addUpdate(
    id: string,
    data: { comment: string; status?: IncidentStatus; officerBadge?: string },
    userId: string
  ) {
    const incident = await prisma.incidentAlert.findUnique({ where: { id } });
    if (!incident) {
      throw { statusCode: 404, message: "Incidente no encontrado" };
    }

    const currentStatus = data.status || incident.status;

    const result = await prisma.$transaction(async (tx) => {
      if (data.status && data.status !== incident.status) {
        await tx.incidentAlert.update({
          where: { id },
          data: { status: data.status }
        });
      }

      const updateLog = await tx.incidentUpdate.create({
        data: {
          incidentId: id,
          authorId: userId,
          status: currentStatus,
          comment: data.comment,
          officerBadge: data.officerBadge
        },
        include: {
          author: {
            select: { id: true, firstName: true, lastName: true, role: true }
          }
        }
      });

      return updateLog;
    });

    return result;
  }
}
