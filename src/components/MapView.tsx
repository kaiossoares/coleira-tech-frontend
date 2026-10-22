import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode, type Ref } from 'react';
import L from 'leaflet';
import { AttributionControl, Circle, MapContainer, Marker, Polyline, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { LatLng, TrackingStatus } from '@/api/types';
import { distanceM, moveM, offsetM } from '@/utils/geo';

/**
 * Mapa real (Leaflet + tiles do OpenStreetMap). O círculo da área segura, a casa
 * e o marcador do animal vêm direto das coordenadas recebidas por props, então
 * basta atualizar `pet.position` (polling, WebSocket, SSE…) para o marcador andar.
 *
 * Enquadramento: o mapa se ajusta sozinho à área + animal. Nas variantes
 * interativas, depois que o usuário arrasta/dá zoom, novas posições do animal não
 * mexem mais na câmera até `recenter()` ser chamado (via `ref`).
 */

type Variant = 'card' | 'large' | 'form';

export interface MapViewHandle {
  /** Volta a enquadrar área + animal e retoma o acompanhamento automático. */
  recenter(): void;
}

interface Props {
  variant: Variant;
  center: LatLng | null;
  radiusM: number;
  pet?: { position: LatLng | null; initial: string; status: TrackingStatus } | null;
  /** Mostra o marcador de casa no centro da área. */
  home?: 'small' | 'large' | false;
  /** Mostra a alça no raio (tela de editar área). */
  handle?: boolean;
  /** Toque no mapa ou arraste da casa. Sem isso, a casa fica fixa. */
  onCenterChange?(center: LatLng): void;
  /** Arraste da alça (requer `handle`). */
  onRadiusChange?(radiusM: number): void;
  /** Limites aplicados ao arrastar a alça. */
  radiusLimits?: [min: number, max: number];
  height: number | string;
  children?: ReactNode;
  ref?: Ref<MapViewHandle>;
}

const TILE_URL = (import.meta.env.VITE_MAP_TILE_URL as string | undefined) || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION =
  (import.meta.env.VITE_MAP_ATTRIBUTION as string | undefined) || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/** Vista quando ainda não há nenhuma coordenada (Brasil inteiro). */
const FALLBACK_VIEW = { center: { lat: -14.235, lng: -51.925 }, zoom: 4 };
const POINT_ZOOM = 17;
const MAX_FIT_ZOOM = 18;

// Leaflet escreve as cores como atributos SVG, então usamos os valores dos tokens.
const BLUE = '#1f4fd1';
const AMBER = '#e5a100';
const GRAY = '#9aa2ae';

/** Folga nas bordas para os controles sobrepostos de cada variante: topo, direita, base, esquerda. */
const PADDING: Record<Variant, [number, number, number, number]> = {
  card: [44, 24, 24, 24],
  form: [20, 20, 44, 20],
  large: [80, 76, 88, 24],
};

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function petIcon(status: TrackingStatus, initial: string, big: boolean) {
  const size = big ? 68 : 44;
  return L.divIcon({
    className: 'map-icon',
    iconSize: [size, size],
    html: `<span class="map-pet map-pet--${status}${big ? ' map-pet--big' : ''}"><span>${escapeHtml(initial)}</span></span>`,
  });
}

const HOUSE = '<svg viewBox="0 0 16 12" aria-hidden="true"><path d="M2 11V6l6-5 6 5v5z"/></svg>';

function homeIcon(kind: 'small' | 'large', draggable: boolean) {
  const size = kind === 'large' ? 36 : 26;
  return L.divIcon({
    className: `map-icon${draggable ? ' map-icon--grab' : ''}`,
    iconSize: [size, size],
    html: `<span class="map-home map-home--${kind}">${HOUSE}</span>`,
  });
}

const handleIcon = L.divIcon({ className: 'map-icon map-icon--resize', iconSize: [22, 22], html: '<span class="map-handle"></span>' });

export function MapView({ variant, center, radiusM, pet, home = false, handle, onCenterChange, onRadiusChange, radiusLimits, height, children, ref }: Props) {
  const [map, setMap] = useState<L.Map | null>(null);
  const big = variant === 'large';
  const interactive = big;
  const muted = pet?.status === 'no_signal';
  const position = pet?.position ?? null;

  // Chaves primitivas: o polling devolve objetos novos mesmo sem mudança.
  const areaKey = center ? `${center.lat},${center.lng},${radiusM}` : '';
  const petKey = position ? `${position.lat},${position.lng}` : '';

  const userMoved = useRef(false);
  const fromMap = useRef<string | null>(null);
  const prev = useRef<{ area: string; pet: string } | null>(null);

  const fit = useCallback(
    (animate: boolean) => {
      if (!map) return;
      const [top, right, bottom, left] = PADDING[variant];
      if (center) {
        const r = Math.max(radiusM, 1);
        const b = L.latLngBounds([moveM(center, -r, -r), moveM(center, r, r)]);
        if (position) b.extend(position);
        map.fitBounds(b, { paddingTopLeft: [left, top], paddingBottomRight: [right, bottom], maxZoom: MAX_FIT_ZOOM, animate });
      } else if (position) {
        map.setView(position, POINT_ZOOM, { animate });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [map, variant, areaKey, petKey],
  );

  useEffect(() => {
    if (!map) return;
    const p = prev.current;
    prev.current = { area: areaKey, pet: petKey };
    if (!p) return fit(false);
    // Mudanças feitas no próprio mapa (arrastar casa/alça) não movem a câmera.
    const areaChanged = p.area !== areaKey && areaKey !== fromMap.current;
    const petChanged = p.pet !== petKey && !userMoved.current;
    if (areaChanged || petChanged) fit(true);
  }, [map, areaKey, petKey, fit]);

  useImperativeHandle(ref, () => ({
    recenter() {
      userMoved.current = false;
      fit(true);
    },
  }), [fit]);

  useEffect(() => {
    if (!map || !interactive) return;
    const el = map.getContainer();
    const mark = () => (userMoved.current = true);
    el.addEventListener('pointerdown', mark);
    el.addEventListener('wheel', mark, { passive: true });
    return () => {
      el.removeEventListener('pointerdown', mark);
      el.removeEventListener('wheel', mark);
    };
  }, [map, interactive]);

  const editableCenter = interactive && Boolean(onCenterChange);
  const emitCenterRef = useRef<(c: LatLng) => void>(() => {});
  emitCenterRef.current = (c) => {
    fromMap.current = `${c.lat},${c.lng},${radiusM}`;
    onCenterChange?.(c);
  };
  const emitCenter = (c: LatLng) => emitCenterRef.current(c);

  useEffect(() => {
    if (!map || !editableCenter) return;
    const onClick = (e: L.LeafletMouseEvent) => emitCenterRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
    map.on('click', onClick);
    return () => {
      map.off('click', onClick);
    };
  }, [map, editableCenter]);

  // Enquanto arrasta, a alça segue o dedo; ao soltar, volta para o leste do círculo.
  const [handlePos, setHandlePos] = useState<LatLng | null>(null);

  const petMarkerIcon = useMemo(() => (pet ? petIcon(pet.status, pet.initial, big) : null), [pet?.status, pet?.initial, big]);
  const homeMarkerIcon = useMemo(() => (home ? homeIcon(home, editableCenter) : null), [home, editableCenter]);

  const trail = useMemo(() => {
    if (pet?.status !== 'outside' || !center || !position) return null;
    const o = offsetM(center, position);
    const d = Math.hypot(o.x, o.y);
    if (d <= radiusM) return null;
    return [moveM(center, (o.x / d) * radiusM, (o.y / d) * radiusM), position];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pet?.status, areaKey, petKey]);

  const initialView = center ? { center, zoom: POINT_ZOOM } : position ? { center: position, zoom: POINT_ZOOM } : FALLBACK_VIEW;

  return (
    <div className={`map-frame map-frame--${variant}${muted ? ' map-frame--muted' : ''}`} style={{ height }}>
      <MapContainer
        ref={setMap}
        center={initialView.center}
        zoom={initialView.zoom}
        zoomControl={false}
        attributionControl={false}
        dragging={interactive}
        touchZoom={interactive}
        scrollWheelZoom={interactive}
        doubleClickZoom={interactive}
        boxZoom={interactive}
        keyboard={interactive}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={19} />
        <AttributionControl position="bottomright" prefix={false} />

        {center && (
          <Circle
            center={center}
            radius={radiusM}
            interactive={false}
            pathOptions={{
              color: muted ? GRAY : BLUE,
              opacity: muted || handle ? 1 : 0.55,
              weight: handle ? 2.5 : big ? 2 : 1.5,
              dashArray: handle ? '8 6' : big ? '7 5' : '5 4',
              fillColor: BLUE,
              fillOpacity: muted ? 0 : handle ? 0.12 : 0.1,
            }}
          />
        )}

        {trail && <Polyline positions={trail} interactive={false} pathOptions={{ color: AMBER, weight: 2, dashArray: '3 4' }} />}

        {center && homeMarkerIcon && (
          <Marker
            position={center}
            icon={homeMarkerIcon}
            interactive={editableCenter}
            draggable={editableCenter}
            keyboard={false}
            eventHandlers={{ drag: (e) => emitCenter((e.target as L.Marker).getLatLng()) }}
          />
        )}

        {center && handle && (
          <Marker
            position={handlePos ?? moveM(center, radiusM, 0)}
            icon={handleIcon}
            interactive={interactive && Boolean(onRadiusChange)}
            draggable={interactive && Boolean(onRadiusChange)}
            keyboard={false}
            eventHandlers={{
              drag: (e) => {
                const ll = (e.target as L.Marker).getLatLng();
                setHandlePos(ll);
                const [min, max] = radiusLimits ?? [1, Infinity];
                const r = Math.min(max, Math.max(min, Math.round(distanceM(center, ll) / 10) * 10));
                fromMap.current = `${center.lat},${center.lng},${r}`;
                onRadiusChange?.(r);
              },
              dragend: () => setHandlePos(null),
            }}
          />
        )}

        {position && petMarkerIcon && <Marker position={position} icon={petMarkerIcon} interactive={false} keyboard={false} zIndexOffset={1000} />}
      </MapContainer>
      {children && <div className="map-overlay">{children}</div>}
    </div>
  );
}
