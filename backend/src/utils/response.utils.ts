import { Response } from "express";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string | unknown;
  meta?: Record<string, unknown>;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string,
  meta?: Record<string, unknown>
): Response {
  const payload: ApiResponse<T> = {
    success: true,
    data
  };

  if (message) payload.message = message;
  if (meta) payload.meta = meta;

  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  statusCode = 400,
  message = "Ha ocurrido un error en la solicitud",
  errorDetails?: unknown
): Response {
  const payload: ApiResponse = {
    success: false,
    message
  };

  if (errorDetails) payload.error = errorDetails;

  return res.status(statusCode).json(payload);
}
