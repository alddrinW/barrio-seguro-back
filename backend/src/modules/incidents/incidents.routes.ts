import { Router } from "express";
import { Role } from "@prisma/client";
import { IncidentsController } from "./incidents.controller.js";
import { authenticateToken, authorizeRoles } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import {
  createIncidentSchema,
  updateIncidentStatusSchema,
  addIncidentUpdateSchema
} from "./incidents.schemas.js";

const router = Router();

// Mapa GeoJSON de incidentes
router.get("/geojson", authenticateToken, IncidentsController.getGeoJson);

// Listado y detalle
router.get("/", authenticateToken, IncidentsController.listAll);
router.get("/:id", authenticateToken, IncidentsController.getById);

// Emision de alerta ciudadana
router.post(
  "/",
  authenticateToken,
  validateRequest({ body: createIncidentSchema }),
  IncidentsController.create
);

// Actualizacion de estado operativo (Policia, Admin Sector, Superadmin)
router.patch(
  "/:id/status",
  authenticateToken,
  authorizeRoles(Role.SUPERADMIN, Role.ADMIN_SECTOR, Role.AUTORIDAD_POLICIAL, Role.VECINO_LIDER),
  validateRequest({ body: updateIncidentStatusSchema }),
  IncidentsController.updateStatus
);

// Agregar nota o comentario de seguimiento
router.post(
  "/:id/updates",
  authenticateToken,
  validateRequest({ body: addIncidentUpdateSchema }),
  IncidentsController.addUpdate
);

export default router;
