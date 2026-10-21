import type { ReactNode } from 'react';
import type { LatLng, TrackingStatus } from '@/api/types';
import { offsetM } from '@/utils/geo';

/**
 * Mapa ilustrado do design. O fundo (ruas, parques, água) é decorativo, mas
 * o círculo da área segura e o marcador do animal são posicionados em escala
 * a partir dos dados reais (centro, raio e última posição).
 *
 * Para trocar por um mapa de verdade (Leaflet, Google Maps, Mapbox), mantenha
 * esta mesma interface de props e substitua a implementação.
 */

type Variant = 'card' | 'large' | 'form';

interface Props {
  variant: Variant;
  /** Escolhe um dos traçados de rua do fundo (cartões da tela inicial). */
  layout?: number;
  center: LatLng | null;
  radiusM: number;
  pet?: { position: LatLng | null; initial: string; status: TrackingStatus } | null;
  /** Mostra o marcador de casa no centro da área. */
  home?: 'small' | 'large' | false;
  /** Mostra a alça no raio (tela de editar área). */
  handle?: boolean;
  /** Raio do círculo em px do viewBox. Padrão: tamanho fixo, com o animal em escala relativa. */
  ringPx?: number;
  height: number | string;
  children?: ReactNode;
}

const SIZES: Record<Variant, { w: number; h: number; ring: number }> = {
  card: { w: 342, h: 140, ring: 46 },
  form: { w: 342, h: 150, ring: 52 },
  large: { w: 390, h: 420, ring: 92 },
};

function Background({ variant, layout, muted }: { variant: Variant; layout: number; muted: boolean }) {
  if (variant === 'large') {
    return (
      <>
        <rect width="390" height="420" fill="var(--map-ground)" />
        <rect x="250" y="250" width="120" height="90" rx="14" fill="var(--map-park)" />
        <rect x="20" y="20" width="70" height="60" rx="10" fill="var(--map-park)" />
        <path d="M0 370 C70 350 140 390 210 370 S330 352 390 372 V420 H0Z" fill="var(--map-water)" />
        <g stroke="#FFFFFF" strokeLinecap="round" fill="none">
          <path d="M-5 120 H395" strokeWidth="14" />
          <path d="M130 -5 V425" strokeWidth="14" />
          <path d="M-5 300 L395 220" strokeWidth="9" />
          <path d="M310 -5 V425" strokeWidth="9" />
          <path d="M-5 210 H130" strokeWidth="6" />
          <path d="M200 -5 V140" strokeWidth="6" />
        </g>
      </>
    );
  }
  if (variant === 'form') {
    return (
      <>
        <rect width="342" height="150" fill="var(--map-ground)" />
        <rect x="218" y="88" width="96" height="50" rx="10" fill="var(--map-park)" />
        <path d="M0 132 C60 118 120 146 180 132 S290 122 342 136 V150 H0Z" fill="var(--map-water)" />
        <g stroke="#FFFFFF" strokeLinecap="round" fill="none">
          <path d="M-5 52 H350" strokeWidth="10" />
          <path d="M112 -5 V155" strokeWidth="10" />
          <path d="M-5 108 L350 72" strokeWidth="6" />
          <path d="M262 -5 V155" strokeWidth="6" />
        </g>
      </>
    );
  }
  if (muted) {
    return (
      <>
        <rect width="342" height="140" fill="#F0F1F3" />
        <rect x="200" y="14" width="100" height="44" rx="10" fill="#E3E6E9" />
        <g stroke="#FFFFFF" strokeLinecap="round" fill="none">
          <path d="M-5 76 H350" strokeWidth="10" />
          <path d="M70 -5 L110 145" strokeWidth="8" />
          <path d="M240 -5 V145" strokeWidth="6" />
        </g>
      </>
    );
  }
  return layout % 2 === 0 ? (
    <>
      <rect width="342" height="140" fill="var(--map-ground)" />
      <rect x="222" y="80" width="92" height="48" rx="10" fill="var(--map-park)" />
      <path d="M0 124 C60 110 120 138 180 124 S290 114 342 128 V140 H0Z" fill="var(--map-water)" />
      <g stroke="#FFFFFF" strokeLinecap="round" fill="none">
        <path d="M-5 48 H350" strokeWidth="10" />
        <path d="M108 -5 V145" strokeWidth="10" />
        <path d="M-5 100 L350 66" strokeWidth="6" />
        <path d="M268 -5 V145" strokeWidth="6" />
      </g>
    </>
  ) : (
    <>
      <rect width="342" height="140" fill="var(--map-ground)" />
      <rect x="20" y="78" width="80" height="50" rx="10" fill="var(--map-park)" />
      <g stroke="#FFFFFF" strokeLinecap="round" fill="none">
        <path d="M-5 40 L350 58" strokeWidth="10" />
        <path d="M150 -5 V145" strokeWidth="10" />
        <path d="M-5 112 H350" strokeWidth="6" />
        <path d="M280 -5 L250 145" strokeWidth="6" />
      </g>
    </>
  );
}

const PET_COLOR: Record<TrackingStatus, string> = {
  tracking: 'var(--blue)',
  outside: 'var(--orange-bright)',
  no_signal: '#9AA2AE',
};

export function MapView({ variant, layout = 0, center, radiusM, pet, home = false, handle, ringPx, height, children }: Props) {
  const { w, h } = SIZES[variant];
  const ring = ringPx ?? SIZES[variant].ring;
  const cx = w / 2;
  const cy = h / 2;
  const muted = pet?.status === 'no_signal';
  const scale = ring / Math.max(radiusM, 1);
  const big = variant === 'large';

  let px = cx;
  let py = cy;
  if (pet?.position && center) {
    const o = offsetM(center, pet.position);
    const m = big ? 40 : 22;
    // No mapa grande, a coluna da direita fica livre para os botões flutuantes.
    px = Math.min(w - (big ? 84 : m), Math.max(m, cx + o.x * scale));
    py = Math.min(h - m, Math.max(m, cy - o.y * scale));
  }

  const ringStroke = muted ? '#9AA2AE' : 'var(--blue)';
  const pr = big ? 15 : 9;
  const color = pet ? PET_COLOR[pet.status] : 'var(--blue)';

  // Ponto da borda do círculo na direção do animal (rastro tracejado quando fora).
  const ang = Math.atan2(py - cy, px - cx);
  const edgeX = cx + Math.cos(ang) * ring;
  const edgeY = cy + Math.sin(ang) * ring;

  return (
    <div className="map-frame" style={{ height }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <Background variant={variant} layout={layout} muted={muted} />
        <circle
          cx={cx}
          cy={cy}
          r={ring}
          fill={muted ? 'none' : 'var(--blue)'}
          fillOpacity={handle ? 0.1 : 0.08}
          stroke={ringStroke}
          strokeOpacity={muted || handle ? 1 : 0.55}
          strokeWidth={handle ? 2.5 : big ? 2 : 1.5}
          strokeDasharray={handle ? '8 6' : big ? '7 5' : '5 4'}
        />
        {handle && <circle cx={cx + ring} cy={cy} r="11" fill="#FFFFFF" stroke="var(--blue)" strokeWidth="3" />}
        {home === 'small' && (
          <>
            <circle cx={cx} cy={cy} r={variant === 'form' ? 13 : 11} fill="#FFFFFF" stroke="var(--blue)" strokeWidth={variant === 'form' ? 3 : 2} />
            <path d={`M${cx - 5} ${cy + 3}v-4l5-4 5 4v4z`} fill="var(--blue)" />
          </>
        )}
        {home === 'large' && (
          <>
            <circle cx={cx} cy={cy} r="18" fill="var(--blue)" />
            <path d={`M${cx - 8} ${cy + 5}v-6l8-6 8 6v6z`} fill="#FFFFFF" />
          </>
        )}
        {pet && pet.status === 'outside' && (
          <path
            d={`M${edgeX} ${edgeY} Q${(edgeX + px) / 2} ${(edgeY + py) / 2 + 12} ${px - Math.cos(ang) * (pr + 1)} ${py - Math.sin(ang) * (pr + 1)}`}
            stroke="var(--amber)"
            strokeWidth="2"
            strokeDasharray="3 4"
            fill="none"
          />
        )}
        {pet &&
          (muted ? (
            <>
              <circle cx={px} cy={py} r={big ? 20 : 13} fill="#FFFFFF" stroke="#9AA2AE" strokeWidth="2" strokeDasharray="3 3" />
              <circle cx={px} cy={py} r={big ? 14 : 8} fill="#9AA2AE" />
            </>
          ) : (
            <>
              <circle cx={px} cy={py} r={big ? 34 : 22} fill={color} fillOpacity={pet.status === 'outside' ? 0.2 : 0.16} />
              <circle cx={px} cy={py} r={big ? 20 : 13} fill="#FFFFFF" />
              <circle cx={px} cy={py} r={pr} fill={color} />
            </>
          ))}
        {pet && (
          <text
            x={px}
            y={py + (big ? 6 : 4)}
            textAnchor="middle"
            fontFamily="Plus Jakarta Sans, sans-serif"
            fontSize={big ? 15 : 10}
            fontWeight="800"
            fill="#FFFFFF"
          >
            {pet.initial}
          </text>
        )}
      </svg>
      {children}
    </div>
  );
}
