import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "fs";
import { join } from "path";
import authRoutes from "../modules/auth/auth.routes.js";
import sectorsRoutes from "../modules/sectors/sectors.routes.js";
import usersRoutes from "../modules/users/users.routes.js";
import poisRoutes from "../modules/pois/pois.routes.js";
import eventsRoutes from "../modules/events/events.routes.js";
import vacantHousesRoutes from "../modules/vacant-houses/vacant-houses.routes.js";
import incidentsRoutes from "../modules/incidents/incidents.routes.js";
import dashboardRoutes from "../modules/dashboard/dashboard.routes.js";

const router = Router();

// Carga de la especificacion OpenAPI 3.0
const swaggerDocument = JSON.parse(
  readFileSync(join(process.cwd(), "src/swagger/swagger.json"), "utf8")
);

// Documentacion interactiva Swagger UI
router.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Enrutamiento modular por dominios
router.use("/auth", authRoutes);
router.use("/sectors", sectorsRoutes);
router.use("/users", usersRoutes);
router.use("/pois", poisRoutes);
router.use("/events", eventsRoutes);
router.use("/vacant-houses", vacantHousesRoutes);
router.use("/incidents", incidentsRoutes);
router.use("/dashboard", dashboardRoutes);

// Endpoint de verificacion de salud (Health check)
router.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "Barrio Seguro Backend",
    version: "1.0.0"
  });
});

export default router;
