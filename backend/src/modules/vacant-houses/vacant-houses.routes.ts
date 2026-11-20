import { Router } from "express";
import { Role } from "@prisma/client";
import { VacantHousesController } from "./vacant-houses.controller.js";
import { authenticateToken, authorizeRoles } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import {
  createVacantHouseSchema,
  updateVacantHouseStatusSchema,
  createInspectionLogSchema
} from "./vacant-houses.schemas.js";

const router = Router();

// Consultas y registro de solicitud por residentes
router.get("/", authenticateToken, VacantHousesController.list);
router.get("/:id", authenticateToken, VacantHousesController.getById);
router.post(
  "/",
  authenticateToken,
  validateRequest({ body: createVacantHouseSchema }),
  VacantHousesController.create
);

// Actualizar estado de vigilancia
router.patch(
  "/:id/status",
  authenticateToken,
  validateRequest({ body: updateVacantHouseStatusSchema }),
  VacantHousesController.updateStatus
);

// Rondas de patrullaje e inspeccion (Policia y Administracion de Sector)
router.post(
  "/:id/inspections",
  authenticateToken,
  authorizeRoles(Role.SUPERADMIN, Role.ADMIN_SECTOR, Role.AUTORIDAD_POLICIAL),
  validateRequest({ body: createInspectionLogSchema }),
  VacantHousesController.addInspectionLog
);

router.get("/:id/inspections", authenticateToken, VacantHousesController.getInspectionLogs);

export default router;
