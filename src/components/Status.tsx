import type { Pet, TrackingStatus } from '@/api/types';
import { initial } from '@/utils/format';

export const statusLabel: Record<TrackingStatus, string> = {
  tracking: 'Rastreando',
  outside: 'Fora da área segura',
  no_signal: 'Sem sinal',
};

export const statusDot: Record<TrackingStatus, string> = {
  tracking: 'var(--green)',
  outside: 'var(--amber)',
  no_signal: 'var(--red)',
};

export function StatusPill({ status, large }: { status: TrackingStatus; large?: boolean }) {
  return (
    <span className={`pill pill--${status} ${large ? 'pill--lg' : ''}`} role="status">
      <span className="dot" />
      {statusLabel[status]}
    </span>
  );
}

interface AvatarProps {
  pet: Pick<Pet, 'name' | 'photoUrl'>;
  size?: number;
  status?: TrackingStatus;
  fontSize?: number;
  style?: React.CSSProperties;
}

export function PetAvatar({ pet, size = 46, status = 'tracking', fontSize, style }: AvatarProps) {
  return (
    <div
      className={`avatar avatar--${status}`}
      style={{ width: size, height: size, fontSize: fontSize ?? Math.round(size * 0.39), ...style }}
      aria-hidden="true"
    >
      {pet.photoUrl ? <img src={pet.photoUrl} alt="" /> : initial(pet.name)}
    </div>
  );
}
