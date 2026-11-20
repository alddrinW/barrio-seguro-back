import { z } from "zod";
import { Role } from "@prisma/client";

export const censusResidentSchema = z.object({
  sectorId: z.string().uuid("El sectorId debe ser un UUID valido"),
  nationalId: z.string().min(5, "La identificacion/cedula debe tener al menos 5 caracteres"),
  email: z.string().email("Formato de correo electronico invalido"),
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  phone: z.string().min(7, "El telefono debe tener al menos 7 digitos"),
  address: z.string().min(5, "La direccion debe ser especifica"),
  familyUnitCode: z.string().min(3, "El codigo de unidad familiar es obligatorio"),
  role: z.nativeEnum(Role).default(Role.RESIDENTE),
  password: z
    .string()
    .min(8, "La contraseña temporal debe tener al menos 8 caracteres")
    .optional()
});

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(Role),
  isActive: z.boolean().optional()
});
