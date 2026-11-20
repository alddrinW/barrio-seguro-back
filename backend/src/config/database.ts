import { PrismaClient } from "@prisma/client";

// Instancia singleton de PrismaClient para gestion del ciclo de vida de conexiones PostgreSQL
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
});
