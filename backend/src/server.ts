import app from "./app.js";
import { ENV } from "./config/env.js";
import { prisma } from "./config/database.js";

const server = app.listen(ENV.PORT, () => {
  console.log(`Servidor de Barrio Seguro Backend iniciado exitosamente en puerto ${ENV.PORT}`);
  console.log(`Documentacion Swagger UI disponible en http://localhost:${ENV.PORT}/api/docs`);
  console.log(`Entorno activo: ${ENV.NODE_ENV}`);
});

// Cierre ordenado y gestion de señales de terminacion
async function gracefulShutdown(signal: string) {
  console.log(`Recibida señal ${signal}. Cerrando servidor y desconectando base de datos...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log("Conexion a PostgreSQL cerrada. Proceso finalizado.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
