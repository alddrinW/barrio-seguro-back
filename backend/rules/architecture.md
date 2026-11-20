# Arquitectura del Sistema - Barrio Seguro Backend

## 1. Vision Arquitectonica
Barrio Seguro Backend esta diseñado como una API RESTful modular, desacoplada y fuertemente tipada sobre Node.js y TypeScript. Implementa el patron arquitectonico por capas (Layered Architecture):

```
HTTP Client / Mobile / OpenStreetMap Map
               │
               ▼
      [ Express 5 Router ]
               │
      [ Middlewares (CORS, Helmet, RateLimit, JWT Auth, Role Guard, Zod Validator) ]
               │
      [ Controllers ]  <-- Manejo de peticion / respuesta HTTP y codigos de estado
               │
      [ Services ]     <-- Logica de negocio pura, reglas de dominio e invariantes
               │
      [ Data Access / Prisma ORM ] <-- Acceso tipado a PostgreSQL 18
               │
      [ PostgreSQL 18 ] (Socket / Port 5434)
```

---

## 2. Estructura de Directorios del Backend
```
barrio-seguro-back/
├── prisma/
│   ├── schema.prisma          # Definicion del modelo relacional de datos
│   ├── seed.ts                # Semillas con datos reales de negocio
│   └── migrations/            # Historial de migraciones SQL
├── src/
│   ├── config/                # Variables de entorno y configuracion de db / jwt
│   ├── middlewares/           # Autenticacion JWT, roles, validacion Zod, error handler
│   ├── modules/
│   │   ├── auth/              # Registro, login, refresh, perfil
│   │   ├── sectors/           # Gestion territorial y capacidad (200-250 familias)
│   │   ├── users/             # Censo vecinal, unidades familiares y roles
│   │   ├── pois/              # Puntos de interes (Puntos seguros, areas verdes, negocios, turismo, municipio, infocentros)
│   │   ├── events/            # Eventos y asambleas geolocalizadas
│   │   ├── vacant-houses/     # Notificacion de casas vacias y rondas policiales
│   │   ├── incidents/         # Alertas y denuncias ciudadanas y seguimiento
│   │   └── dashboard/         # Metricas consolidadas del sector
│   ├── routes/                # Enrutador centralizado de la API v1
│   ├── utils/                 # Calculo geoespacial Haversine, formateador GeoJSON
│   ├── swagger/               # Especificacion OpenAPI 3.0 para documentacion interactiva
│   ├── app.ts                 # Configuracion de la aplicacion Express
│   └── server.ts              # Punto de entrada y levantamiento del servicio HTTP
├── docs/                      # Documentacion viva, HUs, requerimientos y reportes
├── test/                      # Bateria de pruebas de integracion contra BD real
├── tsconfig.json              # Configuracion estricta de compilador TypeScript
└── package.json               # Dependencias y scripts de ejecucion
```

---

## 3. Modelo de Datos y Entidades Principales
1. **Sector**: Entidad territorial independiente con coordenadas centrales, limites GeoJSON y capacidad (200 a 250 familias).
2. **User**: Residentes, lideres, directivos y agentes policiales con asignacion a sector y unidad familiar (`familyUnitCode`).
3. **PoiLocation**: Puntos geograficos clasificados en 6 tipos (PUNTO_SEGURO, AREA_VERDE, NEGOCIO, PUNTO_TURISTICO, MUNICIPIO, INFOCENTRO) con coordenadas WGS84.
4. **CommunityEvent**: Convocatorias barriales geolocalizadas con registro de asistencia.
5. **VacantHouse** & **VacantHouseLog**: Sistema preventivo de resguardo residencial con registro de rondas policiales.
6. **IncidentAlert** & **IncidentUpdate**: Denuncias ciudadanas categorizadas, severidades, evidencia y bitacora de atencion.
7. **AuditLog**: Trazabilidad de operaciones sensibles.
