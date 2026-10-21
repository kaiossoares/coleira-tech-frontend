import type { Collar, LocationFix, SafeArea, TrackingStatus } from '@/api/types';
import { distanceM } from './geo';

/**
 * Regra de status usada pelo mock. O backend deve aplicar a mesma regra
 * e devolver `status` pronto; o app apenas exibe.
 * - sem posição recente (3× o intervalo, mínimo 5 min) → no_signal
 * - fora do raio da área segura → outside
 * - caso contrário → tracking
 */
export function deriveStatus(
  collar: Collar | null,
  area: SafeArea | null,
  fix: LocationFix | null,
  now = Date.now(),
): { status: TrackingStatus; distanceFromCenterM: number | null } {
  if (!collar || !fix) return { status: 'no_signal', distanceFromCenterM: null };
  const dist = area ? distanceM(area.center, fix) : null;
  const staleAfter = Math.max(collar.updateIntervalSec * 3, 300) * 1000;
  if (collar.signal === 'none' || now - Date.parse(fix.recordedAt) > staleAfter) {
    return { status: 'no_signal', distanceFromCenterM: dist };
  }
  if (area && dist !== null && dist > area.radiusM) return { status: 'outside', distanceFromCenterM: dist };
  return { status: 'tracking', distanceFromCenterM: dist };
}
