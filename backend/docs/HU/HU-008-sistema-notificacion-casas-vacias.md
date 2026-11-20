# HU-008: Modulo Preventivo de Notificacion y Vigilancia de Casas Vacias

## 1. Metadatos
- Codigo: HU-008
- Modulo: Prevencion Situacional y Seguridad Residencial
- Prioridad: Critica
- Responsable: Backend Security Lead
- Estado: Aprobada

## 2. Definicion Estandar
Como Residente titular de una vivienda en el sector,
quiero notificar con antelacion los periodos en que mi residencia permanecera vacia por viaje o ausencia temporal,
para que la patrulla de seguridad barrial o policia comunitaria realice rondas de inspeccion preventiva y se mantenga contacto con mi vecino de confianza.

## 3. Contexto de Negocio Justificado
El robo a domicilios ocurre con mayor frecuencia durante ausencias vacacionales o laborales prolongadas. El modulo de "Casas Vacias" permite al vecino activar un protocolo formal de resguardo: alerta a la autoridad comunitaria para que programe rondas presenciales periódicas, registra un vecino de confianza inmediato para emergencias y evita que la informacion sea divulgada publicamente a personas no autorizadas.

## 4. Precondiciones
- El solicitante debe ser un RESIDENTE activo del sector.
- Las fechas de ausencia deben ser coherentes (fecha de inicio menor o igual a fecha de retorno).
- Debe consignarse obligatoriamente un numero telefonico de emergencia y el nombre de un vecino de confianza.

## 5. Flujo Principal (Happy Path)
1. El residente envia una peticion POST a `/api/vacant-houses` con direccion del inmueble, coordenadas lat/lng, fecha inicio, fecha fin, vecino de confianza, telefono del vecino, telefono de emergencia e instrucciones especiales (ej. sistema de iluminacion programado, rejas aseguradas).
2. El sistema valida los datos y registra la notificacion en estado `REGISTRADA` o `VIGILANCIA_ACTIVA`.
3. El sistema garantiza privacidad estricta: los datos de casas vacias NO se exponen en APIs publicas de residentes, unicamente al residente dueño, al ADMIN_SECTOR y a la AUTORIDAD_POLICIAL.
4. El sistema retorna 201 Created con el codigo de solicitud y estado de proteccion.

## 6. Flujos Alternativos y Excepciones
- FA-01 (Retorno anticipado o cancelacion): El residente puede finalizar anticipadamente la vigilancia mediante `PATCH /api/vacant-houses/:id/status` con estado `FINALIZADA` o `CANCELADA`.
- FA-02 (Rango de fechas pasado): Si la fecha de retorno es en el pasado, el sistema rechaza la solicitud con 400 Bad Request.
- FA-03 (Acceso no autorizado): Si otro residente no propietario intenta ver los detalles de una casa vacia ajena, el backend responde con 403 Forbidden.

## 7. Criterios de Aceptacion (Gherkin)
```gherkin
Escenario: Registro exitoso de vivienda para vigilancia preventiva
  Dado que un residente autenticado envia:
    | direccion | Calle Vizcaya N24-110 |
    | latitud | -0.2107 |
    | longitud | -78.4892 |
    | departureDate | 2026-12-20T08:00:00Z |
    | returnDate | 2026-12-30T18:00:00Z |
    | vecinoConfianza | Don Pedro Ramirez |
    | telefonoVecino | +593987112233 |
    | telefonoEmergencia | +593998877665 |
  Cuando se procesa la peticion en "POST /api/vacant-houses"
  Entonces el sistema responde con codigo 201
  Y el registro queda en estado "REGISTRADA".

Escenario: Restriccion de privacidad de casas vacias
  Dado que existen 5 casas vacias registradas en el sector
  Cuando un usuario con rol "RESIDENTE" invoca "GET /api/vacant-houses"
  Entonces el sistema retorna unicamente las casas vacias registradas por el mismo
  Y no muestra registros de otros vecinos.

Escenario: Visualizacion operativa para la Policia Comunitaria
  Dado un usuario con rol "AUTORIDAD_POLICIAL"
  Cuando invoca "GET /api/vacant-houses?status=VIGILANCIA_ACTIVA"
  Entonces el sistema responde con codigo 200
  Y entrega el listado completo de viviendas con coordenadas y telefonos de emergencia para rondas.
```

## 8. Reglas de Negocio e Invariantes
- RN-08.1: Confidencialidad absoluta: la lista completa de casas desocupadas jamas se comparte a vecinos comunes.
- RN-08.2: Cuando la fecha actual supera a `returnDate`, el sistema permite marcar o actualizar el estado a `FINALIZADA`.
- RN-08.3: Solo el propietario original, el ADMIN_SECTOR o la AUTORIDAD_POLICIAL pueden acceder a la bitacora de esa vivienda.

## 9. Especificaciones de API Contract
- Endpoint: `POST /api/vacant-houses`
- Request Body:
```json
{
  "sectorId": "b3e34b12-9c1a-4d43-85f2-95b6cf716d11",
  "propertyAddress": "Calle Vizcaya N24-110 Casa 3",
  "latitude": -0.2107,
  "longitude": -78.4892,
  "departureDate": "2026-12-20T08:00:00.000Z",
  "returnDate": "2026-12-30T18:00:00.000Z",
  "trustedNeighborName": "Don Pedro Ramirez (Manzana 2)",
  "trustedNeighborPhone": "+593987112233",
  "emergencyContactPhone": "+593998877665",
  "specialInstructions": "Se dejan luces solares activas en el patio. El perro queda al cuidado del vecino Don Pedro."
}
```

## 10. Endpoints y Modelos de Base de Datos
- Endpoints:
  - `POST /api/vacant-houses` (Registrar casa vacia)
  - `GET /api/vacant-houses` (Listar segun rol / propietario)
  - `GET /api/vacant-houses/:id` (Detalle de casa vacia)
  - `PATCH /api/vacant-houses/:id/status` (Cambiar estado: REGISTRADA, VIGILANCIA_ACTIVA, FINALIZADA, CANCELADA)
  - `POST /api/vacant-houses/:id/inspections` (Registrar ronda de patrullaje)
  - `GET /api/vacant-houses/:id/inspections` (Consultar bitacora de rondas)
- Modelos Prisma: `VacantHouse`, `VacantHouseLog`, `Sector`, `User`.

## 11. Pruebas con BD Real y Limpieza de Scripts
- Verificacion de filtros de seguridad en consultas SQL de PostgreSQL asegurando no filtracion de datos de casas vacias.
- Eliminacion de scripts temporales.
