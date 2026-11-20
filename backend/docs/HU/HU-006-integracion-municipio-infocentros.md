# HU-006: Integracion y Mapeo de Puntos Clave Institucionales (Municipio e Infocentros)

## 1. Metadatos
- Codigo: HU-006
- Modulo: Articulacion Institucional y Ciudadania Digital
- Prioridad: Alta
- Responsable: Backend Core Team
- Estado: Aprobada

## 2. Definicion Estandar
Como Vecino o Lider Barrial,
quiero consultar e identificar en el mapa las dependencias municipales, casas comunales e infocentros del sector,
para acceder a servicios publicos, capacitacion digital, atencion de trámites y canales directos de vinculacion con el cabildo.

## 3. Contexto de Negocio Justificado
La presencia de puntos institucionales como agencias municipales zonales, casas comunales de atencion ciudadana e infocentros comunitarios fomenta la inclusion digital y la respuesta estatal. Integrarlos como capas geoespaciales destacadas en OpenStreetMap brinda a los ciudadanos certeza de ubicacion y horarios de gestion formal.

## 4. Precondiciones
- El usuario debe consultar el API de puntos de interes con filtro de tipo institucional (`MUNICIPIO` o `INFOCENTRO`).
- El registro de nuevos puntos institucionales esta restringido a administradores (`ADMIN_SECTOR`, `SUPERADMIN`) o autoridades reconocidas.

## 5. Flujo Principal (Happy Path)
1. El administrador envia una peticion POST a `/api/pois` con tipo `MUNICIPIO` o `INFOCENTRO`.
2. Se ingresa el nombre de la dependencia, descripcion de servicios ofrecidos (ej. ventanilla universal de tramites, internet publico, aulas de capacitacion), horarios, telefonos oficiales y ubicacion WGS84.
3. El sistema valida las coordenadas y almacena el POI como institucional certificado (`isVerified: true`).
4. Los ciudadanos realizan peticiones GET a `/api/pois?type=MUNICIPIO` o `/api/pois?type=INFOCENTRO`.
5. El sistema retorna la informacion enriquecida con los servicios y canales de contacto oficial.

## 6. Flujos Alternativos y Excepciones
- FA-01 (Intento de registro por usuario comun): Si un usuario con rol RESIDENTE intenta registrar directamente un POI de tipo `MUNICIPIO` o `INFOCENTRO`, el sistema responde con 403 Forbidden ("Solo administradores y autoridades pueden registrar dependencias institucionales").
- FA-02 (Consulta geolocalizada de infocentros cercanos): Un usuario consulta infocentros en un radio de 2km mediante `/api/pois/nearby?type=INFOCENTRO&lat=...&lng=...&radiusKm=2`.

## 7. Criterios de Aceptacion (Gherkin)
```gherkin
Escenario: Registro de Casa Comunal / Agencia Municipal
  Dado que un usuario con rol "ADMIN_SECTOR" envia:
    | nombre | Administracion Zonal Mariscal - Punto Comunitario |
    | tipo | MUNICIPIO |
    | latitud | -0.2098 |
    | longitud | -78.4912 |
    | attributes | { servicios: ["Ventanilla Ciudadana", "Denuncias Catastrales"] } |
  Cuando se procesa la peticion en "POST /api/pois"
  Entonces el sistema responde con codigo 201
  Y el punto queda registrado con tipo "MUNICIPIO" y verificado.

Escenario: Consulta de infocentros disponibles en el sector
  Dado que existen 2 infocentros registrados en el sector
  Cuando se realiza una peticion "GET /api/pois?type=INFOCENTRO&sectorId=..."
  Entonces el sistema responde con codigo 200
  Y la lista contiene informacion de computadoras disponibles, acceso wifi y horarios.

Escenario: Rechazo de creacion institucional a usuario sin privilegios
  Dado un usuario con rol "RESIDENTE"
  Cuando intenta enviar un POST a "/api/pois" con tipo "MUNICIPIO"
  Entonces el sistema responde con codigo 403
  Y no se registra el elemento en base de datos.
```

## 8. Reglas de Negocio e Invariantes
- RN-06.1: Los tipos `MUNICIPIO` e `INFOCENTRO` solo pueden ser manipulados por administradores.
- RN-06.2: Deben contener telefono o correo de atencion publica de caracter obligatorio en el objeto de atributos.
- RN-06.3: Las coordenadas institucionales deben ser validadas contra los limites del poligono del sector.

## 9. Especificaciones de API Contract
- Endpoint: `POST /api/pois`
- Request Body:
```json
{
  "sectorId": "b3e34b12-9c1a-4d43-85f2-95b6cf716d11",
  "name": "Infocentro Comunitario La Floresta",
  "type": "INFOCENTRO",
  "description": "Centro de acceso gratuito a internet, tramites en linea y capacitacion comunitaria",
  "latitude": -0.2118,
  "longitude": -78.4875,
  "address": "Calle Vizcaya N24-55 y Guipuzcoa",
  "contactPhone": "+59322998877",
  "openingHours": "08:00 - 17:00",
  "attributes": {
    "numeroEquipos": 20,
    "accesoDiscapacidad": true,
    "cursosDisponibles": ["Alfabetizacion Digital", "Seguridad en Redes"]
  }
}
```

## 10. Endpoints y Modelos de Base de Datos
- Endpoints:
  - `POST /api/pois`
  - `GET /api/pois` (con filtro `type=MUNICIPIO` o `INFOCENTRO`)
  - `GET /api/pois/nearby`
- Modelos Prisma: `PoiLocation`, `Sector`.

## 11. Pruebas con BD Real y Limpieza de Scripts
- Verificacion de politicas de autorizacion RBAC en PostgreSQL para creacion de POIs institucionales.
- Eliminacion de scripts de prueba temporales.
