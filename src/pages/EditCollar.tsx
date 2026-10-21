import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { api } from '@/api';
import type { UpdateIntervalSec } from '@/api/types';
import { CollarIcon, Icon } from '@/components/Icon';
import { Segmented } from '@/components/Segmented';
import { TextField } from '@/components/Field';
import { ErrorState, FormError, Loading, useToast } from '@/components/States';
import { ToggleRow } from '@/components/Toggle';
import { TopBar } from '@/components/TopBar';
import { useResource } from '@/hooks/useResource';
import { useSubmit } from '@/hooks/useSubmit';
import { intervalOptions, signalLabel } from '@/utils/format';

export default function EditCollar() {
  const { petId = '' } = useParams();
  const navigate = useNavigate();
  const res = useResource(() => api.getPet(petId), [petId]);
  const back = `/animais/${petId}`;
  const [nickname, setNickname] = useState('');
  const [updateInterval, setUpdateInterval] = useState<UpdateIntervalSec>(30);
  const [notifySignalLoss, setNotifySignalLoss] = useState(true);
  const [notifyLowBattery, setNotifyLowBattery] = useState(true);
  const { pending, error, run } = useSubmit();
  const toast = useToast();

  const collar = res.data?.collar;
  useEffect(() => {
    if (!collar) return;
    setNickname(collar.nickname ?? '');
    setUpdateInterval(collar.updateIntervalSec);
    setNotifySignalLoss(collar.notifySignalLoss);
    setNotifyLowBattery(collar.notifyLowBattery);
  }, [collar]);

  if (res.loading && !res.data) return <div className="screen screen--page screen--tight"><TopBar back={back} backVariant="white" /><Loading /></div>;
  if (!res.data) return <div className="screen screen--page screen--tight"><TopBar back={back} backVariant="white" /><ErrorState message={res.error?.message ?? 'Erro'} onRetry={res.reload} /></div>;
  if (!collar) return <Navigate to={`/animais/${petId}/trocar-coleira`} replace />;

  async function save(e: FormEvent) {
    e.preventDefault();
    const ok = await run(() =>
      api.updateCollar(collar!.id, { nickname: nickname.trim() || null, updateIntervalSec: updateInterval, notifySignalLoss, notifyLowBattery }),
    );
    if (ok) navigate(back);
  }

  async function release() {
    if (!window.confirm('Desvincular esta coleira? O animal deixará de ser rastreado até você vincular outra.')) return;
    const ok = await run(async () => {
      await api.releaseCollar(collar!.id);
      return true;
    });
    if (ok) navigate(back, { replace: true });
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(collar!.code);
      toast.show('Código copiado');
    } catch {
      toast.show('Não foi possível copiar');
    }
  }

  return (
    <form className="screen screen--page screen--tight" onSubmit={save} noValidate>
      <TopBar back={back} backVariant="white" title={`Coleira ${res.data.pet.sex === 'female' ? 'da' : 'do'} ${res.data.pet.name}`} />

      <FormError message={error} />

      <section className="card row" style={{ padding: 18, flexDirection: 'row', gap: 14 }}>
        <span style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--orange-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CollarIcon size={32} />
        </span>
        <div className="stack stack-4" style={{ flex: 1, minWidth: 0 }}>
          <span className="text-12 muted">Código da coleira</span>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '0.05em' }}>{collar.code}</span>
        </div>
        <button type="button" className="icon-btn" style={{ borderRadius: 12 }} aria-label="Copiar código" onClick={copyCode}>
          <Icon name="copy" size={18} />
        </button>
      </section>

      <div className="grid-3">
        <div className="stat">
          <span className="stat__label">Bateria</span>
          <span className="stat__value" style={{ fontSize: 17 }}>{collar.batteryPct != null ? `${collar.batteryPct}%` : '—'}</span>
        </div>
        <div className="stat">
          <span className="stat__label">Sinal</span>
          <span className="stat__value" style={{ fontSize: 17 }}>{signalLabel[collar.signal]}</span>
        </div>
        <div className="stat">
          <span className="stat__label">Firmware</span>
          <span className="stat__value" style={{ fontSize: 17 }}>{collar.firmwareVersion ? `v${collar.firmwareVersion}` : '—'}</span>
        </div>
      </div>

      <section className="card" style={{ gap: 16 }}>
        <TextField label="Apelido da coleira" placeholder="Ex.: Coleira azul" value={nickname} onChange={(e) => setNickname(e.target.value)} />
        <Segmented<UpdateIntervalSec>
          label="Atualizar localização a cada"
          value={updateInterval}
          onChange={setUpdateInterval}
          options={intervalOptions.map((o) => ({ value: o.value, label: o.short }))}
          hint="Intervalos maiores economizam bateria."
        />
      </section>

      <section className="card" style={{ padding: '6px 16px', gap: 0 }}>
        <ToggleRow title="Avisar quando perder o sinal" subtitle="Status vermelho no app" checked={notifySignalLoss} onChange={setNotifySignalLoss} />
        <ToggleRow title="Avisar com bateria baixa" subtitle="Abaixo de 15%" checked={notifyLowBattery} onChange={setNotifyLowBattery} />
      </section>

      <Link
        to={`/animais/${petId}/trocar-coleira`}
        className="row"
        style={{ height: 56, padding: '0 16px', borderRadius: 16, background: '#fff', gap: 12, color: 'var(--ink)', textDecoration: 'none', fontSize: 15, fontWeight: 600 }}
      >
        <Icon name="swap" color="var(--blue)" />
        <span style={{ flex: 1 }}>Trocar por outra coleira</span>
        <Icon name="chevronRight" size={18} color="var(--subtle)" />
      </Link>

      <div className="spacer" />

      <button type="submit" className="btn btn--primary" disabled={pending}>
        {pending ? 'Salvando…' : 'Salvar alterações'}
      </button>
      <button type="button" className="btn btn--danger-text" onClick={release} disabled={pending}>
        Desvincular coleira
      </button>
      {toast.node}
    </form>
  );
}
