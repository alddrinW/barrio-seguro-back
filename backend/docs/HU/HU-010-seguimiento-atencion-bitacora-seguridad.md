# HU-010: Seguimiento, Resolucion y Bitacora de Seguridad de Denuncias

## 1. Metadatos
- Codigo: HU-010
- Modulo: Operaciones de Seguridad y Resolucion de Alertas
- Prioridad: Alta
- Responsable: Backend Incident Response Team
- Estado: Aprobada

## 2. Definicion Estandar
Como Autoridad Policial, Agente de Seguridad o Administrador de Sector,
quiero actualizar el estado de atencion de las denuncias, registrar actualizaciones oficiales y cerrar los casos resueltos,
para mantener informada a la comunidad con transparencia y conservar una bitacora inmutable de respuestas operativas.

## 3. Contexto de Negocio Justificado
Una alerta ciudadana no termina cuando el ciudadano la emite; su efectividad radica en la trazabilidad del auxilio: verificar el reporte, despachar el movil policial o brigada barrial, neutralizar la amenaza y registrar el informe final o catalogarla como falsa alarma si fue una equivocacion. Esta transparencia reduce la impunidad y eleva la confianza institucional.

## 4. Precondiciones
- El usuario ejecutor debe poseer rol `AUTORIDAD_POLICIAL`, `ADMIN_SECTOR` o `SUPERADMIN`.
- La alerta debe existir en la base de datos.
- El nuevo estado debe ser una transicion valida: `EMITIDA` -> `EN_VERIFICACION` -> `PATRULLA_DESPACHADA` -> `RESUELTA` o `FALSA_ALARMA`.

## 5. Flujo Principal (Happy Path)
1. La autoridad o administrador envia una peticion PATCH a `/api/incidents/:id/status` con el nuevo estado (`PATRULLA_DESPACHADA`), notas operativas y codigo de unidad policial asignada.
2. El sistema valida los permisos y la transicion de estados.
3. El sistema actualiza el estado del incidente en la tabla `incident_alerts`.
4. El sistema crea un registro en la tabla `incident_updates` vinculando la observacion, el usuario interventor y la hora exacta.
5. El sistema retorna 200 OK con el incidente actualizado y la linea de tiempo de actualizaciones.

## 6. Flujos Alternativos y Excepciones
- FA-01 (Transicion invalida): Si se intenta pasar un incidente ya `RESUELTO` directamente a `EMITIDA`, el sistema rechaza la operacion con 400 Bad Request.
- FA-02 (Falsa alarma justificada): Si la verificacion demuestra que fue un error, la autoridad la clasifica como `FALSA_ALARMA` indicando motivo obligatorio.
- FA-03 (Acceso no autorizado): Si un RESIDENTE comun intenta alterar el estado de un incidente, se responde con 403 Forbidden.

## 7. Criterios de Aceptacion (Gherkin)
```gherkin
Escenario: Despacho de patrulla policial a alerta emitida
  Dado que existe un incidente con status "EMITIDA"
  Cuando un usuario con rol "AUTORIDAD_POLICIAL" envia PATCH a "/api/incidents/:id/status" con:
    | status | PATRULLA_DESPACHADA |
    | comment | Movil Policial UPC Floresta 02 se dirige al lugar |
  Entonces el sistema responde con codigo 200
  Y el incidente queda con status "PATRULLA_DESPACHADA"
  Y se crea una entrada en la bitacora de seguimiento.

Escenario: Cierre formal de un caso resuelto
  Dado que un incidente esta con status "PATRULLA_DESPACHADA"
  Cuando la autoridad envia PATCH a "/api/incidents/:id/status" con status "RESUELTA" y detalle de aprehension o solucion
  Entonces el sistema responde con codigo 200
  Y el incidente queda cerrado como "RESUELTA".

Escenario: Rechazo de modificacion por usuario residente
  Dado un residente ordinario
  Cuando intenta ejecutar PATCH sobre "/api/incidents/:id/status"
  Entonces el sistema responde con codigo 403
  Y el estado del incidente permanece inalterado.
```

## 8. Reglas de Negocio e Invariantes
- RN-10.1: Todo cambio de estado debe incluir un comentario o explicacion de al menos 10 caracteres.
- RN-10.2: Las notas operativas ingresadas en la bitacora no son eliminables (garantia de auditoria judicial y administrativa).
- RN-10.3: El tiempo transcurrido entre la emision y la resolucion se calcula para alimentar los indicadores de tiempo de respuesta en el Dashboard.

## 9. Especificaciones de API Contract
- Endpoint: `PATCH /api/incidents/:id/status`
- Request Body:
```json
{
  "status": "RESUELTA",
  "comment": "La patrulla llego al sitio, se verifico la seguridad del inmueble y los sospechosos huyeron sin sustraer objetos.",
  "officerBadge": "POL-9842"
}
```
- Response (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "7c123456-789a-bcde-f012-3456789abcde",
    "code": "ALR-2026-0001",
    "status": "RESUELTA",
    "updatedAt": "2026-11-13T16:45:00.000Z",
    "history": [
      {
        "status": "PATRULLA_DESPACHADA",
        "comment": "Movil en camino",
        "createdAt": "2026-11-13T16:25:00.000Z"
      },
      {
        "status": "RESUELTA",
        "comment": "La patrulla llego al sitio...",
        "createdAt": "2026-11-13T16:45:00.000Z"
      }
    ]
  }
}
```

## 10. Endpoints y Modelos de Base de Datos
- Endpoints:
  - `PATCH /api/incidents/:id/status` (Actualizar estado e insertar bitacora)
  - `POST /api/incidents/:id/updates` (Agregar nota de seguimiento)
  - `GET /api/incidents/:id/updates` (Consultar historial de seguimiento)
- Modelos Prisma: `IncidentAlert`, `IncidentUpdate`, `User`.

## 11. Pruebas con BD Real y Limpieza de Scripts
- Verificacion de transacciones SQL garantizando la creacion simultanea del log de bitacora al cambiar el estatus en PostgreSQL.
- Eliminacion de scripts de prueba temporales.
