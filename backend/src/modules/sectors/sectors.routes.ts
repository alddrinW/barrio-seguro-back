import { Router } from "express";
import { Role } from "@prisma/client";
import { SectorsController } from "./sectors.controller.js";
import { authenticateToken, authorizeRoles } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { createSectorSchema, updateSectorSchema } from "./sectors.schemas.js";

const router = Router();

// Consultas publicas o para usuarios autenticados
router.get("/", authenticateToken, SectorsController.listAll);
router.get("/:id", authenticateToken, SectorsController.getById);
router.get("/:id/stats", authenticateToken, SectorsController.getStats);

// Operaciones restringidas a Superadministradores y Administradores de Sector
router.post(
  "/",
  authenticateToken,
  authorizeRoles(Role.SUPERADMIN),
  validateRequest({ body: createSectorSchema }),
  SectorsController.create
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles(Role.SUPERADMIN, Role.ADMIN_SECTOR),
  validateRequest({ body: updateSectorSchema }),
  SectorsController.update
);

export default router;
