import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { prisma } from "../../config/database.js";
import { ENV } from "../../config/env.js";

export class AuthService {
  /**
   * Registro de un nuevo residente o usuario en un sector
   */
  static async register(data: {
    sectorId: string;
    nationalId: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    familyUnitCode?: string;
    role?: Role;
  }) {
    // Verificar existencia del sector
    const sector = await prisma.sector.findUnique({
      where: { id: data.sectorId }
    });

    if (!sector) {
      throw { statusCode: 404, message: "El sector especificado no existe" };
    }

    // Verificar unicidad de email y cedula
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email }
    });
    if (existingEmail) {
      throw { statusCode: 409, message: "El correo electronico ya se encuentra registrado" };
    }

    const existingId = await prisma.user.findUnique({
      where: { nationalId: data.nationalId }
    });
    if (existingId) {
      throw { statusCode: 409, message: "La identificacion/cedula ya se encuentra registrada" };
    }

    // Validar capacidad de familias en el sector si se trata de una nueva unidad familiar
    if (data.familyUnitCode) {
      const familyExists = await prisma.user.findFirst({
        where: {
          sectorId: data.sectorId,
          familyUnitCode: data.familyUnitCode
        }
      });

      if (!familyExists) {
        // Es una nueva familia en el sector, validar conteo de familias
        const distinctFamilies = await prisma.user.findMany({
          where: {
            sectorId: data.sectorId,
            familyUnitCode: { not: null }
          },
          distinct: ["familyUnitCode"],
          select: { familyUnitCode: true }
        });

        if (distinctFamilies.length >= sector.maxFamilies) {
          throw {
            statusCode: 400,
            message: `El sector ha alcanzado su capacidad maxima permitida de ${sector.maxFamilies} familias. Debe registrar un nuevo sector.`
          };
        }
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        sectorId: data.sectorId,
        nationalId: data.nationalId,
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        address: data.address,
        familyUnitCode: data.familyUnitCode || `FAM-${Date.now().toString().slice(-4)}`,
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

    return user;
  }

  /**
   * Autenticacion de usuario y emision de token JWT
   */
  static async login(credentials: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
      include: {
        sector: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true
          }
        }
      }
    });

    if (!user) {
      throw { statusCode: 401, message: "Credenciales de acceso invalidas" };
    }

    if (!user.isActive) {
      throw { statusCode: 403, message: "Cuenta de usuario inactiva o suspendida" };
    }

    const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!isPasswordValid) {
      throw { statusCode: 401, message: "Credenciales de acceso invalidas" };
    }

    // Actualizar fecha de ultimo acceso
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sectorId: user.sectorId,
      familyUnitCode: user.familyUnitCode
    };

    const token = jwt.sign(tokenPayload, ENV.JWT_SECRET, {
      expiresIn: ENV.JWT_EXPIRES_IN as any
    });

    return {
      token,
      user: {
        id: user.id,
        nationalId: user.nationalId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        address: user.address,
        familyUnitCode: user.familyUnitCode,
        role: user.role,
        sector: user.sector
      }
    };
  }

  /**
   * Obtener perfil del usuario autenticado
   */
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sector: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
            centerLat: true,
            centerLng: true,
            status: true
          }
        }
      }
    });

    if (!user) {
      throw { statusCode: 404, message: "Usuario no encontrado" };
    }

    const { passwordHash: _, ...userProfile } = user;
    return userProfile;
  }

  /**
   * Cambio de contraseña
   */
  static async changePassword(userId: string, data: { currentPassword: string; newPassword: string }) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw { statusCode: 404, message: "Usuario no encontrado" };
    }

    const isMatch = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw { statusCode: 400, message: "La contraseña actual no es correcta" };
    }

    const newHash = await bcrypt.hash(data.newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash }
    });

    return { message: "Contraseña actualizada exitosamente" };
  }
}
