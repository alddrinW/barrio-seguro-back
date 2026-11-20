# Especificacion Tecnica de Requerimientos del Sistema - Barrio Seguro

## 1. Informacion General del Proyecto
- Nombre del Sistema: Barrio Seguro (Plataforma Backend)
- Tipo de Aplicacion: Backend API RESTful de Alta Disponibilidad
- Version: 1.0.0
- Dominio del Sistema: Seguridad Ciudadana, Gestion Comunitaria y Mapeo Barrial Georreferenciado
- Ecosistema Tecnologico: Node.js, TypeScript, PostgreSQL, Prisma ORM, Express, OpenStreetMap (WGS84 / GeoJSON)

---

## 2. Descripcion y Objetivos del Sistema
Barrio Seguro es una plataforma integral orientada a la autogestion de seguridad, participacion ciudadana y articulacion institucional en barrios y sectores urbanos. La plataforma permite la operacion autonoma e independiente de cada sector barrial, garantizando el control de capacidad vecinal (200 a 250 familias por sector), georreferenciacion precisa de activos comunitarios, prevencion del delito mediante monitoreo de residencias desocupadas temporalmente, emision inmediata de alertas ciudadanas geolocalizadas y coordinacion con organismos locales (municipio, policia e infocentros).

### Objetivos Clave:
1. Descentralizacion y Autonomia: Permitir el alta, parametrizacion y administracion independiente de cada barrio o sector.
2. Escalabilidad Barrial: Garantizar soporte eficiente para censos de 200 a 250 familias (unidades residenciales) con hasta 1200 residentes por sector.
3. Inteligencia Espacial Abierta: Integrar mapeo compatible con OpenStreetMap para puntos seguros, areas verdes, negocios locales, sitios turisticos y dependencias publicas.
4. Prevencion Proactiva: Mitigar riesgos de robos a viviendas mediante el sistema preventivo de casas vacias con bitacora de patrullaje y contactos de confianza.
5. Gestion Reactiva Inmediata: Proveer un canal de alertas y denuncias ciudadanas categorizadas con niveles de severidad y seguimiento oficial.
6. Integracion Institucional: Vincular municipios, infocentros y puestos policiales en un ecosistema colaborativo unificado.

---

## 3. Requerimientos Funcionales Detallados

### Modulo 1: Autenticacion, Autorizacion y Gobernanza de Roles (RF-01)
- RF-01.1: Registro de usuarios residentes asociados a un sector especifico mediante validacion de cedula/DNI, email y unidad familiar.
- RF-01.2: Autenticacion segura mediante JWT (JSON Web Tokens) con expiracion controlada y hash de contraseñas con bcrypt (cost factor >= 10).
- RF-01.3: Control de acceso basado en roles jerarquicos (RBAC):
  - SUPERADMIN: Control maestro del sistema, supervision intersectorial y auditoria global.
  - ADMIN_SECTOR: Administrador del barrio o directiva barrial, gestiona residentes, censos y aprobacion de puntos geograficos.
  - VECINO_LIDER: Coordinador de manzana o cuadra, convoca reuniones y apoya la verificacion de alertas.
  - RESIDENTE: Miembro de la unidad familiar, reporta denuncias, registra casas vacias y consulta el mapa barrial.
  - AUTORIDAD_POLICIAL: Agente de seguridad o policia comunitaria, atiende denuncias y registra bitacoras de patrullaje a casas vacias.
- RF-01.4: Perfil de usuario con cambio seguro de contraseña y actualizacion de datos de contacto.

### Modulo 2: Gestion de Sectores y Control de Capacidad Familiar (RF-02)
- RF-02.1: Registro de nuevos sectores/barrios con nombre, codigo unico, ciudad, limites geograficos (Poligono GeoJSON) y coordenadas centrales.
- RF-02.2: Parametrizacion de capacidad maxima de familias (rango operativo: 200 a 250 familias por sector).
- RF-02.3: Validacion en tiempo de ejecucion que bloquea el registro de nuevas unidades familiares cuando se alcanza el tope configurado.
- RF-02.4: Auditoria y metricas de ocupacion familiar y poblacion registrada por sector.

### Modulo 3: Mapeo y Puntos de Interes Geograficos (RF-03)
- RF-03.1: Registro, consulta, edicion y eliminacion de Puntos de Interes (POI) georreferenciados en WGS84 (Latitud/Longitud).
- RF-03.2: Categorizacion estricta de puntos geograficos:
  - AREA_VERDE: Parques, zonas recreativas, senderos ecologicos y canchas comunitarias.
  - PUNTO_SEGURO: Zonas de evacuacion, alarmas comunitarias, botones de panico y retenes.
  - NEGOCIO: Locales comerciales, farmacias, tiendas de viveres y servicios barriales.
  - PUNTO_TURISTICO: Monumentos, miradores, plazas y sitios de interes patrimonial.
  - MUNICIPIO: Oficinas municipales, casas comunales y agencias de atencion ciudadana.
  - INFOCENTRO: Espacios comunitarios de acceso digital y conectividad publica.
- RF-03.3: Endpoint de busqueda espacial por radio de proximidad (Haversine distance) en kilometros a partir de un punto lat/lng.
- RF-03.4: Endpoint de exportacion e importacion de capas en formato GeoJSON FeatureCollection compatible con Leaflet / OpenStreetMap.
- RF-03.5: Verificacion y aprobacion de puntos por parte de la administracion del sector.

### Modulo 4: Eventos y Asambleas Comunitarias Geolocalizadas (RF-04)
- RF-04.1: Publicacion de eventos comunitarios (Asambleas barriales, mingas, reuniones de seguridad, simulacros).
- RF-04.2: Asignacion de ubicacion geografica exacta en el mapa del evento para orientacion de los vecinos.
- RF-04.3: Registro de confirmacion de asistencia de residentes.
- RF-04.4: Filtros de eventos por estado (Programado, En Curso, Finalizado, Cancelado) y rango de fechas.

### Modulo 5: Notificacion y Vigilancia de Casas Vacias (RF-05)
- RF-05.1: Notificacion voluntaria de ausencia temporal de residencia por parte del titular.
- RF-05.2: Registro obligatorio de fechas de salida y retorno estimado.
- RF-05.3: Designacion de vecino de confianza de contacto y numero telefonico de emergencia.
- RF-05.4: Especificacion de instrucciones especiales de seguridad (iluminacion automatica, mascotas, llaves).
- RF-05.5: Control de privacidad: las coordenadas y datos sensibles solo son visibles para administradores y autoridades policiales del sector.
- RF-05.6: Bitacora de patrullaje: registro de rondas de seguridad con fecha, oficial/vigilante responsable, estado de la vivienda y novedades.

### Modulo 6: Alertas y Denuncias Ciudadanas (RF-06)
- RF-06.1: Emision de alertas de seguridad con geolocalizacion precisa (coordenadas tomadas sobre mapa OpenStreetMap).
- RF-06.2: Tipificacion de incidentes: Robo/Hurto, Sospechoso, Disturbio/Escandalo, Violencia, Infraestructura Dañada, Accidente de Transito, Emergencia Medica, Otro.
- RF-06.3: Clasificacion de severidad operativa: BAJA, MEDIA, ALTA, CRITICA.
- RF-06.4: Opcion de reporte anonimo para salvaguardar la integridad del denunciante ante vecinos o extraños.
- RF-06.5: Adjuntos de evidencia multimedia (enlaces a fotografias o grabaciones).
- RF-06.6: Flujo de atencion y ciclo de vida de la alerta: EMITIDA -> EN_VERIFICACION -> PATRULLA_DESPACHADA -> RESUELTA / FALSA_ALARMA.
- RF-06.7: Bitacora de seguimiento y respuestas oficiales por parte de las autoridades o administracion barrial.

### Modulo 7: Dashboard Estadistico y Auditoria (RF-07)
- RF-07.1: Indicadores consolidados por sector: total familias censadas, porcentaje de ocupacion, total alertas activas por severidad, total casas en vigilancia activa, total puntos seguros.
- RF-07.2: Historial de auditoria de acciones criticas del sistema.

---

## 4. Requerimientos No Funcionales

### RNF-01: Rendimiento y Concurrencia
- Tiempos de respuesta menores a 150ms en endpoints transaccionales tipicos bajo carga estandar.
- Capacidad de procesamiento concurrente para multiples sectores operando en simultaneo.

### RNF-02: Seguridad e Integridad
- Cifrado de contraseñas con bcryptjs.
- Proteccion contra inyeccion SQL mediante ORM Prisma con consultas parametrizadas.
- Cabeceras de seguridad HTTP configuradas con Helmet.
- Control de origenes cruzados mediante CORS restringido.
- Sanitizacion y validacion de esquemas en todas las entradas con libreria Zod.

### RNF-03: Mantenibilidad y Arquitectura
- Arquitectura en capas limpia: Routes -> Controllers -> Services -> Repositories/Prisma.
- Tipado estricto de extremo a extremo con TypeScript en modo strict.
- Separacion modular por dominios de negocio.

### RNF-04: Compatibilidad Geoespacial
- Coordenadas estandarizadas en WGS84 (EPSG:4326).
- Exportacion estandar GeoJSON RFC 7946 consumible directamente por clientes OpenStreetMap y librerias como Leaflet, OpenLayers y Mapbox GL.

---

## 5. Matriz de Trazabilidad de Roles y Permisos

| Endpoint / Recurso | Metodo | SuperAdmin | Admin Sector | Vecino Lider | Residente | Autoridad Policial |
|---|---|---|---|---|---|---|
| /api/sectors | POST/PUT/DELETE | Si | Solo su sector | No | No | No |
| /api/sectors | GET | Si | Si | Si | Si | Si |
| /api/users/census | POST/GET | Si | Si | Solo lectura | No | Solo lectura |
| /api/pois | POST/PUT/DELETE | Si | Si | Si (propuesta) | No | Si (puntos seguros) |
| /api/pois | GET / GeoJSON | Si | Si | Si | Si | Si |
| /api/events | POST/PUT/DELETE | Si | Si | Si | No | Si |
| /api/events | GET | Si | Si | Si | Si | Si |
| /api/vacant-houses | POST (solicitud) | Si | Si | Si | Si (su casa) | No |
| /api/vacant-houses | GET (inspeccion)| Si | Si | No (privado) | Solo las suyas | Si |
| /api/vacant-houses/:id/inspections | POST | Si | Si | No | No | Si |
| /api/incidents | POST (reporte) | Si | Si | Si | Si | Si |
| /api/incidents/:id/status | PATCH | Si | Si | Si (coordinacion) | No | Si |
| /api/dashboard | GET | Si | Si | Si | Metricas publicas | Si |
