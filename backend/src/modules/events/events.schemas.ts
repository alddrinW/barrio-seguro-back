import { z } from "zod";
import { EventType, EventStatus } from "@prisma/client";

export const createEventSchema = z
  .object({
    sectorId: z.string().uuid("El sectorId debe ser un UUID valido"),
    title: z.string().min(5, "El titulo debe tener al menos 5 caracteres"),
    description: z.string().min(10, "La descripcion debe tener al menos 10 caracteres"),
    eventType: z.nativeEnum(EventType),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().min(5, "La direccion del evento es requerida"),
    startDate: z.string().datetime("Formato de fecha de inicio ISO requerido"),
    endDate: z.string().datetime("Formato de fecha de finalizacion ISO requerido"),
    isPublic: z.boolean().default(true)
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "La fecha de fin debe ser posterior o igual a la fecha de inicio",
    path: ["endDate"]
  });

export const updateEventStatusSchema = z.object({
  status: z.nativeEnum(EventStatus)
});
