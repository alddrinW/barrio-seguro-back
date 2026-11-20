# HU-004: Mapeo y Registro Geografico de Puntos Seguros y Areas Verdes

## 1. Metadatos
- Codigo: HU-004
- Modulo: Mapeo Geoespacial Comunitario
- Prioridad: Alta
- Responsable: Backend Spatial Engineer
- Estado: Aprobada

## 2. Definicion Estandar
Como Residente, Lider Barrial o Administrador,
quiero registrar y visualizar en el mapa los puntos seguros de evacuacion y las areas verdes de mi sector,
para que la comunidad conozca las zonas de resguardo ante emergencias y los espacios recreativos y ecologicos disponibles.

## 3. Contexto de Negocio Justificado
Ante catastrofes naturales (sismos, erupciones, deslizamientos) o situaciones de zozobra, la comunidad debe tener acceso inmediato y geolocalizado a puntos de encuentro seguros certificados por la administracion o bomberos. Asimismo, las areas verdes (parques, canchas comunitarias) son nucleos de integracion y requieren georreferenciacion para planes de mantenimiento y seguridad.

## 4. Precondiciones
- El usuario debe estar autenticado en el sector correspondiente.
- Las coordenadas de latitud y longitud deben ser validas en formato decimal WGS84.
- El tipo de punto debe corresponder estrictamente al enumerado: `PUNTO_SEGURO` o `AREA_VERDE`.

## 5. Flujo Principal (Happy Path)
1. El usuario envia una peticion POST a `/api/pois` especificando nombre, tipo (`PUNTO_SEGURO` o `AREA_VERDE`), descripcion, latitud, longitud, direccion de referencia y metadatos de equipamiento.
2. El sistema valida las coordenadas y el sectorId.
3. El sistema almacena el punto de interes con indicador `isVerified` (si es creado por ADMIN es `true`, por residente queda pendiente de aprobacion).
4. El sistema responde con 201 Created y los atributos completos del punto.
5. El punto pasa a estar disponible en el endpoint de visualizacion `/api/pois/geojson` para renderizado sobre OpenStreetMap.

## 6. Flujos Alternativos y Excepciones
- FA-01 (Coordenadas fuera del territorio ecuatoriano/sectorial): Si las coordenadas son invalidas, se responde con 400 Bad Request.
- FA-02 (Filtro por categoria): El usuario solicita `GET /api/pois?type=PUNTO_SEGURO&sectorId=...` y el backend retorna unicamente los puntos seguros.

## 7. Criterios de Aceptacion (Gherkin)
```gherkin
Escenario: Registro de un punto de encuentro seguro
  Dado que un administrador autenticado envia:
    | nombre | Punto Seguro Parque Las Retamas |
    | tipo | PUNTO_SEGURO |
    | latitud | -0.2115 |
    | longitud | -78.4872 |
    | descripcion | Zona abierta con alarma comunitaria y botiquin |
  Cuando la solicitud es enviada a "POST /api/pois"
  Entonces el sistema responde con codigo 201
  Y el punto queda catalogado como "PUNTO_SEGURO" con coordenadas WGS84.

Escenario: Consulta de areas verdes en formato GeoJSON
  Dado que existen 4 areas verdes registradas en el sector
  Cuando se consulta "GET /api/pois/geojson?type=AREA_VERDE"
  Entonces el sistema responde con codigo 200
  Y la estructura de respuesta cumple el estandar RFC 7946 "FeatureCollection".

Escenario: Busqueda de puntos seguros por proximidad
  Dado un residente en coordenadas lat -0.2100, lng -78.4890
  Cuando realiza una peticion a "GET /api/pois/nearby?lat=-0.2100&lng=-78.4890&radiusKm=1&type=PUNTO_SEGURO"
  Entonces el sistema responde con los puntos ordenados de menor a mayor distancia euclidiana/haversine.
```

## 8. Reglas de Negocio e Invariantes
- RN-04.1: Los puntos seguros creados por administradores o autoridades nacen verificados automaticamente.
- RN-04.2: Todo punto debe incluir al menos una descripcion del equipamiento o facilidades de seguridad disponibles.
- RN-04.3: La exportacion GeoJSON debe mantener compatibilidad nativa con capas Leaflet L.geoJSON().

## 9. Especificaciones de API Contract
- Endpoint: `POST /api/pois`
- Request Body:
```json
{
  "sectorId": "b3e34b12-9c1a-4d43-85f2-95b6cf716d11",
  "name": "Punto Seguro Canchas La Floresta",
  "type": "PUNTO_SEGURO",
  "description": "Canchas de futbol abiertas con señaletica de evacuacion y boton de alarma",
  "latitude": -0.2105,
  "longitude": -78.4880,
  "address": "Calle Pontevedra y Guipuzcoa",
  "contactPhone": "+593987654321",
  "attributes": {
    "capacidadPersonas": 400,
    "tieneIluminacionNocturna": true,
    "tieneAlarmaComunitaria": true
  }
}
```

## 10. Endpoints y Modelos de Base de Datos
- Endpoints:
  - `POST /api/pois` (Crear POI)
  - `GET /api/pois` (Listar POIs filtrados)
  - `GET /api/pois/geojson` (Exportar FeatureCollection para OpenStreetMap)
  - `GET /api/pois/nearby` (Busqueda por radio)
  - `GET /api/pois/:id` (Detalle de POI)
  - `PUT /api/pois/:id` (Actualizar POI)
  - `DELETE /api/pois/:id` (Eliminar POI)
- Modelos Prisma: `PoiLocation`, `Sector`, `User`.

## 11. Pruebas con BD Real y Limpieza de Scripts
- Verificacion de distancias euclidianas y Haversine en consultas PostgreSQL.
- Eliminacion de scripts de prueba temporales.
