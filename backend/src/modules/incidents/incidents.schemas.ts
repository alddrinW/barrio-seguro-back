import { z } from "zod";
import { IncidentCategory, IncidentSeverity, IncidentStatus } from "@prisma/client";

export const createIncidentSchema = z.object({
  sectorId: z.string().uuid("El sectorId debe ser un UUID valido"),
  category: z.nativeEnum(IncidentCategory),
  severity: z.nativeEnum(IncidentSeverity),
  title: z.string().min(5, "El titulo debe tener al menos 5 caracteres"),
  description: z.string().min(10, "La descripcion debe tener al menos 10 caracteres"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  addressReference: z.string().min(3, "La referencia de ubicacion es obligatoria"),
  isAnonymous: z.boolean().default(false),
  evidenceUrls: z.array(z.string().url("URL de evidencia invalida")).default([])
});

export const updateIncidentStatusSchema = z.object({
  status: z.nativeEnum(IncidentStatus),
  comment: z.string().min(5, "El comentario de actualizacion es obligatorio"),
  officerBadge: z.string().optional()
});

export const addIncidentUpdateSchema = z.object({
  comment: z.string().min(5, "El comentario u observacion es obligatorio"),
  status: z.nativeEnum(IncidentStatus).optional(),
  officerBadge: z.string().optional()
});
