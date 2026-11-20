import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "../../config/database.js";

export class UsersService {
  /**
   * Censo de residentes con validacion de capacidad barrial (200 a 250 familias)
   */
  static async censusResident(data: {
    sectorId: string;
    nationalId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    familyUnitCode: string;
    role?: Role;
    password?: string;
  }) {
    const sector = await prisma.sector.findUnique({
      where: { id: data.sectorId }
    });

    if (!sector) {
      throw { statusCode: 404, message: "El sector no existe" };
    }

    // Verificar si la cedula o email ya existen
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ nationalId: data.nationalId }, { email: data.email }]
      }
    });

    if (existingUser) {
      throw {
        statusCode: 409,
        message: "Ya existe un usuario registrado con esa cedula o correo electronico"
      };
    }

    // Control de capacidad: verificar si la unidad familiar ya existe en el sector
    const familyMemberExists = await prisma.user.findFirst({
      where: {
        sectorId: data.sectorId,
        familyUnitCode: data.familyUnitCode
      }
    });

    if (!familyMemberExists) {
      // Es una nueva unidad familiar en el sector
      const currentFamilies = await prisma.user.findMany({
        where: {
          sectorId: data.sectorId,
          familyUnitCode: { not: null }
        },
        distinct: ["familyUnitCode"],
        select: { familyUnitCode: true }
      });

      if (currentFamilies.length >= sector.maxFamilies) {
        throw {
          statusCode: 400,
          message: `El sector ha alcanzado su capacidad maxima permitida de ${sector.maxFamilies} familias. No es posible censar nuevas familias.`
        };
      }
    }

    const defaultPassword = data.password || "VecinoSeguro2026!";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        sectorId: data.sectorId,
        nationalId: data.nationalId,
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        address: data.address,
        familyUnitCode: data.familyUnitCode,
        role: data.role || Role.RESIDENTE
      },
      select: {
        id: true,
        nationalId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        familyUnitCode: true,
        role: true,
        sectorId: true,
        createdAt: true
      }
    });

    // Calcular ocupacion resultante
    const updatedDistinctFamilies = await prisma.user.findMany({
      where: {
        sectorId: data.sectorId,
        familyUnitCode: { not: null }
      },
      distinct: ["familyUnitCode"],
      select: { familyUnitCode: true }
    });

    return {
      user: newUser,
      censusSummary: {
        sectorId: sector.id,
        sectorName: sector.name,
        currentFamiliesCount: updatedDistinctFamilies.length,
        maxFamilies: sector.maxFamilies,
        availableFamilySlots: Math.max(0, sector.maxFamilies - updatedDistinctFamilies.length)
      }
    };
  }

  /**
   * Listar usuarios censados por sector
   */
  static async listBySector(sectorId: string, roleFilter?: Role) {
    const whereClause: any = { sectorId };
    if (roleFilter) whereClause.role = roleFilter;

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        nationalId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        familyUnitCode: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true
      },
      orderBy: [{ familyUnitCode: "asc" }, { lastName: "asc" }]
    });

    return users;
  }

  /**
   * Resumen del censo barrial por sector
   */
  static async getCensusSummary(sectorId: string) {
    const sector = await prisma.sector.findUnique({
      where: { id: sectorId }
    });

    if (!sector) {
      throw { statusCode: 404, message: "Sector no encontrado" };
    }

    const [totalResidents, distinctFamilies, roleDistribution] = await Promise.all([
      prisma.user.count({ where: { sectorId, isActive: true } }),
      prisma.user.findMany({
        where: { sectorId, familyUnitCode: { not: null } },
        distinct: ["familyUnitCode"],
        select: { familyUnitCode: true }
      }),
      prisma.user.groupBy({
        by: ["role"],
        where: { sectorId, isActive: true },
        _count: { _all: true }
      })
    ]);

    return {
      sectorId: sector.id,
      sectorName: sector.name,
      totalResidents,
      totalFamilies: distinctFamilies.length,
      maxFamiliesCapacity: sector.maxFamilies,
      occupancyPercentage: Number(
        ((distinctFamilies.length / sector.maxFamilies) * 100).toFixed(1)
      ),
      roles: roleDistribution.map((r) => ({ role: r.role, count: r._count._all }))
    };
  }

  /**
   * Actualizar rol y estado del usuario
   */
  static async updateUserRole(userId: string, data: { role: Role; isActive?: boolean }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw { statusCode: 404, message: "Usuario no encontrado" };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        role: data.role,
        isActive: data.isActive !== undefined ? data.isActive : user.isActive
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    return updated;
  }
}
