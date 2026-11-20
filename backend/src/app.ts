import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { ENV } from "./config/env.js";
import routes from "./routes/index.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app: Application = express();

// Middlewares de seguridad y observabilidad
app.use(helmet());
app.use(cors({ origin: ENV.CORS_ORIGIN }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (ENV.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Prefijo global de la API
app.use("/api", routes);

// Middleware centralizado de gestion de errores
app.use(errorHandler);

export default app;
