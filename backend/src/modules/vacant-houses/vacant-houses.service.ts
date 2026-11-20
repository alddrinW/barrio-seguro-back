import { Prisma, Role, VacantHouseStatus } from "@prisma/client";
import { prisma } from "../../config/database.js";

export class VacantHousesService {
  /**
   * Registro voluntario de ausencia temporal de vivienda
   */
  static async create(
    data: {
      sectorId: string;
      propertyAddress: string;
      latitude: number;
      longitude: number;
      departureDate: string;
      returnDate: string;
      trustedNeighborName: string;
      trustedNeighborPhone: string;
      emergencyContactPhone: string;
      specialInstructions?: string;
    },
    residentId: string
  ) {
    const sector = await prisma.sector.findUnique({
      where: { id: data.sectorId }
    });

    if (!sector) {
      throw { statusCode: 404, message: "Sector no encontrado" };
    }

    const vacantHouse = await prisma.vacantHouse.create({
      data: {
        sectorId: data.sectorId,
        residentId,
        propertyAddress: data.propertyAddress,
        latitude: data.latitude,
        longitude: data.longitude,
        departureDate: new Date(data.departureDate),
        returnDate: new Date(data.returnDate),
        trustedNeighborName: data.trustedNeighborName,
        trustedNeighborPhone: data.trustedNeighborPhone,
        emergencyContactPhone: data.emergencyContactPhone,
        specialInstructions: data.specialInstructions,
        status: VacantHouseStatus.REGISTRADA
      },
      include: {
        resident: {
          select: { id: true, firstName: true, lastName: true, phone: true }
        }
      }
    });

    return vacantHouse;
  }

  /**
   * Listar casas vacias con filtro de privacidad estricto por rol
   */
  static async list(
    user: { userId: string; role: Role; sectorId: string },
    filters?: { status?: VacantHouseStatus }
  ) {
    const whereClause: Prisma.VacantHouseWhereInput = {};

    if (filters?.status) {
      whereClause.status = filters.status;
    }

    // Si es residente ordinario o vecino lider, solo ve sus propias casas notificadas
    if (user.role === Role.RESIDENTE || user.role === Role.VECINO_LIDER) {
      whereClause.residentId = user.userId;
    } else {
      // Superadmin ve todo, Admin de Sector o Policia ven solo las de su sector
      if (user.role !== Role.SUPERADMIN) {
        whereClause.sectorId = user.sectorId;
      }
    }

    const vacantHouses = await prisma.vacantHouse.findMany({
      where: whereClause,
      include: {
        resident: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true }
        },
        _count: {
          select: { inspectionLogs: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return vacantHouses;
  }

  /**
   * Detalle de casa vacia con sus bitacoras de patrullaje
   */
  static async getById(id: string, user: { userId: string; role: Role; sectorId: string }) {
    const vacantHouse = await prisma.vacantHouse.findUnique({
      where: { id },
      include: {
        resident: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true }
        },
        inspectionLogs: {
          include: {
            inspector: {
              select: { id: true, firstName: true, lastName: true, role: true }
            }
          },
          orderBy: { inspectionDate: "desc" }
        }
      }
    });

    if (!vacantHouse) {
      throw { statusCode: 404, message: "Registro de casa vacia no encontrado" };
    }

    // Validacion de privacidad
    if (
      (user.role === Role.RESIDENTE || user.role === Role.VECINO_LIDER) &&
      vacantHouse.residentId !== user.userId
    ) {
      throw {
        statusCode: 403,
        message: "No posee autorizacion para visualizar este domicilio"
      };
    }

    return vacantHouse;
  }

  /**
   * Actualizacion de estado (ej. Activar vigilancia, finalizar o cancelar)
   */
  static async updateStatus(
    id: string,
    status: VacantHouseStatus,
    user: { userId: string; role: Role }
  ) {
    const vacantHouse = await prisma.vacantHouse.findUnique({ where: { id } });
    if (!vacantHouse) {
      throw { statusCode: 404, message: "Registro de casa vacia no encontrado" };
    }

    // Un residente solo puede cancelar o finalizar su propio registro
    if (
      user.role === Role.RESIDENTE &&
      vacantHouse.residentId !== user.userId
    ) {
      throw { statusCode: 403, message: "No autorizado para modificar este registro" };
    }

    const updated = await prisma.vacantHouse.update({
      where: { id },
      data: { status }
    });

    return updated;
  }

  /**
   * Registro de ronda de inspeccion preventiva por parte de la policia o seguridad
   */
  static async addInspectionLog(
    vacantHouseId: string,
    inspectorId: string,
    data: { statusFound: string; notes: string }
  ) {
    const vacantHouse = await prisma.vacantHouse.findUnique({
      where: { id: vacantHouseId }
    });

    if (!vacantHouse) {
      throw { statusCode: 404, message: "Casa vacia no encontrada" };
    }

    const log = await prisma.vacantHouseLog.create({
      data: {
        vacantHouseId,
        inspectorId,
        statusFound: data.statusFound,
        notes: data.notes
      },
      include: {
        inspector: {
          select: { id: true, firstName: true, lastName: true, role: true }
        }
      }
    });

    // Si estaba en REGISTRADA, pasar a VIGILANCIA_ACTIVA
    if (vacantHouse.status === VacantHouseStatus.REGISTRADA) {
      await prisma.vacantHouse.update({
        where: { id: vacantHouseId },
        data: { status: VacantHouseStatus.VIGILANCIA_ACTIVA }
      });
    }

    return log;
  }

  /**
   * Obtener bitacoras de patrullaje de un domicilio
   */
  static async getInspectionLogs(vacantHouseId: string) {
    const logs = await prisma.vacantHouseLog.findMany({
      where: { vacantHouseId },
      include: {
        inspector: {
          select: { id: true, firstName: true, lastName: true, role: true }
        }
      },
      orderBy: { inspectionDate: "desc" }
    });

    return logs;
  }
}
