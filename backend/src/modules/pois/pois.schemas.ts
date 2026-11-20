import { z } from "zod";
import { PoiType } from "@prisma/client";

export const createPoiSchema = z.object({
  sectorId: z.string().uuid("El sectorId debe ser un UUID valido"),
  name: z.string().min(3, "El nombre del punto debe tener al menos 3 caracteres"),
  type: z.nativeEnum(PoiType),
  description: z.string().optional(),
  latitude: z.number().min(-90).max(90, "Latitud decimal invalida"),
  longitude: z.number().min(-180).max(180, "Longitud decimal invalida"),
  address: z.string().optional(),
  contactPhone: z.string().optional(),
  openingHours: z.string().optional(),
  attributes: z.any().optional(),
  isVerified: z.boolean().optional()
});

export const updatePoiSchema = createPoiSchema.partial();

export const nearbyPoisQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().positive().max(50).default(3),
  type: z.nativeEnum(PoiType).optional(),
  sectorId: z.string().uuid().optional()
});

export const verifyPoiSchema = z.object({
  isVerified: z.boolean()
});
