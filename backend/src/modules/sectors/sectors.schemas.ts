import { z } from "zod";
import { SectorStatus } from "@prisma/client";

export const createSectorSchema = z.object({
  name: z.string().min(3, "El nombre del sector debe tener al menos 3 caracteres"),
  code: z
    .string()
    .min(3, "El codigo debe tener al menos 3 caracteres")
    .regex(/^[A-Z0-9-]+$/, "El codigo debe contener mayusculas, numeros y guiones"),
  description: z.string().optional(),
  city: z.string().min(2, "La ciudad es requerida"),
  provinceState: z.string().min(2, "La provincia o estado es requerido"),
  postalCode: z.string().optional(),
  centerLat: z.number().min(-90).max(90, "Latitud invalida"),
  centerLng: z.number().min(-180).max(180, "Longitud invalida"),
  maxFamilies: z
    .number()
    .int()
    .min(50, "La capacidad minima es de 50 familias")
    .max(500, "La capacidad maxima es de 500 familias")
    .default(250),
  boundaryGeoJson: z.any().optional(),
  status: z.nativeEnum(SectorStatus).optional()
});

export const updateSectorSchema = createSectorSchema.partial();
