import type { LatLng } from '@/api/types';

const EARTH_R = 6_371_000;
const rad = (d: number) => (d * Math.PI) / 180;

/** Distância em metros entre dois pontos (haversine). */
export function distanceM(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.sqrt(h));
}

/** Deslocamento (x leste, y norte) em metros de `to` relativo a `from`. */
export function offsetM(from: LatLng, to: LatLng): { x: number; y: number } {
  return {
    x: rad(to.lng - from.lng) * EARTH_R * Math.cos(rad(from.lat)),
    y: rad(to.lat - from.lat) * EARTH_R,
  };
}

/** Ponto a `dx`/`dy` metros de `from`. */
export function moveM(from: LatLng, dx: number, dy: number): LatLng {
  return {
    lat: from.lat + (dy / EARTH_R) * (180 / Math.PI),
    lng: from.lng + (dx / (EARTH_R * Math.cos(rad(from.lat)))) * (180 / Math.PI),
  };
}

/** Posição atual do aparelho, ou null se negada/indisponível. */
export function currentPosition(timeoutMs = 8000): Promise<LatLng | null> {
  if (!('geolocation' in navigator)) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 },
    );
  });
}
