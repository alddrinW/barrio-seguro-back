import { Router } from "express";
import { Role } from "@prisma/client";
import { UsersController } from "./users.controller.js";
import { authenticateToken, authorizeRoles } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { censusResidentSchema, updateUserRoleSchema } from "./users.schemas.js";

const router = Router();

// Censo barrial
router.post(
  "/census",
  authenticateToken,
  authorizeRoles(Role.SUPERADMIN, Role.ADMIN_SECTOR, Role.VECINO_LIDER),
  validateRequest({ body: censusResidentSchema }),
  UsersController.censusResident
);

// Consulta de censo
router.get("/sector/:sectorId", authenticateToken, UsersController.listBySector);
router.get("/census/summary/:sectorId", authenticateToken, UsersController.getCensusSummary);

// Gestion de roles
router.patch(
  "/:id/role",
  authenticateToken,
  authorizeRoles(Role.SUPERADMIN, Role.ADMIN_SECTOR),
  validateRequest({ body: updateUserRoleSchema }),
  UsersController.updateUserRole
);

export default router;
