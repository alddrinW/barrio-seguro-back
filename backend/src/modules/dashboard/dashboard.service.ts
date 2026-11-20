import { prisma } from "../../config/database.js";

export class DashboardService {
  /**
   * Metricas consolidadas barriales para directivas y autoridades
   */
  static async getSectorMetrics(sectorId: string) {
    const sector = await prisma.sector.findUnique({
      where: { id: sectorId }
    });

    if (!sector) {
      throw { statusCode: 404, message: "Sector no encontrado" };
    }

    const [
      totalResidents,
      distinctFamilies,
      poisByType,
      incidentsBySeverity,
      incidentsByStatus,
      activeVacantHouses,
      upcomingEvents
    ] = await Promise.all([
      prisma.user.count({ where: { sectorId, isActive: true } }),
      prisma.user.findMany({
        where: { sectorId, familyUnitCode: { not: null } },
        distinct: ["familyUnitCode"],
        select: { familyUnitCode: true }
      }),
      prisma.poiLocation.groupBy({
        by: ["type"],
        where: { sectorId },
        _count: { _all: true }
      }),
      prisma.incidentAlert.groupBy({
        by: ["severity"],
        where: { sectorId },
        _count: { _all: true }
      }),
      prisma.incidentAlert.groupBy({
        by: ["status"],
        where: { sectorId },
        _count: { _all: true }
      }),
      prisma.vacantHouse.count({
        where: { sectorId, status: "VIGILANCIA_ACTIVA" }
      }),
      prisma.communityEvent.count({
        where: {
          sectorId,
          endDate: { gte: new Date() },
          status: "PROGRAMADO"
        }
      })
    ]);

    const currentFamilies = distinctFamilies.length;
    const capacityPercentage = Number(
      ((currentFamilies / sector.maxFamilies) * 100).toFixed(1)
    );

    return {
      sector: {
        id: sector.id,
        name: sector.name,
        code: sector.code,
        city: sector.city,
        center: {
          latitude: sector.centerLat,
          longitude: sector.centerLng
        }
      },
      capacity: {
        maxFamilies: sector.maxFamilies,
        currentFamilies,
        availableSlots: Math.max(0, sector.maxFamilies - currentFamilies),
        capacityPercentage,
        totalResidents
      },
      poisSummary: poisByType.map((p) => ({ type: p.type, count: p._count._all })),
      incidentsSummary: {
        bySeverity: incidentsBySeverity.map((s) => ({ severity: s.severity, count: s._count._all })),
        byStatus: incidentsByStatus.map((st) => ({ status: st.status, count: st._count._all }))
      },
      securityPreventive: {
        activeVacantHousesUnderPatrol: activeVacantHouses
      },
      communityParticipation: {
        upcomingEventsCount: upcomingEvents
      }
    };
  }

  /**
   * Metricas globales a nivel ciudad / sistema para Superadmin
   */
  static async getGlobalMetrics() {
    const [
      totalSectores,
      totalUsuarios,
      totalPois,
      totalIncidentes,
      totalCasasVacias,
      incidentesCriticos
    ] = await Promise.all([
      prisma.sector.count({ where: { status: "ACTIVO" } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.poiLocation.count(),
      prisma.incidentAlert.count(),
      prisma.vacantHouse.count({ where: { status: "VIGILANCIA_ACTIVA" } }),
      prisma.incidentAlert.count({ where: { severity: "CRITICA", status: { not: "RESUELTA" } } })
    ]);

    return {
      totalSectoresActivos: totalSectores,
      totalUsuariosRegistrados: totalUsuarios,
      totalPuntosGeograficosMapeados: totalPois,
      totalIncidentesHistoricos: totalIncidentes,
      casasEnVigilanciaActiva: totalCasasVacias,
      alertasCriticasPendientes: incidentesCriticos
    };
  }
}
