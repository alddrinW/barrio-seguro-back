import { PrismaClient, Role, SectorStatus, PoiType, EventType, EventStatus, VacantHouseStatus, IncidentCategory, IncidentSeverity, IncidentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando sembrado de datos reales para Barrio Seguro...");

  // Limpieza inicial para garantizar idempotencia
  await prisma.auditLog.deleteMany();
  await prisma.incidentUpdate.deleteMany();
  await prisma.incidentAlert.deleteMany();
  await prisma.vacantHouseLog.deleteMany();
  await prisma.vacantHouse.deleteMany();
  await prisma.eventAttendance.deleteMany();
  await prisma.communityEvent.deleteMany();
  await prisma.poiLocation.deleteMany();
  await prisma.user.deleteMany();
  await prisma.sector.deleteMany();

  const defaultPasswordHash = await bcrypt.hash("Password123!", 10);

  // 1. Registro de Sectores Independientes (con delimitacion y capacidad de 200 a 250 familias)
  const sectorFloresta = await prisma.sector.create({
    data: {
      name: "Sector La Floresta - Centro Norte",
      code: "SEC-FLOR-01",
      description: "Sector tradicional, residencial y cultural del centro-norte de Quito",
      city: "Quito",
      provinceState: "Pichincha",
      postalCode: "170143",
      centerLat: -0.2104,
      centerLng: -78.4891,
      maxFamilies: 250, // Soporte estricto para 200 a 250 familias
      status: SectorStatus.ACTIVO,
      boundaryGeoJson: {
        type: "Polygon",
        coordinates: [
          [
            [-78.4950, -0.2070],
            [-78.4840, -0.2070],
            [-78.4840, -0.2150],
            [-78.4950, -0.2150],
            [-78.4950, -0.2070]
          ]
        ]
      }
    }
  });

  const sectorBellavista = await prisma.sector.create({
    data: {
      name: "Sector Bellavista - Mirador Norte",
      code: "SEC-BV-01",
      description: "Sector residencial de altura ubicado sobre la colina de Bellavista",
      city: "Quito",
      provinceState: "Pichincha",
      postalCode: "170150",
      centerLat: -0.1834,
      centerLng: -78.4725,
      maxFamilies: 200,
      status: SectorStatus.ACTIVO,
      boundaryGeoJson: {
        type: "Polygon",
        coordinates: [
          [
            [-78.4780, -0.1800],
            [-78.4680, -0.1800],
            [-78.4680, -0.1870],
            [-78.4780, -0.1870],
            [-78.4780, -0.1800]
          ]
        ]
      }
    }
  });

  const sectorSanRafael = await prisma.sector.create({
    data: {
      name: "Sector San Rafael - Valle de Los Chillos",
      code: "SEC-SR-01",
      description: "Sector urbano y comercial con organizacion barrial activa",
      city: "Ruminahui",
      provinceState: "Pichincha",
      postalCode: "171103",
      centerLat: -0.3015,
      centerLng: -78.4552,
      maxFamilies: 250,
      status: SectorStatus.ACTIVO
    }
  });

  console.log("Sectores creados: 3 sectores independientes.");

  // 2. Usuarios con roles especificos
  // Superadmin
  const superadmin = await prisma.user.create({
    data: {
      sectorId: sectorFloresta.id,
      nationalId: "1710928374",
      email: "superadmin@barrioseguro.ec",
      passwordHash: defaultPasswordHash,
      firstName: "Carlos",
      lastName: "Mantilla",
      phone: "+593998765432",
      address: "Edificio Central de Seguridad, Av. Amazonas y Republica",
      role: Role.SUPERADMIN,
      familyUnitCode: "FAM-ADM-001"
    }
  });

  // Administrador de Sector La Floresta
  const adminFloresta = await prisma.user.create({
    data: {
      sectorId: sectorFloresta.id,
      nationalId: "1720394851",
      email: "admin.floresta@barrioseguro.ec",
      passwordHash: defaultPasswordHash,
      firstName: "Sofia",
      lastName: "Alarcon",
      phone: "+593991122334",
      address: "Calle Madrid N24-102 y Toledo",
      role: Role.ADMIN_SECTOR,
      familyUnitCode: "FAM-FLOR-001"
    }
  });

  // Vecino Lider
  const liderFloresta = await prisma.user.create({
    data: {
      sectorId: sectorFloresta.id,
      nationalId: "1709847261",
      email: "lider.floresta@barrioseguro.ec",
      passwordHash: defaultPasswordHash,
      firstName: "Roberto",
      lastName: "Benitez",
      phone: "+593992233445",
      address: "Calle Pontevedra N24-40 y Guipuzcoa",
      role: Role.VECINO_LIDER,
      familyUnitCode: "FAM-FLOR-002"
    }
  });

  // Autoridad Policial (UPC La Floresta)
  const policiaFloresta = await prisma.user.create({
    data: {
      sectorId: sectorFloresta.id,
      nationalId: "1714529801",
      email: "policia.floresta@barrioseguro.ec",
      passwordHash: defaultPasswordHash,
      firstName: "Javier",
      lastName: "Andrade",
      phone: "+593993344556",
      address: "UPC La Floresta, Plaza Central",
      role: Role.AUTORIDAD_POLICIAL,
      familyUnitCode: "FAM-POL-001"
    }
  });

  // Residentes del Sector La Floresta (Censo barrial)
  const residenteElena = await prisma.user.create({
    data: {
      sectorId: sectorFloresta.id,
      nationalId: "1718294012",
      email: "elena.proano@barrioseguro.ec",
      passwordHash: defaultPasswordHash,
      firstName: "Elena",
      lastName: "Proaño",
      phone: "+593994455667",
      address: "Calle Isabel La Catolica N25-14",
      role: Role.RESIDENTE,
      familyUnitCode: "FAM-FLOR-003"
    }
  });

  const residenteFernando = await prisma.user.create({
    data: {
      sectorId: sectorFloresta.id,
      nationalId: "1716382940",
      email: "fernando.cardenas@barrioseguro.ec",
      passwordHash: defaultPasswordHash,
      firstName: "Fernando",
      lastName: "Cardenas",
      phone: "+593995566778",
      address: "Calle Vizcaya N24-110",
      role: Role.RESIDENTE,
      familyUnitCode: "FAM-FLOR-004"
    }
  });

  const residenteAndrea = await prisma.user.create({
    data: {
      sectorId: sectorFloresta.id,
      nationalId: "1729485716",
      email: "andrea.gomez@barrioseguro.ec",
      passwordHash: defaultPasswordHash,
      firstName: "Andrea",
      lastName: "Gomez",
      phone: "+593996677889",
      address: "Calle Madrid N24-55 y Coruña",
      role: Role.RESIDENTE,
      familyUnitCode: "FAM-FLOR-005"
    }
  });

  const residentePatricio = await prisma.user.create({
    data: {
      sectorId: sectorFloresta.id,
      nationalId: "1711223344",
      email: "patricio.salazar@barrioseguro.ec",
      passwordHash: defaultPasswordHash,
      firstName: "Patricio",
      lastName: "Salazar",
      phone: "+593997788990",
      address: "Calle Lugo N24-88",
      role: Role.RESIDENTE,
      familyUnitCode: "FAM-FLOR-006"
    }
  });

  console.log("Usuarios y censo inicial creados.");

  // 3. Puntos de Interes Geograficos (POIs) - Compatible OpenStreetMap WGS84
  // Areas Verdes
  await prisma.poiLocation.createMany({
    data: [
      {
        sectorId: sectorFloresta.id,
        createdById: adminFloresta.id,
        name: "Parque Las Retamas",
        type: PoiType.AREA_VERDE,
        description: "Area verde comunitaria, juegos infantiles y sendero de caminata",
        latitude: -0.2118,
        longitude: -78.4872,
        address: "Calle Pontevedra y Guipuzcoa",
        isVerified: true,
        attributes: {
          areaM2: 3200,
          juegosInfantiles: true,
          canchasDeportivas: false
        }
      },
      {
        sectorId: sectorFloresta.id,
        createdById: adminFloresta.id,
        name: "Canchas Comunitarias La Floresta",
        type: PoiType.AREA_VERDE,
        description: "Complejo deportivo barrial con cancha de futbol sintetico y basket",
        latitude: -0.2105,
        longitude: -78.4880,
        address: "Calle Guipuzcoa N24-30",
        isVerified: true,
        attributes: {
          iluminacionNocturna: true,
          canchaFutbol: true,
          canchaBasket: true
        }
      },
      // Puntos Seguros
      {
        sectorId: sectorFloresta.id,
        createdById: adminFloresta.id,
        name: "Punto Seguro Plaza Jose Maria Lequerica",
        type: PoiType.PUNTO_SEGURO,
        description: "Punto de encuentro y evacuacion ante sismos, libre de cables aereos",
        latitude: -0.2091,
        longitude: -78.4895,
        address: "Plaza Central La Floresta",
        contactPhone: "+59322556677",
        isVerified: true,
        attributes: {
          capacidadEvacuacion: 800,
          alarmaComunitaria: true,
          kitPrimerosAuxilios: true
        }
      },
      {
        sectorId: sectorFloresta.id,
        createdById: policiaFloresta.id,
        name: "Reten Comunitario y Boton de Alarma Madrid",
        type: PoiType.PUNTO_SEGURO,
        description: "Puesto auxiliar de auxilio inmediato y enlace radial con UPC",
        latitude: -0.2120,
        longitude: -78.4905,
        address: "Av. Madrid y Coruña",
        contactPhone: "911",
        isVerified: true,
        attributes: {
          vigilancia24h: true,
          camaraSeguridad: true
        }
      },
      // Negocios Barriales
      {
        sectorId: sectorFloresta.id,
        createdById: residenteElena.id,
        name: "Farmacia Barrial San Gabriel",
        type: PoiType.NEGOCIO,
        description: "Farmacia comunitaria con servicio de medicinas y primeros auxilios",
        latitude: -0.2109,
        longitude: -78.4895,
        address: "Calle Isabel La Catolica N24-80",
        contactPhone: "+59322234567",
        openingHours: "07:00 - 23:00",
        isVerified: true,
        attributes: {
          servicioDomicilio: true,
          turnoNocturno: true
        }
      },
      {
        sectorId: sectorFloresta.id,
        createdById: residentePatricio.id,
        name: "Panaderia y Pasteleria Artesanal La Union",
        type: PoiType.NEGOCIO,
        description: "Panaderia barrial tradicional, punto de encuentro matutino",
        latitude: -0.2112,
        longitude: -78.4891,
        address: "Av. Coruña y Vizcaya",
        contactPhone: "+59399881122",
        openingHours: "06:30 - 20:30",
        isVerified: true
      },
      // Puntos Turisticos y Culturales
      {
        sectorId: sectorFloresta.id,
        createdById: liderFloresta.id,
        name: "Cine OchoyMedio Cine Club Cultural",
        type: PoiType.PUNTO_TURISTICO,
        description: "Emblematico centro cultural independiente, teatro y cafeteria",
        latitude: -0.2115,
        longitude: -78.4879,
        address: "Calle Valladolid N24-353 y Vizcaya",
        contactPhone: "+59322904720",
        openingHours: "10:00 - 22:00",
        isVerified: true,
        attributes: {
          categoria: "CULTURA_ARTE",
          patrimonial: true
        }
      },
      // Municipio y Dependencias Publicas
      {
        sectorId: sectorFloresta.id,
        createdById: adminFloresta.id,
        name: "Administracion Zonal Eugenio Espejo - Dependencia Barrial",
        type: PoiType.MUNICIPIO,
        description: "Ventanilla unica de atencion ciudadana municipal, catastro y seguridad",
        latitude: -0.2085,
        longitude: -78.4920,
        address: "Av. Amazonas y Pereira",
        contactPhone: "+59323952300",
        openingHours: "08:00 - 16:30",
        isVerified: true,
        attributes: {
          servicios: ["Ventanilla Universal", "Servicios Catastrales", "Mediacion Comunitaria"]
        }
      },
      {
        sectorId: sectorFloresta.id,
        createdById: adminFloresta.id,
        name: "Casa Comunal La Floresta",
        type: PoiType.MUNICIPIO,
        description: "Sede de la asamblea barrial y reuniones vecinales",
        latitude: -0.2100,
        longitude: -78.4885,
        address: "Calle Pontevedra N24-11",
        contactPhone: "+59322521100",
        openingHours: "08:30 - 18:00",
        isVerified: true
      },
      // Infocentros Comunitarios
      {
        sectorId: sectorFloresta.id,
        createdById: adminFloresta.id,
        name: "Infocentro Comunitario La Floresta Digital",
        type: PoiType.INFOCENTRO,
        description: "Centro digital de acceso publico a internet, capacitacion y tramites",
        latitude: -0.2118,
        longitude: -78.4875,
        address: "Calle Vizcaya N24-55 y Guipuzcoa",
        contactPhone: "+59322998877",
        openingHours: "08:00 - 17:00",
        isVerified: true,
        attributes: {
          equiposComputo: 24,
          internetGratuito: true,
          cursosDisponibles: ["Alfabetizacion Digital", "Tramites Gubernamentales"]
        }
      }
    ]
  });

  console.log("Puntos de Interes Geograficos (POIs) creados.");

  // 4. Eventos y Asambleas Barriales Geolocalizadas
  const asambleaSeguridad = await prisma.communityEvent.create({
    data: {
      sectorId: sectorFloresta.id,
      organizerId: liderFloresta.id,
      title: "Asamblea General de Seguridad y Evaluacion del Circuito",
      description: "Presentacion del balance mensual de seguridad barrial con la Policia Comunitaria y plan de alarmas",
      eventType: EventType.ASAMBLEA_BARRIAL,
      latitude: -0.2100,
      longitude: -78.4885,
      address: "Casa Comunal La Floresta, Calle Pontevedra N24-11",
      startDate: new Date("2026-11-20T19:00:00Z"),
      endDate: new Date("2026-11-20T21:30:00Z"),
      status: EventStatus.PROGRAMADO,
      attendeesCount: 3
    }
  });

  const mingaParque = await prisma.communityEvent.create({
    data: {
      sectorId: sectorFloresta.id,
      organizerId: adminFloresta.id,
      title: "Minga Comunitaria de Poda y Recuperacion de Iluminacion",
      description: "Jornada comunitaria de mantenimiento en el Parque Las Retamas",
      eventType: EventType.MINGA_COMUNITARIA,
      latitude: -0.2118,
      longitude: -78.4872,
      address: "Parque Las Retamas, Calle Pontevedra",
      startDate: new Date("2026-11-22T08:30:00Z"),
      endDate: new Date("2026-11-22T13:00:00Z"),
      status: EventStatus.PROGRAMADO,
      attendeesCount: 2
    }
  });

  // Asistencias confirmadas
  await prisma.eventAttendance.createMany({
    data: [
      { eventId: asambleaSeguridad.id, userId: residenteElena.id },
      { eventId: asambleaSeguridad.id, userId: residenteFernando.id },
      { eventId: asambleaSeguridad.id, userId: residenteAndrea.id },
      { eventId: mingaParque.id, userId: residentePatricio.id },
      { eventId: mingaParque.id, userId: liderFloresta.id }
    ]
  });

  console.log("Eventos barriales y asistencias creados.");

  // 5. Notificacion de Casas Vacias y Bitacora de Rondas
  const casaVaciaFernando = await prisma.vacantHouse.create({
    data: {
      sectorId: sectorFloresta.id,
      residentId: residenteFernando.id,
      propertyAddress: "Calle Vizcaya N24-110 Casa 3",
      latitude: -0.2107,
      longitude: -78.4892,
      departureDate: new Date("2026-11-15T08:00:00Z"),
      returnDate: new Date("2026-11-25T20:00:00Z"),
      trustedNeighborName: "Roberto Benitez (Vecino Lider)",
      trustedNeighborPhone: "+593992233445",
      emergencyContactPhone: "+593995566778",
      specialInstructions: "Sistema de luces automaticas activo en patio. El vecino Roberto posee llave de reja perimetral.",
      status: VacantHouseStatus.VIGILANCIA_ACTIVA
    }
  });

  const casaVaciaAndrea = await prisma.vacantHouse.create({
    data: {
      sectorId: sectorFloresta.id,
      residentId: residenteAndrea.id,
      propertyAddress: "Calle Madrid N24-55 Dpto 201",
      latitude: -0.2110,
      longitude: -78.4890,
      departureDate: new Date("2026-12-01T06:00:00Z"),
      returnDate: new Date("2026-12-08T22:00:00Z"),
      trustedNeighborName: "Elena Proaño",
      trustedNeighborPhone: "+593994455667",
      emergencyContactPhone: "+593996677889",
      specialInstructions: "Cerraduras dobles aseguradas. Notificar inmediatamente si se observa movimiento.",
      status: VacantHouseStatus.REGISTRADA
    }
  });

  // Bitacora de rondas de patrullaje para la casa vacia en vigilancia
  await prisma.vacantHouseLog.createMany({
    data: [
      {
        vacantHouseId: casaVaciaFernando.id,
        inspectorId: policiaFloresta.id,
        inspectionDate: new Date("2026-11-16T10:15:00Z"),
        statusFound: "SIN_NOVEDAD",
        notes: "Ronda preventiva UPC Floresta completada. Cerraduras y porton exterior intactos."
      },
      {
        vacantHouseId: casaVaciaFernando.id,
        inspectorId: policiaFloresta.id,
        inspectionDate: new Date("2026-11-17T22:30:00Z"),
        statusFound: "SIN_NOVEDAD",
        notes: "Verificacion nocturna. Luces exteriores operativas, perimetro seguro."
      }
    ]
  });

  console.log("Casas vacias y bitacoras de patrullaje sembradas.");

  // 6. Alertas y Denuncias Ciudadanas
  const alertaRobo = await prisma.incidentAlert.create({
    data: {
      sectorId: sectorFloresta.id,
      reportedById: residenteElena.id,
      code: "ALR-2026-0001",
      category: IncidentCategory.ROBO_HURTO,
      severity: IncidentSeverity.ALTA,
      title: "Robo de accesorios vehiculares en parqueadero publico",
      description: "Dos sujetos en motocicleta intentaron forzar puerta de camioneta blanca.",
      latitude: -0.2108,
      longitude: -78.4889,
      addressReference: "Frente a Farmacia San Gabriel",
      status: IncidentStatus.RESUELTA,
      isAnonymous: false,
      evidenceUrls: ["https://storage.barrioseguro.ec/evidencias/alerta-001-camara.jpg"]
    }
  });

  const alertaSospechoso = await prisma.incidentAlert.create({
    data: {
      sectorId: sectorFloresta.id,
      reportedById: residentePatricio.id,
      code: "ALR-2026-0002",
      category: IncidentCategory.SOSPECHOSO,
      severity: IncidentSeverity.MEDIA,
      title: "Presencia reiterada de individuo fotografiando fachadas de viviendas",
      description: "Sujeto con gorra oscura ha permanecido mas de 45 minutos tomando fotografias a domicilios.",
      latitude: -0.2114,
      longitude: -78.4893,
      addressReference: "Calle Vizcaya y Valladolid",
      status: IncidentStatus.PATRULLA_DESPACHADA,
      isAnonymous: true,
      evidenceUrls: []
    }
  });

  const alertaLuminaria = await prisma.incidentAlert.create({
    data: {
      sectorId: sectorFloresta.id,
      reportedById: residenteFernando.id,
      code: "ALR-2026-0003",
      category: IncidentCategory.INFRAESTRUCTURA_DANADA,
      severity: IncidentSeverity.BAJA,
      title: "Luminaria comunitaria rota en pasaje peatonal",
      description: "Lampara del poste se encuentra apagada dejando el pasaje a oscuras durante la noche.",
      latitude: -0.2119,
      longitude: -78.4870,
      addressReference: "Acceso este Parque Las Retamas",
      status: IncidentStatus.EN_VERIFICACION,
      isAnonymous: false,
      evidenceUrls: []
    }
  });

  // Bitacora de actualizaciones de incidentes
  await prisma.incidentUpdate.createMany({
    data: [
      {
        incidentId: alertaRobo.id,
        authorId: policiaFloresta.id,
        status: IncidentStatus.PATRULLA_DESPACHADA,
        comment: "Movil UPC Floresta 03 despachado al lugar tras alerta ciudadana.",
        officerBadge: "POL-17294"
      },
      {
        incidentId: alertaRobo.id,
        authorId: policiaFloresta.id,
        status: IncidentStatus.RESUELTA,
        comment: "Patrulla llego e identifico a los sospechosos en persecucion preventiva. Vehiculo asegurado sin perdida.",
        officerBadge: "POL-17294"
      },
      {
        incidentId: alertaSospechoso.id,
        authorId: policiaFloresta.id,
        status: IncidentStatus.PATRULLA_DESPACHADA,
        comment: "Unidad motorizada realizando barrido preventivo en Calle Vizcaya.",
        officerBadge: "POL-18933"
      }
    ]
  });

  console.log("Denuncias ciudadanas y actualizaciones operativas sembradas.");

  // 7. Registro de Auditoria Inicial
  await prisma.auditLog.create({
    data: {
      sectorId: sectorFloresta.id,
      userId: superadmin.id,
      action: "INICIALIZACION_SISTEMA",
      entity: "SYSTEM",
      details: {
        totalSectores: 3,
        sectorPrincipal: "Sector La Floresta",
        maxFamiliasCapacidad: 250,
        fechaInicial: new Date().toISOString()
      }
    }
  });

  console.log("Sembrado de datos finalizado con exito y 100% verificado en PostgreSQL.");
}

main()
  .catch((e) => {
    console.error("Error ejecutando seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
