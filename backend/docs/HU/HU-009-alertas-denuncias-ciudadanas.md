# HU-009: Emision y Geolocalizacion de Alertas y Denuncias Ciudadanas

## 1. Metadatos
- Codigo: HU-009
- Modulo: Seguridad Reactiva y Denuncia Comunitaria
- Prioridad: Critica
- Responsable: Backend Incident Response Team
- Estado: Aprobada

## 2. Definicion Estandar
Como Residente, Vecino Lider o Ciudadano del sector,
quiero reportar y emitir alertas inmediatas o denuncias con su categoria, nivel de severidad, coordenadas exactas y evidencia,
para que la comunidad este prevenida de riesgos inmediatos y las autoridades puedan movilizar recursos con prontitud.

## 3. Contexto de Negocio Justificado
Ante un robo en flagrancia, presencia de sospechosos, actos de violencia o emergencias medicas, los primeros minutos son vitales. El backend de Barrio Seguro debe capturar de inmediato el evento georreferenciado, clasificar su severidad (BAJA, MEDIA, ALTA, CRITICA) y permitir el anonimato optativo para evitar represalias contra quien denuncia.

## 4. Precondiciones
- El usuario denunciante debe tener sesion activa en el sistema.
- Se debe categorizar el incidente (`ROBO_HURTO`, `SOSPECHOSO`, `DISTURBIO_ESCANDALO`, `VIOLENCIA`, `INFRAESTRUCTURA_DANADA`, `ACCIDENTE_TRANSITO`, `EMERGENCIA_MEDICA`, `OTRO`).
- Se deben incluir coordenadas geograficas (lat/lng) del suceso.

## 5. Flujo Principal (Happy Path)
1. El usuario realiza una peticion POST a `/api/incidents` enviando categoria, nivel de severidad, titulo descriptivo, detalle del hecho, coordenadas WGS84, referencia de direccion, indicador `isAnonymous` y urls de evidencia opcionales.
2. El sistema valida los datos y genera un codigo de seguimiento unico correlativo (ej. "ALR-2026-0001").
3. El incidente se registra con status inicial `EMITIDA`.
4. El sistema almacena la relacion con el usuario denunciante (si `isAnonymous` es true, su identidad es protegida en las consultas publicas).
5. El sistema responde con 201 Created y los datos de la alerta emitida.
6. La alerta queda disponible en la vista cartografica comunitaria y en la bandeja de despacho policial.

## 6. Flujos Alternativos y Excepciones
- FA-01 (Alerta anonima): Si el residente marca `isAnonymous: true`, la respuesta en listas comunitarias omite el nombre, email y telefono del denunciante, mostrando "Vecino Anonimo".
- FA-02 (Filtro por severidad critica): Las autoridades consultan `GET /api/incidents?severity=CRITICA&status=EMITIDA` para atencion prioritaria inmediata.
- FA-03 (Coordenadas invalidas): Si la geolocalizacion no es enviada o es invalida, se retorna 400 Bad Request.

## 7. Criterios de Aceptacion (Gherkin)
```gherkin
Escenario: Emision exitosa de alerta de robo en curso
  Dado que un usuario autenticado envia:
    | categoria | ROBO_HURTO |
    | severidad | ALTA |
    | titulo | Intento de asalto a transeunte |
    | latitud | -0.2104 |
    | longitud | -78.4891 |
    | isAnonymous | false |
  Cuando la solicitud POST se ejecuta en "/api/incidents"
  Entonces el sistema responde con codigo 201
  Y el incidente recibe un codigo con formato "ALR-..." y status "EMITIDA".

Escenario: Proteccion de identidad en reporte anonimo
  Dado que un usuario registra una denuncia con "isAnonymous" en true
  Cuando otro residente consulta el incidente en "GET /api/incidents/:id"
  Entonces el sistema responde con codigo 200
  Y el campo "reportedBy" muestra "Anonimo" ocultando todo dato personal.

Escenario: Consulta geoespacial de incidentes activos
  Dado que existen 6 incidentes en el sector
  Cuando se consulta "GET /api/incidents/geojson"
  Entonces el sistema retorna un GeoJSON FeatureCollection con las ubicaciones y severidades de los incidentes.
```

## 8. Reglas de Negocio e Invariantes
- RN-09.1: Cada incidente genera un codigo unico e irrepetible en formato `ALR-YYYY-XXXX`.
- RN-09.2: El autor o la autoridad no pueden alterar las coordenadas originales del hecho reportado.
- RN-09.3: La severidad `CRITICA` marca el incidente con indicador de atencion prioritaria para despacho inmediato.

## 9. Especificaciones de API Contract
- Endpoint: `POST /api/incidents`
- Request Body:
```json
{
  "sectorId": "b3e34b12-9c1a-4d43-85f2-95b6cf716d11",
  "category": "ROBO_HURTO",
  "severity": "ALTA",
  "title": "Robo de accesorios vehiculares en parqueadero publico",
  "description": "Dos sujetos en motocicleta forzaron la cerradura de vehiculo gris estacionado en la esquina.",
  "latitude": -0.2108,
  "longitude": -78.4889,
  "addressReference": "Frente a la farmacia de la esquina",
  "isAnonymous": false,
  "evidenceUrls": [
    "https://storage.barrioseguro.ec/evidencias/foto-alerta-101.jpg"
  ]
}
```
- Response (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "7c123456-789a-bcde-f012-3456789abcde",
    "code": "ALR-2026-0001",
    "status": "EMITIDA",
    "severity": "ALTA",
    "createdAt": "2026-11-13T16:20:00.000Z"
  }
}
```

## 10. Endpoints y Modelos de Base de Datos
- Endpoints:
  - `POST /api/incidents` (Crear alerta/denuncia)
  - `GET /api/incidents` (Listar denuncias filtradas)
  - `GET /api/incidents/geojson` (Exportar incidentes como GeoJSON)
  - `GET /api/incidents/:id` (Detalle de denuncia)
- Modelos Prisma: `IncidentAlert`, `Sector`, `User`.

## 11. Pruebas con BD Real y Limpieza de Scripts
- Verificacion de secuencias de codigos y anonimizacion de denunciantes sobre PostgreSQL.
- Eliminacion de scripts de prueba.
