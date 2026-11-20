import { Router } from "express";
import { Role } from "@prisma/client";
import { PoisController } from "./pois.controller.js";
import { authenticateToken, authorizeRoles } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import {
  createPoiSchema,
  updatePoiSchema,
  nearbyPoisQuerySchema,
  verifyPoiSchema
} from "./pois.schemas.js";

const router = Router();

// Consultas geoespaciales para el mapa OpenStreetMap
router.get("/geojson", authenticateToken, PoisController.getGeoJson);
router.get(
  "/nearby",
  authenticateToken,
  validateRequest({ query: nearbyPoisQuerySchema }),
  PoisController.findNearby
);
router.get("/", authenticateToken, PoisController.listAll);
router.get("/:id", authenticateToken, PoisController.getById);

// Registro de puntos geograficos
router.post(
  "/",
  authenticateToken,
  validateRequest({ body: createPoiSchema }),
  PoisController.create
);

// Modificacion de POI
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles(Role.SUPERADMIN, Role.ADMIN_SECTOR, Role.VECINO_LIDER),
  validateRequest({ body: updatePoiSchema }),
  PoisController.update
);

// Verificacion de puntos
router.patch(
  "/:id/verify",
  authenticateToken,
  authorizeRoles(Role.SUPERADMIN, Role.ADMIN_SECTOR),
  validateRequest({ body: verifyPoiSchema }),
  PoisController.setVerification
);

// Eliminacion de POI
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles(Role.SUPERADMIN, Role.ADMIN_SECTOR),
  PoisController.delete
);

export default router;
