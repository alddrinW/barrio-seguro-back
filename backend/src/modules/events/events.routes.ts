import { Router } from "express";
import { Role } from "@prisma/client";
import { EventsController } from "./events.controller.js";
import { authenticateToken, authorizeRoles } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { createEventSchema, updateEventStatusSchema } from "./events.schemas.js";

const router = Router();

// Consultas de eventos
router.get("/", authenticateToken, EventsController.listAll);
router.get("/:id", authenticateToken, EventsController.getById);

// Creacion de eventos (lideres, administradores y policias)
router.post(
  "/",
  authenticateToken,
  authorizeRoles(Role.SUPERADMIN, Role.ADMIN_SECTOR, Role.VECINO_LIDER, Role.AUTORIDAD_POLICIAL),
  validateRequest({ body: createEventSchema }),
  EventsController.create
);

// Confirmacion y cancelacion de asistencia
router.post("/:id/attend", authenticateToken, EventsController.attend);
router.delete("/:id/attend", authenticateToken, EventsController.cancelAttendance);

// Actualizacion de estado
router.patch(
  "/:id/status",
  authenticateToken,
  authorizeRoles(Role.SUPERADMIN, Role.ADMIN_SECTOR, Role.VECINO_LIDER),
  validateRequest({ body: updateEventStatusSchema }),
  EventsController.updateStatus
);

export default router;
