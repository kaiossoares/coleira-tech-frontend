import { useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '@/api';
import type { PetOverview } from '@/api/types';
import { BatteryIcon, CollarIcon, Icon } from '@/components/Icon';
import { MapView, type MapViewHandle } from '@/components/MapView';
import { PetAvatar, StatusPill } from '@/components/Status';
import { ErrorState, Loading, useToast } from '@/components/States';
import { ToggleRow } from '@/components/Toggle';
import { BackButton } from '@/components/TopBar';
import { useResource } from '@/hooks/useResource';
import { ageLabel, formatMeters, initial, intervalLong, sexLabel, signalLabel, sizeLabel, speciesLabel, timeAgo } from '@/utils/format';

export default function PetDetail() {
  const { petId = '' } = useParams();
  const res = useResource(() => api.getPet(petId), [petId], 30_000);
  const toast = useToast();
  const mapRef = useRef<MapViewHandle>(null);

  if (res.loading && !res.data) {
    return (
      <div className="screen screen--page">
        <BackButton to="/" variant="white" label="Voltar para o início" />
        <Loading />
      </div>
    );
  }
  if (!res.data) {
    return (
      <div className="screen screen--page">
        <BackButton to="/" variant="white" label="Voltar para o início" />
        <ErrorState message={res.error?.message ?? 'Animal não encontrado.'} onRetry={res.reload} />
      </div>
    );
  }

  const { pet, collar, safeArea, lastLocation, status, distanceFromCenterM } = res.data;

  async function toggleAlert(on: boolean) {
    if (!res.data) return;
    const prev: PetOverview = res.data;
    if (prev.safeArea) res.setData({ ...prev, safeArea: { ...prev.safeArea, alertOnExit: on } });
    try {
      await api.updateSafeArea(petId, { alertOnExit: on });
    } catch {
      res.setData(prev);
      toast.show('Não foi possível salvar. Tente de novo.');
    }
  }

  const routeUrl = lastLocation ? `https://www.google.com/maps/dir/?api=1&destination=${lastLocation.lat},${lastLocation.lng}` : null;
  const subtitle = [pet.breed || speciesLabel[pet.species], sexLabel[pet.sex], ageLabel(pet.birthDate)].filter(Boolean).join(' · ');

  const where =
    status === 'tracking'
      ? { title: 'Dentro da área segura', bg: 'var(--green-soft)', ink: 'var(--green-ink)', icon: 'home' as const }
      : status === 'outside'
        ? { title: 'Fora da área segura', bg: 'var(--amber-soft)', ink: 'var(--amber-ink)', icon: 'pin' as const }
        : { title: 'Sem sinal da coleira', bg: 'var(--red-soft)', ink: 'var(--red-ink)', icon: 'wifiOff' as const };

  const distanceText =
    distanceFromCenterM === null || !safeArea
      ? null
      : status === 'outside'
        ? `${formatMeters(Math.max(0, distanceFromCenterM - safeArea.radiusM))} fora da área`
        : `a ${formatMeters(distanceFromCenterM)} de ${safeArea.label.toLowerCase()}`;
  const whereSub = [lastLocation?.address, distanceText ?? (status === 'no_signal' ? `Última posição ${timeAgo(lastLocation?.recordedAt).toLowerCase()}` : null)]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="screen screen--flush screen--page" style={{ overflow: 'hidden' }}>
      <MapView
        ref={mapRef}
        variant="large"
        height={420}
        center={safeArea?.center ?? null}
        radiusM={safeArea?.radiusM ?? 100}
        home="small"
        pet={{ position: lastLocation, initial: initial(pet.name), status }}
      >
        <div className="row" style={{ position: 'absolute', left: 20, right: 20, top: 20, justifyContent: 'space-between' }}>
          <BackButton to="/" variant="float" label="Voltar para o início" />
          <span style={{ boxShadow: '0 4px 14px rgba(18,32,58,0.1)', borderRadius: 999 }}>
            <StatusPill status={status} large />
          </span>
        </div>
        <div className="stack stack-8" style={{ position: 'absolute', right: 20, bottom: 44 }}>
          <button type="button" className="icon-btn icon-btn--float" aria-label="Centralizar no animal" style={{ color: 'var(--blue)' }} onClick={() => {
              mapRef.current?.recenter();
              void res.reload();
            }}>
            <Icon name="target" />
          </button>
          <button type="button" className="icon-btn icon-btn--float" aria-label="Ver histórico de trajeto" onClick={() => toast.show('Histórico de trajeto em breve.')}>
            <Icon name="history" />
          </button>
        </div>
      </MapView>

      <div className="sheet">
        <div className="sheet__handle" />

        <div className="row" style={{ gap: 14 }}>
          <PetAvatar pet={pet} size={60} fontSize={24} style={{ border: '3px solid #fff', boxShadow: '0 2px 8px rgba(18,32,58,0.08)' }} />
          <div className="stack stack-2" style={{ flex: 1, minWidth: 0 }}>
            <h1 className="title-lg">{pet.name}</h1>
            <span className="lead">{subtitle}</span>
          </div>
        </div>

        <div className="row" style={{ padding: '14px 16px', borderRadius: 16, background: '#fff', gap: 12 }}>
          <span className="tile-icon" style={{ background: where.bg, color: where.ink }}>
            <Icon name={where.icon} />
          </span>
          <div className="stack stack-2" style={{ flex: 1, minWidth: 0 }}>
            <span className="strong-15">{where.title}</span>
            {whereSub && <span className="text-13 muted">{whereSub}</span>}
          </div>
          {routeUrl && (
            <a
              href={routeUrl}
              target="_blank"
              rel="noreferrer"
              className="row"
              style={{ height: 40, padding: '0 12px', borderRadius: 12, border: '1.5px solid var(--blue-line)', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--blue)', textDecoration: 'none', flexShrink: 0 }}
            >
              <Icon name="navigate" size={16} />
              Rota
            </a>
          )}
        </div>

        <div className="grid-3">
          <div className="stat" style={{ gap: 6 }}>
            <span style={{ color: 'var(--muted)' }}>
              <BatteryIcon pct={collar?.batteryPct ?? null} size={22} />
            </span>
            <span className="stat__value">{collar?.batteryPct != null ? `${collar.batteryPct}%` : '—'}</span>
            <span className="stat__label">Bateria</span>
          </div>
          <div className="stat" style={{ gap: 6 }}>
            <Icon name={collar?.signal === 'none' ? 'wifiOff' : 'wifi'} size={22} color="var(--muted)" />
            <span className="stat__value">{collar ? signalLabel[collar.signal] : '—'}</span>
            <span className="stat__label">Sinal GPS</span>
          </div>
          <div className="stat" style={{ gap: 6 }}>
            <Icon name="clock" size={22} color="var(--muted)" />
            <span className="stat__value">{timeAgo(lastLocation?.recordedAt)}</span>
            <span className="stat__label">Atualizado</span>
          </div>
        </div>

        <section className="card">
          <div className="card__head">
            <h2 className="section-title">Área segura</h2>
            <Link to={`/animais/${pet.id}/area`} className="link-btn">
              <Icon name="edit" size={16} />
              Editar
            </Link>
          </div>
          {safeArea ? (
            <>
              <div className="row" style={{ gap: 12 }}>
                <span className="tile-icon" style={{ background: 'var(--blue-soft)', color: 'var(--blue)' }}>
                  <Icon name="safeArea" />
                </span>
                <div className="stack stack-2" style={{ flex: 1, minWidth: 0 }}>
                  <span className="strong-15">
                    {safeArea.label} · raio de {safeArea.radiusM} m
                  </span>
                  <span className="text-13 muted">{safeArea.address ?? `${safeArea.center.lat.toFixed(5)}, ${safeArea.center.lng.toFixed(5)}`}</span>
                </div>
              </div>
              <div className="card__divider" style={{ paddingTop: 0 }}>
                <ToggleRow title="Avisar quando sair da área" subtitle="Notificação no celular na hora" checked={safeArea.alertOnExit} onChange={toggleAlert} />
              </div>
            </>
          ) : (
            <span className="text-13 muted">Nenhuma área definida.</span>
          )}
        </section>

        <section className="card" style={{ gap: 4 }}>
          <div className="card__head" style={{ paddingBottom: 6 }}>
            <h2 className="section-title">Informações do animal</h2>
            <Link to={`/animais/${pet.id}/editar`} className="link-btn">
              <Icon name="edit" size={16} />
              Editar
            </Link>
          </div>
          <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px 12px' }}>
            <Info label="Espécie" value={speciesLabel[pet.species]} />
            <Info label="Raça" value={pet.breed || '—'} />
            <Info
              label="Cor"
              value={
                <>
                  {pet.colorHex && <span style={{ width: 12, height: 12, borderRadius: '50%', background: pet.colorHex, boxShadow: '0 0 0 1px var(--line)' }} />}
                  {pet.color || '—'}
                </>
              }
            />
            <Info label="Sexo" value={sexLabel[pet.sex]} />
            <Info label="Porte" value={sizeLabel[pet.size]} />
            <Info label="Peso" value={pet.weightKg != null ? `${String(pet.weightKg).replace('.', ',')} kg` : '—'} />
          </dl>
          {pet.notes && (
            <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 12, background: 'var(--orange-note)', fontSize: 13, lineHeight: 1.5, color: 'var(--orange-note-ink)' }}>
              <strong style={{ fontWeight: 700 }}>Observações:</strong> {pet.notes}
            </div>
          )}
        </section>

        <section className="card" style={{ gap: 12 }}>
          <div className="card__head">
            <h2 className="section-title">Coleira</h2>
            <Link to={collar ? `/animais/${pet.id}/coleira` : `/animais/${pet.id}/trocar-coleira`} className="link-btn">
              <Icon name="edit" size={16} />
              {collar ? 'Editar' : 'Vincular'}
            </Link>
          </div>
          {collar ? (
            <>
              <div className="row" style={{ gap: 12 }}>
                <span className="tile-icon" style={{ background: 'var(--orange-soft)' }}>
                  <CollarIcon />
                </span>
                <div className="stack stack-2" style={{ flex: 1 }}>
                  <span className="strong-15">{collar.nickname || 'Coleira'}</span>
                  <span className="text-13 muted" style={{ letterSpacing: '0.04em' }}>
                    {collar.code}
                  </span>
                </div>
              </div>
              <div className="row" style={{ justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--divider)', fontSize: 13 }}>
                <span className="muted">Atualiza a localização a cada</span>
                <span style={{ fontWeight: 700 }}>{intervalLong(collar.updateIntervalSec)}</span>
              </div>
            </>
          ) : (
            <span className="text-13 muted">Nenhuma coleira vinculada a este animal.</span>
          )}
        </section>
      </div>
      {toast.node}
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="stack stack-2">
      <dt className="text-12 muted">{label}</dt>
      <dd className="row" style={{ fontSize: 15, fontWeight: 600, gap: 6 }}>
        {value}
      </dd>
    </div>
  );
}
