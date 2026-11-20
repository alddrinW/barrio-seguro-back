import { z } from "zod";
import { Role } from "@prisma/client";

export const registerSchema = z.object({
  sectorId: z.string().uuid("El sectorId debe ser un UUID valido"),
  nationalId: z.string().min(5, "La identificacion debe tener al menos 5 caracteres"),
  email: z.string().email("Formato de correo electronico invalido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "La contraseña debe contener al menos una mayuscula")
    .regex(/[0-9]/, "La contraseña debe contener al menos un numero"),
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  phone: z.string().min(7, "El telefono debe tener al menos 7 digitos"),
  address: z.string().min(5, "La direccion debe ser especifica"),
  familyUnitCode: z.string().optional(),
  role: z.nativeEnum(Role).optional()
});

export const loginSchema = z.object({
  email: z.string().email("Formato de correo electronico invalido"),
  password: z.string().min(1, "La contraseña es requerida")
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida"),
  newPassword: z
    .string()
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "La nueva contraseña debe contener al menos una mayuscula")
    .regex(/[0-9]/, "La nueva contraseña debe contener al menos un numero")
});
