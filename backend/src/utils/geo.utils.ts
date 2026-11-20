/**
 * Modulo de utilidades geoespaciales para compatibilidad con OpenStreetMap y WGS84
 */

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface GeoJsonFeature<P = Record<string, unknown>> {
  type: "Feature";
  geometry: {
    type: "Point" | "Polygon" | "LineString";
    coordinates: number[] | number[][] | number[][][];
  };
  properties: P;
}

export interface GeoJsonFeatureCollection<P = Record<string, unknown>> {
  type: "FeatureCollection";
  features: GeoJsonFeature<P>[];
}

/**
 * Calcula la distancia en kilometros entre dos coordenadas geograficas usando la formula de Haversine
 */
export function calculateHaversineDistanceKm(
  point1: GeoPoint,
  point2: GeoPoint
): number {
  const earthRadiusKm = 6371; // Radio medio de la Tierra en kilometros

  const dLat = degreesToRadians(point2.latitude - point1.latitude);
  const dLng = degreesToRadians(point2.longitude - point1.longitude);

  const lat1Rad = degreesToRadians(point1.latitude);
  const lat2Rad = degreesToRadians(point2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Transforma una lista de entidades geograficas a un FeatureCollection valido de GeoJSON (RFC 7946)
 */
export function toPointFeatureCollection<T extends { latitude: number; longitude: number; id: string }>(
  items: T[],
  propertiesExtractor: (item: T) => Record<string, unknown>
): GeoJsonFeatureCollection {
  return {
    type: "FeatureCollection",
    features: items.map((item) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        // En GeoJSON las coordenadas se expresan en formato [longitud, latitud]
        coordinates: [item.longitude, item.latitude]
      },
      properties: {
        id: item.id,
        ...propertiesExtractor(item)
      }
    }))
  };
}
