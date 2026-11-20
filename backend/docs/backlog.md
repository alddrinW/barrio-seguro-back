# Backlog Maestro del Proyecto - Barrio Seguro (Backend)

Este documento centraliza el estado de planificacion, desarrollo, cobertura de pruebas y trazabilidad de los requerimientos e historias de usuario (HU) del sistema backend **Barrio Seguro**.

---

## 1. Tabla de Trazabilidad y Estado de Historias de Usuario

| Codigo | Titulo de la Historia de Usuario | Modulo | Prioridad | Endpoints Principales | Estado |
|---|---|---|---|---|---|
| **HU-001** | Registro y Gestion Independiente de Sectores y Barrios | Territorio / Sectores | Critica | `POST /api/sectors`, `GET /api/sectors`, `GET /api/sectors/:id`, `GET /api/sectors/:id/stats` | **Completada y Verificada** |
| **HU-002** | Autenticacion Segura y Gobernanza de Roles | Seguridad y Accesos | Critica | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/profile` | **Completada y Verificada** |
| **HU-003** | Censo Familiar y Control de Capacidad por Sector | Censo y Poblacion | Alta | `POST /api/users/census`, `GET /api/users/census/summary/:sectorId` | **Completada y Verificada** |
| **HU-004** | Mapeo y Registro Geografico de Puntos Seguros y Areas Verdes | Mapeo Espacial OSM | Alta | `POST /api/pois`, `GET /api/pois`, `GET /api/pois/geojson`, `GET /api/pois/nearby` | **Completada y Verificada** |
| **HU-005** | Registro y Mapeo de Negocios Locales y Puntos Turisticos | Reactivacion Local | Media-Alta | `POST /api/pois`, `PATCH /api/pois/:id/verify`, `GET /api/pois` | **Completada y Verificada** |
| **HU-006** | Integracion y Mapeo de Puntos Clave Institucionales | Articulacion Institucional | Alta | `POST /api/pois` (tipo MUNICIPIO, INFOCENTRO), `GET /api/pois` | **Completada y Verificada** |
| **HU-007** | Convocatoria y Manejo de Eventos Barriales Geolocalizados | Participacion Ciudadana | Alta | `POST /api/events`, `GET /api/events`, `POST /api/events/:id/attend` | **Completada y Verificada** |
| **HU-008** | Modulo Preventivo de Notificacion y Vigilancia de Casas Vacias | Prevencion Situacional | Critica | `POST /api/vacant-houses`, `GET /api/vacant-houses`, `POST /api/vacant-houses/:id/inspections` | **Completada y Verificada** |
| **HU-009** | Emision y Geolocalizacion de Alertas y Denuncias Ciudadanas | Seguridad Reactiva | Critica | `POST /api/incidents`, `GET /api/incidents`, `GET /api/incidents/geojson` | **Completada y Verificada** |
| **HU-010** | Seguimiento, Resolucion y Bitacora de Seguridad de Denuncias | Operaciones de Seguridad | Alta | `PATCH /api/incidents/:id/status`, `GET /api/incidents/:id/updates` | **Completada y Verificada** |

---

## 2. Fases de Implementacion del Backend

### Fase 1: Arquitectura, Persistencia y Base de Datos (PostgreSQL + Prisma)
- [x] Inicializacion de cluster PostgreSQL y base de datos `barrio_seguro_db`.
- [x] Definicion de schema Prisma (`prisma/schema.prisma`) con todas las entidades, relaciones e indices espaciales.
- [x] Ejecucion de migraciones de base de datos (`npx prisma db push`).
- [x] Creacion del seeder maestro con datos semanticos reales y verificables (`prisma/seed.ts`).

### Fase 2: Nucleo de Seguridad y Control de Acceso
- [x] Middleware de autenticacion JWT (`authenticateToken`).
- [x] Middleware de autorizacion basada en roles (`authorizeRoles`).
- [x] Controladores y servicios de autenticacion (`/api/auth`).

### Fase 3: Modulo de Territorio y Censo Barrial
- [x] Modulo de Sectores con soporte GeoJSON y limite de 200 a 250 familias (`/api/sectors`).
- [x] Modulo de Censo y Residentes agrupados por unidades familiares (`/api/users`).

### Fase 4: Modulo de Puntos de Interes y OpenStreetMap
- [x] Modulo de POIs (Puntos Seguros, Areas Verdes, Negocios, Turismo, Municipio, Infocentros).
- [x] Consultas de proximidad espacial (Haversine) y exportacion FeatureCollection GeoJSON (`/api/pois/geojson`).

### Fase 5: Modulo de Eventos y Asambleas
- [x] Modulo de eventos comunitarios geolocalizados y confirmacion de asistencia (`/api/events`).

### Fase 6: Modulo de Casas Vacias y Denuncias Ciudadanas
- [x] Modulo preventivo de Casas Vacias y bitacora de patrullaje (`/api/vacant-houses`).
- [x] Modulo reactivo de Denuncias Ciudadanas, severidades y actualizaciones operativas (`/api/incidents`).
- [x] Dashboard analitico e indicadores barriales (`/api/dashboard`).

### Fase 7: Documentacion OpenAPI / Swagger y Pruebas con BD Real
- [x] Configuracion de Swagger UI en `/api/docs`.
- [x] Pruebas automatizadas de integracion contra PostgreSQL real (`npm test` con 10/10 pruebas pasando).
- [x] Eliminacion de scripts temporales de prueba.
- [x] Generacion de reporte de backend en `docs/docs_backend/report-backend-barrio-seguro.md`.
