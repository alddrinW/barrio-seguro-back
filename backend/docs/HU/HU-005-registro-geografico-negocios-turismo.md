# HU-005: Registro y Mapeo de Negocios Locales y Puntos Turisticos

## 1. Metadatos
- Codigo: HU-005
- Modulo: Reactivacion Economica y Espacios Comunitarios
- Prioridad: Media-Alta
- Responsable: Backend Feature Team
- Estado: Aprobada

## 2. Definicion Estandar
Como Residente, Comerciante o Lider Barrial,
quiero registrar y georreferenciar negocios locales y atractivos turisticos o culturales en el mapa del sector,
para dinamizar el comercio seguro de proximidad y promover la visita responsable a zonas de interes barrial.

## 3. Contexto de Negocio Justificado
Los comercios barriales (tiendas de barrio, farmacias, panaderias, talleres) forman la primera linea de contacto vecinal y ojos en la calle (*eyes on the street*). Su integracion en el mapa permite identificar puntos con flujo de personas y horarios de atencion. Del mismo modo, los puntos turisticos y culturales fortalecen la identidad del sector y atraen visitantes en condiciones de seguridad monitoreada.

## 4. Precondiciones
- El usuario debe tener una cuenta valida en el sistema.
- Se debe indicar el tipo exacto: `NEGOCIO` o `PUNTO_TURISTICO`.
- Se deben proveer horarios de atencion y numeros telefonicos de contacto cuando aplique.

## 5. Flujo Principal (Happy Path)
1. El usuario envia una peticion POST a `/api/pois` con tipo `NEGOCIO` o `PUNTO_TURISTICO`.
2. Se registran nombre comercial, descripcion, categoria de negocio (ej. Farmacia, Alimentos, Artesanias), direccion, horarios y coordenadas.
3. El sistema almacena la informacion asociada al sector.
4. Si es registrado por el dueño o vecino, queda pendiente de verificacion hasta que el ADMIN_SECTOR valide su legalidad o ubicacion.
5. El sistema retorna 201 Created y el nuevo comercio o sitio turistico es indexado en el mapa barrial.

## 6. Flujos Alternativos y Excepciones
- FA-01 (Filtro por tipo de negocio): El usuario filtra mediante `GET /api/pois?type=NEGOCIO&sectorId=...` para ver unicamente los comercios locales.
- FA-02 (Aprobacion o rechazo): El administrador del sector utiliza `PATCH /api/pois/:id/verify` para marcar un negocio como verificado.

## 7. Criterios de Aceptacion (Gherkin)
```gherkin
Escenario: Registro de negocio local barrial
  Dado que un comerciante registrado envia:
    | nombre | Farmacia Comunitaria San Rafael |
    | tipo | NEGOCIO |
    | latitud | -0.2109 |
    | longitud | -78.4895 |
    | openingHours | Lunes a Domingo 07:00 a 22:00 |
  Cuando se procesa la peticion en "POST /api/pois"
  Entonces el sistema responde con codigo 201
  Y el registro contiene los horarios y estado de verificacion.

Escenario: Consulta de puntos turisticos del sector
  Dado que existen 3 monumentos y 1 mirador registrados como "PUNTO_TURISTICO"
  Cuando se consulta "GET /api/pois?type=PUNTO_TURISTICO"
  Entonces el sistema responde con codigo 200
  Y entrega la lista completa con descripciones historicas y coordenadas.

Escenario: Verificacion de negocio por administrador
  Dado un negocio registrado con "isVerified" en false
  Cuando un usuario con rol "ADMIN_SECTOR" invoca "PATCH /api/pois/:id/verify" con { isVerified: true }
  Entonces el sistema responde con codigo 200
  Y el campo "isVerified" cambia a true.
```

## 8. Reglas de Negocio e Invariantes
- RN-05.1: Los comercios pueden incluir telefonos de servicio a domicilio o atencion comunitaria.
- RN-05.2: Los sitios turisticos deben poseer coordenadas publicas visibles para todos los usuarios.
- RN-05.3: Solo comercios verificados se muestran en la capa principal recomendada para visitantes externos.

## 9. Especificaciones de API Contract
- Endpoint: `POST /api/pois`
- Request Body:
```json
{
  "sectorId": "b3e34b12-9c1a-4d43-85f2-95b6cf716d11",
  "name": "Panaderia y Cafeteria La Tradicion",
  "type": "NEGOCIO",
  "description": "Panaderia artesanal barrial y cafeteria de paso",
  "latitude": -0.2112,
  "longitude": -78.4891,
  "address": "Av. Toledo y Coruña",
  "contactPhone": "+593984321098",
  "openingHours": "06:30 - 21:00",
  "attributes": {
    "rubro": "ALIMENTOS_BEBIDAS",
    "deliveryDisponible": true
  }
}
```

## 10. Endpoints y Modelos de Base de Datos
- Endpoints:
  - `POST /api/pois`
  - `GET /api/pois`
  - `PATCH /api/pois/:id/verify`
  - `PUT /api/pois/:id`
  - `DELETE /api/pois/:id`
- Modelos Prisma: `PoiLocation`.

## 11. Pruebas con BD Real y Limpieza de Scripts
- Verificacion de filtros compuestos por sector y tipo de POI en PostgreSQL.
- Eliminacion de scripts de prueba temporales.
