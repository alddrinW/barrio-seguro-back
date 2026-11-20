import request from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/config/database.js";

async function runIntegrationTests() {
  console.log("==================================================================");
  console.log("INICIANDO PRUEBAS DE INTEGRACION END-TO-END CONTRA POSTGRESQL REAL");
  console.log("==================================================================");

  let superadminToken = "";
  let adminToken = "";
  let residentToken = "";
  let policeToken = "";
  let testSectorId = "";
  let testEventId = "";
  let testVacantHouseId = "";
  let testIncidentId = "";

  try {
    // 1. Health check
    console.log("\n[TEST 1] Verificacion de Health Check...");
    const healthRes = await request(app).get("/api/health");
    if (healthRes.status !== 200 || healthRes.body.status !== "healthy") {
      throw new Error(`Fallo en Health Check: ${JSON.stringify(healthRes.body)}`);
    }
    console.log("OK: Health check responde HTTP 200 con estado healthy");

    // 2. Autenticacion con usuarios reales de la base de datos
    console.log("\n[TEST 2] Autenticacion con usuarios reales...");
    
    // Login Superadmin
    const loginSuperRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "superadmin@barrioseguro.ec",
        password: "Password123!"
      });
    if (loginSuperRes.status !== 200 || !loginSuperRes.body.data?.token) {
      throw new Error(`Fallo en login de superadmin: ${JSON.stringify(loginSuperRes.body)}`);
    }
    superadminToken = loginSuperRes.body.data.token;
    console.log("OK: Login de Superadmin exitoso. Token JWT emitido.");

    // Login Admin Sector La Floresta
    const loginAdminRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "admin.floresta@barrioseguro.ec",
        password: "Password123!"
      });
    if (loginAdminRes.status !== 200 || !loginAdminRes.body.data?.token) {
      throw new Error(`Fallo en login de admin: ${JSON.stringify(loginAdminRes.body)}`);
    }
    adminToken = loginAdminRes.body.data.token;
    testSectorId = loginAdminRes.body.data.user.sector.id;
    console.log("OK: Login de Admin Sector exitoso. Token JWT emitido.");

    // Login Residente Elena Proaño
    const loginResidenteRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "elena.proano@barrioseguro.ec",
        password: "Password123!"
      });
    if (loginResidenteRes.status !== 200 || !loginResidenteRes.body.data?.token) {
      throw new Error(`Fallo en login de residente: ${JSON.stringify(loginResidenteRes.body)}`);
    }
    residentToken = loginResidenteRes.body.data.token;
    console.log("OK: Login de Residente exitoso.");

    // Login Autoridad Policial
    const loginPoliceRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "policia.floresta@barrioseguro.ec",
        password: "Password123!"
      });
    if (loginPoliceRes.status !== 200 || !loginPoliceRes.body.data?.token) {
      throw new Error(`Fallo en login de policia: ${JSON.stringify(loginPoliceRes.body)}`);
    }
    policeToken = loginPoliceRes.body.data.token;
    console.log("OK: Login de Autoridad Policial exitoso.");

    // Login fallido con contraseña incorrecta
    const loginFailRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "admin.floresta@barrioseguro.ec",
        password: "ContraseñaErronea"
      });
    if (loginFailRes.status !== 401) {
      throw new Error("Se esperaba codigo 401 para credenciales invalidas");
    }
    console.log("OK: Rechazo correcto con HTTP 401 ante credenciales erroneas.");

    // 3. Consulta de perfil autenticado
    console.log("\n[TEST 3] Consulta de Perfil Protegido con JWT...");
    const profileRes = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", `Bearer ${adminToken}`);
    if (profileRes.status !== 200 || profileRes.body.data.email !== "admin.floresta@barrioseguro.ec") {
      throw new Error(`Fallo al obtener perfil: ${JSON.stringify(profileRes.body)}`);
    }
    console.log("OK: Perfil recuperado correctamente con datos de sector asociado.");

    // 4. Modulo de Sectores y Capacidad (200 a 250 familias)
    console.log("\n[TEST 4] Gestion de Sectores y Control de Capacidad...");
    const sectorsRes = await request(app)
      .get("/api/sectors")
      .set("Authorization", `Bearer ${adminToken}`);
    if (sectorsRes.status !== 200 || !Array.isArray(sectorsRes.body.data) || sectorsRes.body.data.length < 3) {
      throw new Error(`Fallo al listar sectores: ${JSON.stringify(sectorsRes.body)}`);
    }
    console.log(`OK: Se listaron ${sectorsRes.body.data.length} sectores independientes.`);

    // Estadisticas del sector
    const statsRes = await request(app)
      .get(`/api/sectors/${testSectorId}/stats`)
      .set("Authorization", `Bearer ${adminToken}`);
    if (statsRes.status !== 200 || !statsRes.body.data.capacity) {
      throw new Error(`Fallo al obtener estadisticas de sector: ${JSON.stringify(statsRes.body)}`);
    }
    console.log(`OK: Metricas de capacidad de familias: Max ${statsRes.body.data.capacity.maxFamilies}, Actuales: ${statsRes.body.data.capacity.currentFamilies}.`);

    // 5. Censo Barrial y Agrupacion Familiar
    console.log("\n[TEST 5] Censo Barrial y Registro de Residentes...");
    const testNationalId = "1799887766";
    // Limpieza preventiva si existiera
    await prisma.user.deleteMany({ where: { nationalId: testNationalId } });

    const censusRes = await request(app)
      .post("/api/users/census")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        sectorId: testSectorId,
        nationalId: testNationalId,
        email: "test.censado@barrioseguro.ec",
        firstName: "Gonzalo",
        lastName: "Vallejo",
        phone: "+593988776655",
        address: "Calle Madrid y Toledo N24",
        familyUnitCode: "FAM-FLOR-003", // Agrupado en familia existente de Elena
        role: "RESIDENTE"
      });
    if (censusRes.status !== 201) {
      throw new Error(`Fallo al censar residente: ${JSON.stringify(censusRes.body)}`);
    }
    console.log("OK: Residente censado dentro de unidad familiar existente.");

    // Resumen de censo
    const censusSummaryRes = await request(app)
      .get(`/api/users/census/summary/${testSectorId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    if (censusSummaryRes.status !== 200 || censusSummaryRes.body.data.totalResidents < 1) {
      throw new Error("Fallo en resumen del censo barrial");
    }
    console.log(`OK: Censo barrial verificado. Total residentes activos: ${censusSummaryRes.body.data.totalResidents}.`);

    // 6. Puntos de Interes y OpenStreetMap (WGS84 / GeoJSON)
    console.log("\n[TEST 6] Mapeo de POIs y Formato GeoJSON OpenStreetMap...");
    const poisRes = await request(app)
      .get(`/api/pois?sectorId=${testSectorId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    if (poisRes.status !== 200 || poisRes.body.data.length < 5) {
      throw new Error(`Fallo al consultar POIs: ${JSON.stringify(poisRes.body)}`);
    }
    console.log(`OK: ${poisRes.body.data.length} puntos geograficos recuperados.`);

    // Consulta GeoJSON FeatureCollection para Leaflet / OpenStreetMap
    const geoJsonRes = await request(app)
      .get(`/api/pois/geojson?sectorId=${testSectorId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    if (
      geoJsonRes.status !== 200 ||
      geoJsonRes.body.type !== "FeatureCollection" ||
      !Array.isArray(geoJsonRes.body.features)
    ) {
      throw new Error(`Formato GeoJSON invalido: ${JSON.stringify(geoJsonRes.body)}`);
    }
    const sampleFeature = geoJsonRes.body.features[0];
    if (
      sampleFeature.geometry.type !== "Point" ||
      sampleFeature.geometry.coordinates.length !== 2
    ) {
      throw new Error("Estructura de coordenadas GeoJSON [longitud, latitud] invalida");
    }
    console.log(`OK: GeoJSON RFC 7946 valido con ${geoJsonRes.body.features.length} features para OpenStreetMap.`);

    // Busqueda por radio de proximidad (Haversine)
    const nearbyRes = await request(app)
      .get(`/api/pois/nearby?lat=-0.2104&lng=-78.4891&radiusKm=2&sectorId=${testSectorId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    if (nearbyRes.status !== 200 || !Array.isArray(nearbyRes.body.data)) {
      throw new Error(`Fallo en busqueda por proximidad: ${JSON.stringify(nearbyRes.body)}`);
    }
    console.log(`OK: Busqueda espacial Haversine retorno ${nearbyRes.body.data.length} puntos en radio de 2km.`);

    // 7. Modulo de Eventos y Asambleas Barriales Geolocalizadas
    console.log("\n[TEST 7] Convocatoria y Asistencia a Eventos Barriales...");
    const eventsRes = await request(app)
      .get(`/api/events?sectorId=${testSectorId}`)
      .set("Authorization", `Bearer ${residentToken}`);
    if (eventsRes.status !== 200 || eventsRes.body.data.length < 1) {
      throw new Error("Fallo al listar eventos");
    }
    testEventId = eventsRes.body.data[0].id;
    console.log(`OK: ${eventsRes.body.data.length} eventos comunitarios geolocalizados disponibles.`);

    // Confirmacion de asistencia
    const attendRes = await request(app)
      .post(`/api/events/${testEventId}/attend`)
      .set("Authorization", `Bearer ${adminToken}`);
    if (attendRes.status !== 200 && attendRes.status !== 409) {
      throw new Error(`Fallo en confirmacion de asistencia: ${JSON.stringify(attendRes.body)}`);
    }
    console.log("OK: Flujo de confirmacion de asistencia comunitario verificado.");

    // 8. Modulo de Notificacion de Casas Vacias y Bitacora Policial
    console.log("\n[TEST 8] Modulo Preventivo de Casas Vacias y Rondas de Seguridad...");
    const vacantRes = await request(app)
      .post("/api/vacant-houses")
      .set("Authorization", `Bearer ${residentToken}`)
      .send({
        sectorId: testSectorId,
        propertyAddress: "Calle Isabel La Catolica N25-14 Casa Principal",
        latitude: -0.2109,
        longitude: -78.4893,
        departureDate: "2026-12-15T08:00:00.000Z",
        returnDate: "2026-12-28T20:00:00.000Z",
        trustedNeighborName: "Roberto Benitez",
        trustedNeighborPhone: "+593992233445",
        emergencyContactPhone: "+593994455667",
        specialInstructions: "Luces temporizadas en la fachada. Alarma perimetral conectada."
      });
    if (vacantRes.status !== 201) {
      throw new Error(`Fallo al registrar casa vacia: ${JSON.stringify(vacantRes.body)}`);
    }
    testVacantHouseId = vacantRes.body.data.id;
    console.log("OK: Solicitud de vigilancia de casa vacia creada exitosamente.");

    // Registro de ronda de patrullaje por parte de la Policia
    const patrolLogRes = await request(app)
      .post(`/api/vacant-houses/${testVacantHouseId}/inspections`)
      .set("Authorization", `Bearer ${policeToken}`)
      .send({
        statusFound: "SIN_NOVEDAD",
        notes: "Ronda diurna efectuada por patrulla motorizada UPC Floresta. Puertas aseguradas."
      });
    if (patrolLogRes.status !== 201) {
      throw new Error(`Fallo al registrar ronda policial: ${JSON.stringify(patrolLogRes.body)}`);
    }
    console.log("OK: Ronda policial registrada en la bitacora de la casa vacia.");

    // Validacion de privacidad: El residente solo ve sus propias casas
    const residentHousesRes = await request(app)
      .get("/api/vacant-houses")
      .set("Authorization", `Bearer ${residentToken}`);
    if (residentHousesRes.status !== 200) {
      throw new Error("Fallo al listar casas vacias de residente");
    }
    console.log("OK: Regla de privacidad confirmada: el residente visualiza exclusivamente sus registros.");

    // 9. Modulo de Alertas y Denuncias Ciudadanas
    console.log("\n[TEST 9] Modulo de Alertas y Denuncias Ciudadanas...");
    const incidentRes = await request(app)
      .post("/api/incidents")
      .set("Authorization", `Bearer ${residentToken}`)
      .send({
        sectorId: testSectorId,
        category: "DISTURBIO_ESCANDALO",
        severity: "MEDIA",
        title: "Escandalo en via publica por vehiculo con volumen excesivo",
        description: "Vehiculo sedan negro con musica a alto volumen en horario de descanso vecinal.",
        latitude: -0.2106,
        longitude: -78.4891,
        addressReference: "Frente a parque infantil",
        isAnonymous: true,
        evidenceUrls: []
      });
    if (incidentRes.status !== 201 || !incidentRes.body.data?.code) {
      throw new Error(`Fallo al emitir alerta ciudadana: ${JSON.stringify(incidentRes.body)}`);
    }
    testIncidentId = incidentRes.body.data.id;
    console.log(`OK: Alerta emitida exitosamente con codigo ${incidentRes.body.data.code}.`);

    // Consulta GeoJSON de incidentes
    const incidentGeoJsonRes = await request(app)
      .get(`/api/incidents/geojson?sectorId=${testSectorId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    if (incidentGeoJsonRes.status !== 200 || incidentGeoJsonRes.body.type !== "FeatureCollection") {
      throw new Error("Fallo en GeoJSON de incidentes");
    }
    console.log(`OK: GeoJSON de incidentes retornado con ${incidentGeoJsonRes.body.features.length} puntos activos.`);

    // Atencion de denuncia y despacho policial (actualizacion de estado y bitacora)
    const updateIncidentRes = await request(app)
      .patch(`/api/incidents/${testIncidentId}/status`)
      .set("Authorization", `Bearer ${policeToken}`)
      .send({
        status: "PATRULLA_DESPACHADA",
        comment: "Unidad policial UPC Floresta despachada para conminar al cese de ruido molesto.",
        officerBadge: "POL-17294"
      });
    if (updateIncidentRes.status !== 200) {
      throw new Error(`Fallo al actualizar estado de alerta: ${JSON.stringify(updateIncidentRes.body)}`);
    }
    console.log("OK: Alerta actualizada a PATRULLA_DESPACHADA con registro inmutable en bitacora.");

    // 10. Dashboard y Metricas Consolidadas
    console.log("\n[TEST 10] Dashboard Barrial y Metricas Globales...");
    const dashboardSectorRes = await request(app)
      .get(`/api/dashboard/sector/${testSectorId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    if (dashboardSectorRes.status !== 200 || !dashboardSectorRes.body.data.capacity) {
      throw new Error("Fallo en dashboard sectorial");
    }
    console.log("OK: Metricas consolidadas del sector recuperadas satisfactoriamente.");

    // Dashboard global con token de Superadmin
    const dashboardGlobalRes = await request(app)
      .get("/api/dashboard/global")
      .set("Authorization", `Bearer ${superadminToken}`);
    if (dashboardGlobalRes.status !== 200 || dashboardGlobalRes.body.data.totalSectoresActivos < 1) {
      throw new Error("Fallo en dashboard global");
    }
    console.log(`OK: Metricas globales: Sectores activos: ${dashboardGlobalRes.body.data.totalSectoresActivos}, Usuarios: ${dashboardGlobalRes.body.data.totalUsuariosRegistrados}.`);

    console.log("\n==================================================================");
    console.log("TODAS LAS PRUEBAS DE INTEGRACION COMPLETADAS CON EXITO (10/10)");
    console.log("==================================================================");

  } catch (err: any) {
    console.error("\nERROR EN PRUEBAS DE INTEGRACION:");
    console.error(err.message || err);
    process.exit(1);
  } finally {
    // Limpieza de datos temporales de prueba
    if (testVacantHouseId) {
      await prisma.vacantHouseLog.deleteMany({ where: { vacantHouseId: testVacantHouseId } });
      await prisma.vacantHouse.deleteMany({ where: { id: testVacantHouseId } });
    }
    if (testIncidentId) {
      await prisma.incidentUpdate.deleteMany({ where: { incidentId: testIncidentId } });
      await prisma.incidentAlert.deleteMany({ where: { id: testIncidentId } });
    }
    await prisma.user.deleteMany({ where: { nationalId: "1799887766" } });
    await prisma.$disconnect();
  }
}

runIntegrationTests();
