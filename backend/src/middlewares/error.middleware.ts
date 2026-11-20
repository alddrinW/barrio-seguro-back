import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response.utils.js";

/**
 * Middleware centralizado de gestion de errores y excepciones no controladas
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Error interno del servidor";

  // Registro en consola para depuracion en desarrollo
  if (process.env.NODE_ENV === "development") {
    console.error(`[ERROR HTTP ${statusCode}]: ${req.method} ${req.originalUrl}`);
    console.error(err);
  }

  sendError(
    res,
    statusCode,
    message,
    process.env.NODE_ENV === "development" ? err.stack : undefined
  );
}
