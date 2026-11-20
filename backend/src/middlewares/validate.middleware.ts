import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { sendError } from "../utils/response.utils.js";

/**
 * Middleware para validacion estricta de esquemas Zod en body, query o params
 */
export function validateRequest(schema: {
  body?: ZodSchema<any>;
  query?: ZodSchema<any>;
  params?: ZodSchema<any>;
}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        const parsedQuery = await schema.query.parseAsync(req.query);
        // En Express 5, req.query puede ser un getter de solo lectura; usamos Object.assign
        Object.assign(req.query, parsedQuery);
      }
      if (schema.params) {
        const parsedParams = await schema.params.parseAsync(req.params);
        Object.assign(req.params, parsedParams);
      }
      next();
    } catch (error: any) {
      if (error instanceof ZodError || error?.name === "ZodError" || error?.issues) {
        const rawIssues = error.issues || error.errors || [];
        const issues = rawIssues.map((e: any) => ({
          field: Array.isArray(e.path) ? e.path.join(".") : String(e.path || ""),
          message: e.message
        }));
        sendError(res, 400, "Error en los datos de entrada", issues);
        return;
      }
      console.error("[VALIDATE_MIDDLEWARE_ERROR]:", error);
      sendError(res, 400, error.message || "Solicitud invalida");
      return;
    }
  };
}
