# HU-007: Convocatoria y Manejo de Eventos y Reuniones Barriales Geolocalizadas

## 1. Metadatos
- Codigo: HU-007
- Modulo: Participacion Ciudadana y Eventos
- Prioridad: Alta
- Responsable: Backend Feature Team
- Estado: Aprobada

## 2. Definicion Estandar
Como Lider Barrial, Directiva o Autoridad,
quiero convocar y compartir eventos, asambleas de seguridad, mingas y reuniones comunitarias geolocalizadas,
para que los residentes conozcan el lugar exacto en el mapa, agenda, fecha y puedan confirmar su asistencia.

## 3. Contexto de Negocio Justificado
La seguridad ciudadana no se limita a la reaccion policial, sino a la cohesion comunitaria. Las asambleas barriales, mingas de recuperacion de espacios publicos y simulacros de evacuacion requieren difusion clara, fechas, agendas y puntos de encuentro fisicos marcados sobre el mapa OpenStreetMap.

## 4. Precondiciones
- El usuario creador debe contar con rol `VECINO_LIDER`, `ADMIN_SECTOR` o `AUTORIDAD_POLICIAL`.
- La fecha de inicio debe ser posterior o igual al momento de la publicacion.
- Se debe proveer la ubicacion geografica (lat/lng) del punto de reunion.

## 5. Flujo Principal (Happy Path)
1. El usuario autorizado envia una peticion POST a `/api/events` con titulo, descripcion, tipo de evento (`ASAMBLEA_BARRIAL`, `MINGA_COMUNITARIA`, `SIMULACRO_SEGURIDAD`, `REUNION_SEGURIDAD`, `ACTIVIDAD_DEPORTIVA_CULTURAL`), fecha/hora de inicio y fin, direccion y coordenadas geográficas.
2. El sistema valida los campos y asocia el evento al sector.
3. El evento nace con estado `PROGRAMADO`.
4. Los residentes del sector consultan `GET /api/events` o `GET /api/events/map` para ubicarlo en el mapa interactivo.
5. Los residentes pueden confirmar su participacion mediante `POST /api/events/:id/attend`.
6. El contador de asistentes se actualiza en tiempo real.

## 6. Flujos Alternativos y Excepciones
- FA-01 (Fecha inconsistente): Si `endDate` es anterior a `startDate`, el sistema responde con 400 Bad Request.
- FA-02 (Cancelacion de evento): El organizador o administrador puede cambiar el estado a `CANCELADO` mediante `PATCH /api/events/:id/status`, notificando en el endpoint el motivo.
- FA-03 (Filtro por proximos eventos): El usuario filtra con `GET /api/events?status=PROGRAMADO&upcoming=true`.

## 7. Criterios de Aceptacion (Gherkin)
```gherkin
Escenario: Convocatoria exitosa de una asamblea de seguridad
  Dado que un usuario con rol "VECINO_LIDER" envia:
    | titulo | Asamblea de Seguridad Manzana 4 |
    | tipo | REUNION_SEGURIDAD |
    | startDate | 2026-11-20T19:00:00Z |
    | endDate | 2026-11-20T21:00:00Z |
    | latitud | -0.2105 |
    | longitud | -78.4882 |
  Cuando la peticion es enviada a "POST /api/events"
  Entonces el sistema responde con codigo 201
  Y el evento queda con status "PROGRAMADO" y contador de asistentes en 0.

Escenario: Confirmacion de asistencia de un residente
  Dado que existe un evento con status "PROGRAMADO"
  Cuando un residente autenticado envia una peticion "POST /api/events/:id/attend"
  Entonces el sistema responde con codigo 200
  Y el campo "attendeesCount" se incrementa en 1.

Escenario: Duplicidad de confirmacion de asistencia
  Dado que un residente ya confirmo su asistencia al evento
  Cuando vuelve a invocar "POST /api/events/:id/attend"
  Entonces el sistema responde con codigo 409
  Y el conteo no se duplica.
```

## 8. Reglas de Negocio e Invariantes
- RN-07.1: Un residente no puede confirmar asistencia mas de una vez al mismo evento.
- RN-07.2: Los eventos pasados cuya fecha de fin ya transcurrio se marcan logicamente o se listan como `FINALIZADO`.
- RN-07.3: La visualizacion cartografica incluye pin interactivo con titulo, hora y direccion.

## 9. Especificaciones de API Contract
- Endpoint: `POST /api/events`
- Request Body:
```json
{
  "sectorId": "b3e34b12-9c1a-4d43-85f2-95b6cf716d11",
  "title": "Minga de Limpieza y Recuperacion del Parque Las Retamas",
  "description": "Limpieza general, pintura de postes y revision de luminarias comunitarias",
  "eventType": "MINGA_COMUNITARIA",
  "address": "Parque Las Retamas, Calle Pontevedra",
  "latitude": -0.2115,
  "longitude": -78.4872,
  "startDate": "2026-11-22T08:00:00.000Z",
  "endDate": "2026-11-22T12:00:00.000Z",
  "isPublic": true
}
```

## 10. Endpoints y Modelos de Base de Datos
- Endpoints:
  - `POST /api/events` (Crear evento)
  - `GET /api/events` (Listar eventos)
  - `GET /api/events/:id` (Detalle de evento)
  - `POST /api/events/:id/attend` (Confirmar asistencia)
  - `DELETE /api/events/:id/attend` (Cancelar asistencia)
  - `PATCH /api/events/:id/status` (Actualizar estado)
  - `DELETE /api/events/:id` (Eliminar evento)
- Modelos Prisma: `CommunityEvent`, `EventAttendance`, `Sector`, `User`.

## 11. Pruebas con BD Real y Limpieza de Scripts
- Verificacion de transacciones atomicas en confirmacion de asistencia sobre PostgreSQL.
- Eliminacion de scripts de prueba temporales.
