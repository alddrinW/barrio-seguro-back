# HU-001: Registro y Gestion Independiente de Sectores y Barrios

## 1. Metadatos
- Codigo: HU-001
- Modulo: Gestion de Territorio y Sectores
- Prioridad: Critica
- Responsable: Backend Core Team
- Estado: Aprobada

## 2. Definicion Estandar
Como Superadministrador o Representante Barrial Municipal,
quiero registrar y configurar sectores o barrios de forma independiente con sus limites geograficos y limites de capacidad,
para que cada comunidad cuente con una gestion autonoma, segura y descentralizada de su territorio.

## 3. Contexto de Negocio Justificado
Las ciudades presentan dinámicas comunitarias heterogeneas. Para que las estrategias de seguridad sean efectivas, cada barrio requiere autonomia operativa sin interferir con barrios colindantes. Se requiere una delimitacion geográfica precisa compatible con OpenStreetMap y un control de capacidad objetivo (200 a 250 familias) para evitar hacinamiento o sobrecarga en la organizacion vecinal.

## 4. Precondiciones
- El usuario solicitante debe poseer el rol SUPERADMIN autenticado con token JWT valido.
- El codigo unico del sector (ej. SEC-FLOR-01) no debe existir previamente en la base de datos.
- Las coordenadas de referencia (centro y poligono) deben respetar el estandar WGS84.

## 5. Flujo Principal (Happy Path)
1. El solicitante envia una peticion POST a `/api/sectors` con datos de identificacion, codigo, coordenadas de centro, poligono GeoJSON opcional y parametro de capacidad maxima de familias (200-250).
2. El sistema valida la integridad de los datos mediante el esquema de validacion Zod.
3. El sistema verifica la unicidad del codigo de sector y nombre.
4. El sistema registra el nuevo sector en estado `ACTIVO` en la base de datos PostgreSQL.
5. El sistema emite un log de auditoria registrando la accion del Superadministrador.
6. El sistema retorna codigo HTTP 201 Created con el objeto del sector creado y sus metadatos territoriales.

## 6. Flujos Alternativos y Excepciones
- FA-01 (Codigo duplicado): Si el codigo del sector ya existe, el sistema retorna 409 Conflict con mensaje descriptivo.
- FA-02 (Capacidad invalida): Si el valor de familias maximas es menor a 1 o superior a 500 fuera del rango operativo barrial, el sistema rechaza la solicitud con 422 Unprocessable Entity.
- FA-03 (Coordenadas invalidas): Si la latitud esta fuera del rango [-90, 90] o la longitud fuera de [-180, 180], se retorna 400 Bad Request.

## 7. Criterios de Aceptacion (Gherkin)
```gherkin
Escenario: Registro exitoso de un sector independiente
  Dado que un usuario autenticado con rol "SUPERADMIN" envia los datos:
    | nombre | Sector La Floresta |
    | codigo | SEC-FLOR-01 |
    | ciudad | Quito |
    | maxFamilias | 250 |
    | centerLat | -0.2104 |
    | centerLng | -78.4891 |
  Cuando la peticion POST es procesada por el endpoint "/api/sectors"
  Entonces el sistema responde con codigo de estado 201
  Y el cuerpo contiene el identificador UUID del sector con status "ACTIVO".

Escenario: Rechazo por codigo de sector duplicado
  Dado que existe un sector registrado con codigo "SEC-FLOR-01"
  Cuando un usuario intenta registrar otro sector con el mismo codigo "SEC-FLOR-01"
  Entonces el sistema responde con codigo 409
  Y el mensaje de error indica "El codigo de sector ya se encuentra registrado".

Escenario: Consulta de sectores con soporte geoespacial
  Dado que existen 3 sectores registrados en la base de datos
  Cuando un usuario autenticado realiza una peticion GET a "/api/sectors"
  Entonces el sistema responde con codigo 200
  Y la lista incluye coordenadas WGS84 y porcentaje de ocupacion de familias.
```

## 8. Reglas de Negocio e Invariantes
- RN-01.1: El codigo de sector es inmutable tras su creacion y debe seguir el patron alfanumerico con guiones.
- RN-01.2: La capacidad maxima por defecto es 250 familias para preservar la cohesion comunitaria.
- RN-01.3: La inactivacion de un sector no elimina sus registros historicos de incidentes ni bitacoras.

## 9. Especificaciones de API Contract
- Endpoint: `POST /api/sectors`
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Request Body:
```json
{
  "name": "Sector Bellavista - Norte",
  "code": "SEC-BV-01",
  "description": "Sector residencial Bellavista Alta",
  "city": "Quito",
  "provinceState": "Pichincha",
  "postalCode": "170150",
  "centerLat": -0.1834,
  "centerLng": -78.4725,
  "maxFamilies": 250,
  "boundaryGeoJson": null
}
```
- Response (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "b3e34b12-9c1a-4d43-85f2-95b6cf716d11",
    "name": "Sector Bellavista - Norte",
    "code": "SEC-BV-01",
    "status": "ACTIVO",
    "maxFamilies": 250,
    "currentFamiliesCount": 0,
    "createdAt": "2026-11-13T16:00:00.000Z"
  }
}
```

## 10. Endpoints y Modelos de Base de Datos
- Endpoints:
  - `POST /api/sectors` (Crear sector)
  - `GET /api/sectors` (Listar sectores)
  - `GET /api/sectors/:id` (Detalle de sector)
  - `PUT /api/sectors/:id` (Actualizar sector)
  - `GET /api/sectors/:id/stats` (Estadisticas y censo del sector)
- Modelos Prisma: `Sector`, `AuditLog`.

## 11. Pruebas con BD Real y Limpieza de Scripts
- Todas las validaciones de unicidad y limites geograficos deben comprobarse con inserciones directas sobre PostgreSQL.
- Los scripts temporales de integracion deben ejecutarse y eliminarse inmediatamente tras la verificacion.
