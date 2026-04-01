const FALLBACK_TRANSPORT_SPEEDS_KMH = {
  bicycle: 12,
  motorbike: 26,
  car: 22,
} as const;

const AT_LOCATION_THRESHOLD_METERS = 25;
const NEARBY_THRESHOLD_METERS = 90;
const ARRIVING_NOW_THRESHOLD_METERS = 180;

function roundDisplayMeters(distanceMeters: number) {
  if (distanceMeters <= AT_LOCATION_THRESHOLD_METERS) {
    return 0;
  }

  if (distanceMeters < 100) {
    return Math.round(distanceMeters / 10) * 10;
  }

  if (distanceMeters < 1000) {
    return Math.round(distanceMeters / 25) * 25;
  }

  return distanceMeters;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function getDistanceKm(
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number },
) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(end.latitude - start.latitude);
  const dLng = toRadians(end.longitude - start.longitude);
  const lat1 = toRadians(start.latitude);
  const lat2 = toRadians(end.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getLiveRouteMetrics({
  riderLocation,
  destination,
  speedMps,
  transportMode = "bicycle",
}: {
  riderLocation?: { latitude: number; longitude: number } | null;
  destination?: { latitude: number; longitude: number } | null;
  speedMps?: number | null;
  transportMode?: keyof typeof FALLBACK_TRANSPORT_SPEEDS_KMH;
}) {
  if (!riderLocation || !destination) {
    return null;
  }

  const distanceKm = getDistanceKm(riderLocation, destination);
  const distanceMeters = Math.max(0, Math.round(distanceKm * 1000));
  const displayMeters = roundDisplayMeters(distanceMeters);
  const speedKmh =
    typeof speedMps === "number" && speedMps > 0.8
      ? speedMps * 3.6
      : FALLBACK_TRANSPORT_SPEEDS_KMH[transportMode];
  const etaMinutes =
    distanceMeters <= NEARBY_THRESHOLD_METERS
      ? 0
      : Math.max(1, Math.ceil((distanceKm / speedKmh) * 60));
  const distanceLabel =
    distanceMeters <= AT_LOCATION_THRESHOLD_METERS
      ? "At customer"
      : distanceMeters <= NEARBY_THRESHOLD_METERS
        ? "Nearby"
        : displayMeters < 1000
          ? `${displayMeters} m`
          : `${distanceKm.toFixed(1)} km`;
  const etaLabel =
    distanceMeters <= ARRIVING_NOW_THRESHOLD_METERS
      ? "Arriving now"
      : etaMinutes === 1
        ? "1 min away"
        : `${etaMinutes} min away`;

  return {
    distanceKm,
    distanceMeters,
    displayMeters,
    etaMinutes,
    distanceLabel,
    etaLabel,
  };
}
