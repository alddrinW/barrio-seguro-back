import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { ENV } from "../config/env.js";
import { prisma } from "../config/database.js";
import { sendError } from "../utils/response.utils.js";

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: Role;
  sectorId: string;
  familyUnitCode?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

/**
 * Middleware para validar el token JWT en el encabezado Authorization
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    sendError(res, 401, "Cabecera de autenticacion requerida o formato Bearer invalido");
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as AuthUserPayload;

    // Verificacion de existencia y vigencia del usuario en base de datos
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, isActive: true, role: true, sectorId: true, familyUnitCode: true }
    });

    if (!user || !user.isActive) {
      sendError(res, 403, "Usuario inactivo, suspendido o no encontrado");
      return;
    }

    req.user = {
      userId: user.id,
      email: decoded.email,
      role: user.role,
      sectorId: user.sectorId,
      familyUnitCode: user.familyUnitCode
    };

    next();
  } catch (error) {
    sendError(res, 401, "Token de autenticacion invalido o expirado");
    return;
  }
}

/**
 * Middleware para autorizacion basada en roles (RBAC)
 */
export function authorizeRoles(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, "Usuario no autenticado");
      return;
    }

    // El rol SUPERADMIN tiene acceso transversal
    if (req.user.role === Role.SUPERADMIN) {
      next();
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        403,
        "No posee los permisos necesarios para realizar esta operacion"
      );
      return;
    }

    next();
  };
}
