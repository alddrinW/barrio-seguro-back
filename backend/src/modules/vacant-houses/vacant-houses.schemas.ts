import { z } from "zod";
import { VacantHouseStatus } from "@prisma/client";

export const createVacantHouseSchema = z
  .object({
    sectorId: z.string().uuid("El sectorId debe ser un UUID valido"),
    propertyAddress: z.string().min(5, "La direccion del inmueble es obligatoria"),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    departureDate: z.string().datetime("Formato de fecha de salida ISO requerido"),
    returnDate: z.string().datetime("Formato de fecha de retorno ISO requerido"),
    trustedNeighborName: z.string().min(3, "El nombre del vecino de confianza es requerido"),
    trustedNeighborPhone: z.string().min(7, "Telefono del vecino de confianza invalido"),
    emergencyContactPhone: z.string().min(7, "Telefono de emergencia personal invalido"),
    specialInstructions: z.string().optional()
  })
  .refine((data) => new Date(data.returnDate) >= new Date(data.departureDate), {
    message: "La fecha de retorno debe ser posterior a la fecha de salida",
    path: ["returnDate"]
  });

export const updateVacantHouseStatusSchema = z.object({
  status: z.nativeEnum(VacantHouseStatus)
});

export const createInspectionLogSchema = z.object({
  statusFound: z.string().min(3, "El estado encontrado es obligatorio (ej. SIN_NOVEDAD)"),
  notes: z.string().min(5, "Las observaciones de la ronda son requeridas")
});
