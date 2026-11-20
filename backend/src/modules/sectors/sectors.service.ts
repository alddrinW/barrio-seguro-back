import { Prisma, SectorStatus } from "@prisma/client";
import { prisma } from "../../config/database.js";

export class SectorsService {
  /**
   * Registro independiente de un nuevo sector barrial
   */
  static async create(data: {
    name: string;
    code: string;
    description?: string;
    city: string;
    provinceState: string;
    postalCode?: string;
    centerLat: number;
    centerLng: number;
    maxFamilies?: number;
    boundaryGeoJson?: any;
    status?: SectorStatus;
  }) {
    const existingCode = await prisma.sector.findUnique({
      where: { code: data.code }
    });

    if (existingCode) {
      throw { statusCode: 409, message: "El codigo de sector ya se encuentra registrado" };
    }

    const sector = await prisma.sector.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        city: data.city,
        provinceState: data.provinceState,
        postalCode: data.postalCode,
        centerLat: data.centerLat,
        centerLng: data.centerLng,
        maxFamilies: data.maxFamilies ?? 250,
        boundaryGeoJson: data.boundaryGeoJson,
        status: data.status ?? SectorStatus.ACTIVO
      }
    });

    return sector;
  }

  /**
   * Listar todos los sectores activos
   */
  static async listAll(filters?: { city?: string; status?: SectorStatus }) {
    const whereClause: Prisma.SectorWhereInput = {};

    if (filters?.city) {
      whereClause.city = { contains: filters.city, mode: "insensitive" };
    }
    if (filters?.status) {
      whereClause.status = filters.status;
    }

    const sectors = await prisma.sector.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            users: true,
            pois: true,
            events: true,
            incidents: true
          }
        }
      },
      orderBy: { name: "asc" }
    });

    // Calcular familias unicas para cada sector
    const sectorsWithStats = await Promise.all(
      sectors.map(async (sector) => {
        const distinctFamilies = await prisma.user.findMany({
          where: {
            sectorId: sector.id,
            familyUnitCode: { not: null }
          },
          distinct: ["familyUnitCode"],
          select: { familyUnitCode: true }
        });

        return {
          ...sector,
          currentFamiliesCount: distinctFamilies.length,
          availableFamilySlots: Math.max(0, sector.maxFamilies - distinctFamilies.length),
          occupancyPercentage: Number(
            ((distinctFamilies.length / sector.maxFamilies) * 100).toFixed(1)
          )
        };
      })
    );

    return sectorsWithStats;
  }

  /**
   * Obtener detalle de sector por ID
   */
  static async getById(id: string) {
    const sector = await prisma.sector.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            pois: true,
            events: true,
            vacantHouses: true,
            incidents: true
          }
        }
      }
    });

    if (!sector) {
      throw { statusCode: 404, message: "Sector no encontrado" };
    }

    const distinctFamilies = await prisma.user.findMany({
      where: {
        sectorId: sector.id,
        familyUnitCode: { not: null }
      },
      distinct: ["familyUnitCode"],
      select: { familyUnitCode: true }
    });

    return {
      ...sector,
      currentFamiliesCount: distinctFamilies.length,
      availableFamilySlots: Math.max(0, sector.maxFamilies - distinctFamilies.length),
      occupancyPercentage: Number(
        ((distinctFamilies.length / sector.maxFamilies) * 100).toFixed(1)
      )
    };
  }

  /**
   * Actualizar parametros del sector
   */
  static async update(id: string, data: Partial<Prisma.SectorUpdateInput>) {
    const sector = await prisma.sector.findUnique({ where: { id } });
    if (!sector) {
      throw { statusCode: 404, message: "Sector no encontrado" };
    }

    const updated = await prisma.sector.update({
      where: { id },
      data
    });

    return updated;
  }

  /**
   * Estadisticas territoriales y de censo del sector
   */
  static async getStats(id: string) {
    const sector = await prisma.sector.findUnique({
      where: { id }
    });

    if (!sector) {
      throw { statusCode: 404, message: "Sector no encontrado" };
    }

    const [totalResidents, distinctFamilies, totalPois, totalIncidents, activeVacantHouses] =
      await Promise.all([
        prisma.user.count({ where: { sectorId: id, isActive: true } }),
        prisma.user.findMany({
          where: { sectorId: id, familyUnitCode: { not: null } },
          distinct: ["familyUnitCode"],
          select: { familyUnitCode: true }
        }),
        prisma.poiLocation.groupBy({
          by: ["type"],
          where: { sectorId: id },
          _count: { _all: true }
        }),
        prisma.incidentAlert.groupBy({
          by: ["status"],
          where: { sectorId: id },
          _count: { _all: true }
        }),
        prisma.vacantHouse.count({
          where: { sectorId: id, status: "VIGILANCIA_ACTIVA" }
        })
      ]);

    return {
      sectorId: sector.id,
      sectorName: sector.name,
      capacity: {
        maxFamilies: sector.maxFamilies,
        currentFamilies: distinctFamilies.length,
        availableSlots: Math.max(0, sector.maxFamilies - distinctFamilies.length),
        totalResidents
      },
      poisSummary: totalPois.map((p) => ({ type: p.type, count: p._count._all })),
      incidentsSummary: totalIncidents.map((i) => ({ status: i.status, count: i._count._all })),
      activeVacantHouses
    };
  }
}
