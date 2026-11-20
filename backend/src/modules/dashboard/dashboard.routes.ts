import { Router } from "express";
import { Role } from "@prisma/client";
import { DashboardController } from "./dashboard.controller.js";
import { authenticateToken, authorizeRoles } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/global", authenticateToken, authorizeRoles(Role.SUPERADMIN), DashboardController.getGlobalMetrics);
router.get("/sector", authenticateToken, DashboardController.getSectorMetrics);
router.get("/sector/:sectorId", authenticateToken, DashboardController.getSectorMetrics);

export default router;
