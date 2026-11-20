import { PoiType, Prisma, Role } from "@prisma/client";
import { prisma } from "../../config/database.js";
import { calculateHaversineDistanceKm, toPointFeatureCollection } from "../../utils/geo.utils.js";

export class PoisService {
  /**
   * Registro de un punto de interes geografico
   */
  static async create(
    data: {
      sectorId: string;
      name: string;
      type: PoiType;
      description?: string;
      latitude: number;
      longitude: number;
      address?: string;
      contactPhone?: string;
      openingHours?: string;
      attributes?: any;
      isVerified?: boolean;
    },
    user: { userId: string; role: Role }
  ) {
    const sector = await prisma.sector.findUnique({
      where: { id: data.sectorId }
    });

    if (!sector) {
      throw { statusCode: 404, message: "El sector no existe" };
    }

    // Regla de negocio: Si el punto es MUNICIPIO o INFOCENTRO, solo puede registrarlo ADMIN o SUPERADMIN
    if (
      (data.type === PoiType.MUNICIPIO || data.type === PoiType.INFOCENTRO) &&
      user.role !== Role.SUPERADMIN &&
      user.role !== Role.ADMIN_SECTOR
    ) {
      throw {
        statusCode: 403,
        message: "Solo administradores y autoridades pueden registrar dependencias de Municipio e Infocentros"
      };
    }

    // Si es creado por ADMIN o SUPERADMIN se aprueba automaticamente, caso contrario queda sujeto a verificacion
    const autoVerify =
      user.role === Role.SUPERADMIN ||
      user.role === Role.ADMIN_SECTOR ||
      user.role === Role.AUTORIDAD_POLICIAL;

    const poi = await prisma.poiLocation.create({
      data: {
        sectorId: data.sectorId,
        createdById: user.userId,
        name: data.name,
        type: data.type,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        contactPhone: data.contactPhone,
        openingHours: data.openingHours,
        attributes: data.attributes,
        isVerified: data.isVerified !== undefined ? data.isVerified : autoVerify
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    return poi;
  }

  /**
   * Listar POIs con filtros opcionales
   */
  static async listAll(filters?: {
    sectorId?: string;
    type?: PoiType;
    isVerified?: boolean;
    search?: string;
  }) {
    const whereClause: Prisma.PoiLocationWhereInput = {};

    if (filters?.sectorId) whereClause.sectorId = filters.sectorId;
    if (filters?.type) whereClause.type = filters.type;
    if (filters?.isVerified !== undefined) whereClause.isVerified = filters.isVerified;
    if (filters?.search) {
      whereClause.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } }
      ];
    }

    const pois = await prisma.poiLocation.findMany({
      where: whereClause,
      include: {
        sector: {
          select: { id: true, name: true, code: true }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, role: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return pois;
  }

  /**
   * Exportar POIs en formato GeoJSON FeatureCollection para visualizacion en OpenStreetMap / Leaflet
   */
  static async getGeoJson(filters?: { sectorId?: string; type?: PoiType }) {
    const whereClause: Prisma.PoiLocationWhereInput = {};
    if (filters?.sectorId) whereClause.sectorId = filters.sectorId;
    if (filters?.type) whereClause.type = filters.type;

    const pois = await prisma.poiLocation.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        latitude: true,
        longitude: true,
        address: true,
        contactPhone: true,
        openingHours: true,
        attributes: true,
        isVerified: true
      }
    });

    return toPointFeatureCollection(pois, (item) => ({
      name: item.name,
      type: item.type,
      description: item.description,
      address: item.address,
      contactPhone: item.contactPhone,
      openingHours: item.openingHours,
      attributes: item.attributes,
      isVerified: item.isVerified
    }));
  }

  /**
   * Busqueda por radio de proximidad (Haversine)
   */
  static async findNearby(params: {
    lat: number;
    lng: number;
    radiusKm: number;
    type?: PoiType;
    sectorId?: string;
  }) {
    const whereClause: Prisma.PoiLocationWhereInput = {};
    if (params.sectorId) whereClause.sectorId = params.sectorId;
    if (params.type) whereClause.type = params.type;

    const allPois = await prisma.poiLocation.findMany({
      where: whereClause,
      include: {
        sector: {
          select: { id: true, name: true }
        }
      }
    });

    const userLocation = { latitude: params.lat, longitude: params.lng };

    // Calcular distancia y filtrar por radio
    const poisWithDistance = allPois
      .map((poi) => {
        const distanceKm = calculateHaversineDistanceKm(userLocation, {
          latitude: poi.latitude,
          longitude: poi.longitude
        });
        return {
          ...poi,
          distanceKm: Number(distanceKm.toFixed(3)),
          distanceMeters: Math.round(distanceKm * 1000)
        };
      })
      .filter((poi) => poi.distanceKm <= params.radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return poisWithDistance;
  }

  /**
   * Obtener detalle de POI por ID
   */
  static async getById(id: string) {
    const poi = await prisma.poiLocation.findUnique({
      where: { id },
      include: {
        sector: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true, role: true }
        }
      }
    });

    if (!poi) {
      throw { statusCode: 404, message: "Punto de interes no encontrado" };
    }

    return poi;
  }

  /**
   * Actualizar POI
   */
  static async update(id: string, data: Partial<Prisma.PoiLocationUpdateInput>) {
    const poi = await prisma.poiLocation.findUnique({ where: { id } });
    if (!poi) {
      throw { statusCode: 404, message: "Punto de interes no encontrado" };
    }

    const updated = await prisma.poiLocation.update({
      where: { id },
      data
    });

    return updated;
  }

  /**
   * Verificar o desaprobar POI por administracion
   */
  static async setVerification(id: string, isVerified: boolean) {
    const poi = await prisma.poiLocation.findUnique({ where: { id } });
    if (!poi) {
      throw { statusCode: 404, message: "Punto de interes no encontrado" };
    }

    const updated = await prisma.poiLocation.update({
      where: { id },
      data: { isVerified }
    });

    return updated;
  }

  /**
   * Eliminar POI
   */
  static async delete(id: string) {
    const poi = await prisma.poiLocation.findUnique({ where: { id } });
    if (!poi) {
      throw { statusCode: 404, message: "Punto de interes no encontrado" };
    }

    await prisma.poiLocation.delete({ where: { id } });
    return { message: "Punto de interes eliminado correctamente" };
  }
}
