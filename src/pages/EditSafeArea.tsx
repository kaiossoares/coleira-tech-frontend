import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/api';
import type { LatLng } from '@/api/types';
import { Icon } from '@/components/Icon';
import { MapView } from '@/components/MapView';
import { RadiusChips } from '@/components/Segmented';
import { ErrorState, FormError, Loading, useToast } from '@/components/States';
import { BackButton, TopBar } from '@/components/TopBar';
import { useResource } from '@/hooks/useResource';
import { useSubmit } from '@/hooks/useSubmit';
import { currentPosition } from '@/utils/geo';

const MIN = 50;
const MAX = 500;

export default function EditSafeArea() {
  const { petId = '' } = useParams();
  const navigate = useNavigate();
  const res = useResource(() => api.getPet(petId), [petId]);
  const back = `/animais/${petId}`;
  const [radiusM, setRadiusM] = useState(100);
  const [center, setCenter] = useState<LatLng | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [locating, setLocating] = useState(false);
  const { pending, error, run } = useSubmit();
  const toast = useToast();

  useEffect(() => {
    const a = res.data?.safeArea;
    if (!a) return;
    setRadiusM(a.radiusM);
    setCenter(a.center);
    setAddress(a.address);
  }, [res.data?.safeArea]);

  if (res.loading && !res.data) return <div className="screen"><TopBar back={back} /><Loading /></div>;
  if (!res.data) return <div className="screen"><TopBar back={back} /><ErrorState message={res.error?.message ?? 'Erro'} onRetry={res.reload} /></div>;

  const { pet, safeArea } = res.data;

  function moveCenter(c: LatLng) {
    setCenter(c);
    setAddress(null);
  }

  async function useMyLocation() {
    setLocating(true);
    const pos = await currentPosition();
    setLocating(false);
    if (!pos) {
      toast.show('Permita o acesso à localização do celular.');
      return;
    }
    setCenter(pos);
    setAddress(null);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    const ok = await run(() =>
      api.updateSafeArea(petId, {
        radiusM,
        ...(center ? { center } : {}),
        // Endereço digitado vai para o backend geocodificar; vazio mantém o atual.
        address: query.trim() || address,
      }),
    );
    if (ok) navigate(back);
  }

  return (
    <form className="screen screen--flush" onSubmit={save} noValidate style={{ overflow: 'hidden' }}>
      <MapView
        variant="large"
        height={400}
        center={center}
        radiusM={radiusM}
        home="large"
        handle
        onCenterChange={moveCenter}
        onRadiusChange={setRadiusM}
        radiusLimits={[MIN, MAX]}
      >
        <div className="row" style={{ position: 'absolute', left: 20, right: 20, top: 20, gap: 12 }}>
          <BackButton to={back} variant="float" />
          <div className="row" style={{ flex: 1, height: 44, padding: '0 14px', borderRadius: 14, background: '#fff', gap: 8, boxShadow: 'var(--shadow-float)' }}>
            <Icon name="search" size={18} color="var(--muted)" />
            <label htmlFor="busca" className="sr-only">
              Buscar endereço
            </label>
            <input
              id="busca"
              type="search"
              placeholder="Buscar endereço"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: 1, minWidth: 0, border: 0, background: 'transparent', fontSize: 14, outline: 'none' }}
            />
          </div>
        </div>
        <span style={{ position: 'absolute', left: '50%', bottom: 48, transform: 'translateX(-50%)', padding: '8px 12px', borderRadius: 999, background: 'var(--ink)', color: '#fff', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
          Toque no mapa ou arraste a casa
        </span>
      </MapView>

      <div className="sheet sheet--white">
        <div className="sheet__handle" />

        <div className="stack stack-4">
          <h1 className="title-md">
            Área segura {pet.sex === 'female' ? 'da' : 'do'} {pet.name}
          </h1>
          <p className="lead">Se {pet.sex === 'female' ? 'ela' : 'ele'} sair do círculo, o status fica amarelo e você recebe um aviso.</p>
        </div>

        <FormError message={error} />

        <div className="row" style={{ gap: 12, padding: '12px 14px', borderRadius: 14, background: 'var(--field)' }}>
          <Icon name="homeSimple" color="var(--blue)" />
          <div className="stack stack-2" style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{safeArea?.label ?? 'Casa'}</span>
            <span className="text-12 muted">
              {address ?? (center ? `${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}` : 'Defina o centro da área')}
            </span>
          </div>
          <button
            type="button"
            onClick={useMyLocation}
            className="row"
            style={{ height: 40, padding: '0 10px', border: 0, borderRadius: 10, background: 'var(--blue-soft)', fontSize: 12, fontWeight: 700, color: 'var(--blue)', cursor: 'pointer', gap: 6, flexShrink: 0 }}
          >
            <Icon name="target" size={14} strokeWidth={2.2} />
            {locating ? 'Localizando…' : 'Minha localização'}
          </button>
        </div>

        <div className="stack stack-10">
          <div className="row" style={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
            <label htmlFor="raio" style={{ fontSize: 14, fontWeight: 700 }}>
              Raio da área
            </label>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--blue)' }}>{radiusM} m</span>
          </div>
          <input id="raio" type="range" min={MIN} max={MAX} step={10} value={radiusM} onChange={(e) => setRadiusM(Number(e.target.value))} />
          <RadiusChips value={radiusM} onChange={setRadiusM} />
        </div>

        <div className="spacer" />

        <button type="submit" className="btn btn--primary" disabled={pending}>
          {pending ? 'Salvando…' : 'Salvar área segura'}
        </button>
      </div>
      {toast.node}
    </form>
  );
}
