import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/api';
import type { PetOverview, TrackingStatus } from '@/api/types';
import { useAuth } from '@/auth/AuthContext';
import { BatteryIcon, Icon } from '@/components/Icon';
import { MapView } from '@/components/MapView';
import { PetAvatar, StatusPill, statusDot } from '@/components/Status';
import { ErrorState, Loading } from '@/components/States';
import { useResource } from '@/hooks/useResource';
import { firstName, formatMeters, initial, speciesLabel, timeAgo } from '@/utils/format';

const POLL_MS = 30_000;

export default function Home() {
  const pets = useResource(() => api.listPets(), [], POLL_MS);

  if (pets.loading && !pets.data) {
    return (
      <div className="screen screen--page">
        <Header hasPets={false} />
        <Loading />
      </div>
    );
  }
  if (pets.error && !pets.data) {
    return (
      <div className="screen screen--page">
        <Header hasPets={false} />
        <ErrorState message={pets.error.message} onRetry={pets.reload} />
      </div>
    );
  }

  const list = pets.data ?? [];
  if (list.length === 0) return <EmptyHome />;

  const count = (s: TrackingStatus) => list.filter((p) => p.status === s).length;

  return (
    <div className="screen screen--page">
      <Header hasPets />

      <div className="grid-3">
        {(
          [
            ['tracking', 'Rastreando'],
            ['outside', 'Fora da área'],
            ['no_signal', 'Sem sinal'],
          ] as const
        ).map(([s, label]) => (
          <div key={s} className="stat">
            <span className="row" style={{ gap: 6, fontSize: 20, fontWeight: 800 }}>
              <span className="dot" style={{ background: statusDot[s] }} />
              {count(s)}
            </span>
            <span className="stat__label">{label}</span>
          </div>
        ))}
      </div>

      {list.map((p) => (
        <PetCard key={p.pet.id} data={p} />
      ))}

      <Link to="/coleiras/nova" className="btn btn--dashed">
        <Icon name="plus" strokeWidth={2.4} />
        Adicionar outra coleira
      </Link>
    </div>
  );
}

function Header({ hasPets }: { hasPets: boolean }) {
  const { user } = useAuth();
  return (
    <div className="row" style={{ justifyContent: 'space-between' }}>
      <div className="stack stack-2">
        <span className="lead">Olá, {user ? firstName(user.name) : ''}</span>
        <span className="title-md">Suas coleiras</span>
      </div>
      <div className="row" style={{ gap: 8 }}>
        {hasPets && (
          <Link to="/coleiras/nova" aria-label="Cadastrar nova coleira" className="icon-btn icon-btn--accent">
            <Icon name="plus" size={22} strokeWidth={2.4} />
          </Link>
        )}
        <ProfileMenu />
      </div>
    </div>
  );
}

function ProfileMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" className="avatar-btn" aria-label="Perfil" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((v) => !v)}>
        {user ? initial(user.name) : ''}
      </button>
      {open && user && (
        <div className="menu" role="menu">
          <div className="menu__info">
            <div style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</div>
            <div className="text-12 muted">{user.email}</div>
          </div>
          <button
            type="button"
            role="menuitem"
            className="menu__item"
            onClick={async () => {
              await logout();
              navigate('/login', { replace: true });
            }}
          >
            Sair da conta
          </button>
        </div>
      )}
    </div>
  );
}

function PetCard({ data }: { data: PetOverview }) {
  const { pet, collar, safeArea, lastLocation, status, distanceFromCenterM } = data;
  const href = `/animais/${pet.id}`;
  const outsideBy = safeArea && distanceFromCenterM !== null ? Math.max(0, distanceFromCenterM - safeArea.radiusM) : null;

  return (
    <article style={{ borderRadius: 22, background: '#fff', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
      <MapView
        variant="card"
        height={140}
        center={safeArea?.center ?? null}
        radiusM={safeArea?.radiusM ?? 100}
        pet={{ position: lastLocation, initial: initial(pet.name), status }}
      >
        <span style={{ position: 'absolute', left: 12, top: 12 }}>
          <StatusPill status={status} />
        </span>
        {status === 'no_signal' ? (
          <span style={{ position: 'absolute', left: 12, bottom: 12, padding: '6px 10px', borderRadius: 10, background: '#fff', fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>
            Última posição conhecida
          </span>
        ) : (
          <Link
            to={href}
            aria-label={`Abrir mapa de ${pet.name} em tela cheia`}
            style={{ position: 'absolute', right: 10, top: 10, width: 36, height: 36, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)' }}
          >
            <Icon name="expand" size={18} />
          </Link>
        )}
      </MapView>

      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Link to={href} className="row" style={{ gap: 12, color: 'var(--ink)', textDecoration: 'none' }}>
          <PetAvatar pet={pet} status={status} />
          <div className="stack stack-2" style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 17, fontWeight: 800 }}>{pet.name}</span>
            <span className="text-13 muted">
              {pet.breed || speciesLabel[pet.species]}
              {pet.color ? ` · ${pet.color}` : ''}
            </span>
          </div>
          <Icon name="chevronRight" color="var(--subtle)" />
        </Link>

        <div className="row" style={{ gap: 14, fontSize: 12, color: 'var(--muted)', paddingTop: 12, borderTop: '1px solid var(--divider)' }}>
          {status === 'tracking' && (
            <span className="row" style={{ gap: 5 }}>
              <Icon name="pin" size={16} />
              {safeArea ? `Em ${safeArea.label.toLowerCase()}` : 'Localizado'}
            </span>
          )}
          {status === 'outside' && (
            <span className="row" style={{ gap: 5, color: 'var(--amber-ink)', fontWeight: 600 }}>
              <Icon name="pin" size={16} />
              {outsideBy !== null ? `${formatMeters(outsideBy)} da área` : 'Fora da área'}
            </span>
          )}
          {status === 'no_signal' && (
            <span className="row" style={{ gap: 5, color: 'var(--red-ink)', fontWeight: 600 }}>
              <Icon name="wifiOff" size={16} />
              Sinal perdido
            </span>
          )}
          <span className="row" style={{ gap: 5 }}>
            <Icon name="clock" size={16} />
            {timeAgo(lastLocation?.recordedAt)}
          </span>
          <span className="row" style={{ gap: 5, marginLeft: 'auto' }}>
            <BatteryIcon pct={collar?.batteryPct ?? null} />
            {collar?.batteryPct != null ? `${collar.batteryPct}%` : '—'}
          </span>
        </div>
      </div>
    </article>
  );
}

function EmptyHome() {
  return (
    <div className="screen" style={{ gap: 24 }}>
      <Header hasPets={false} />

      <div className="stack" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22, textAlign: 'center' }}>
        <div style={{ width: 200, height: 200, borderRadius: '50%', background: 'var(--blue-wash)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', width: 150, height: 150, borderRadius: '50%', border: '2px dashed var(--blue-dash)' }} />
          <div style={{ width: 96, height: 96, borderRadius: 30, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <svg width="56" height="56" viewBox="0 0 48 48" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <ellipse cx="24" cy="24" rx="17" ry="7" stroke="var(--blue)" strokeWidth="3" />
              <rect x="18" y="26" width="12" height="11" rx="3" fill="var(--orange-bright)" stroke="var(--orange-bright)" strokeWidth="2" />
              <circle cx="24" cy="31.5" r="1.8" fill="#FFFFFF" />
            </svg>
          </div>
          <div style={{ position: 'absolute', right: 26, top: 30, width: 36, height: 36, borderRadius: '50%', background: 'var(--orange-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Icon name="plus" size={18} strokeWidth={2.6} />
          </div>
        </div>

        <div className="stack stack-8" style={{ maxWidth: 300 }}>
          <h1 className="title-md">Nenhuma coleira por aqui ainda</h1>
          <p style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--muted)' }}>
            Cadastre sua primeira coleira e o seu pet para começar a acompanhar a localização em tempo real.
          </p>
        </div>

        <ol className="row" style={{ gap: 8, fontSize: 12, fontWeight: 600, color: 'var(--muted)', listStyle: 'none', padding: 0, margin: 0 }}>
          {['Coleira', 'Animal', 'Rastrear'].map((label, i) => (
            <li key={label} className="row" style={{ gap: 8 }}>
              {i > 0 && <span style={{ width: 18, height: 2, background: 'var(--line)' }} aria-hidden="true" />}
              <span className="row" style={{ gap: 6 }}>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: i === 0 ? 'var(--blue)' : 'var(--blue-soft)',
                    color: i === 0 ? '#fff' : 'var(--blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                  }}
                >
                  {i + 1}
                </span>
                {label}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <Link to="/coleiras/nova" className="btn btn--accent">
        <Icon name="plus" strokeWidth={2.4} />
        Cadastrar minha primeira coleira
      </Link>
    </div>
  );
}
