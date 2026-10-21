import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/api';
import type { LatLng, UpdateIntervalSec } from '@/api/types';
import { Icon } from '@/components/Icon';
import { TextField, Optional } from '@/components/Field';
import { MapView } from '@/components/MapView';
import { QrScanner, qrSupported } from '@/components/QrScanner';
import { RadiusChips, Segmented } from '@/components/Segmented';
import { FormError, useToast } from '@/components/States';
import { ToggleRow } from '@/components/Toggle';
import { StepHeader, TopBar } from '@/components/TopBar';
import { useSubmit } from '@/hooks/useSubmit';
import { collarCodeValid, intervalOptions, maskCollarCode } from '@/utils/format';
import { currentPosition } from '@/utils/geo';
import { onboardingDraft } from '@/utils/onboarding';

/**
 * Passo 1 do cadastro (rota /coleiras/nova) e também "Trocar por outra coleira"
 * (rota /animais/:petId/trocar-coleira), que pula a área segura e o passo 2.
 */
export default function NewCollar() {
  const { petId } = useParams();
  const replacing = Boolean(petId);
  const navigate = useNavigate();
  const draft = replacing ? null : onboardingDraft.get();

  const [code, setCode] = useState(draft?.collar.code ?? '');
  const [nickname, setNickname] = useState(draft?.collar.nickname ?? '');
  const [radiusM, setRadiusM] = useState(draft?.safeArea.radiusM ?? 100);
  const [updateInterval, setUpdateInterval] = useState<UpdateIntervalSec>(draft?.collar.updateIntervalSec ?? 30);
  const [notifySignalLoss, setNotifySignalLoss] = useState(draft?.collar.notifySignalLoss ?? true);
  const [notifyLowBattery, setNotifyLowBattery] = useState(draft?.collar.notifyLowBattery ?? true);
  const [center, setCenter] = useState<LatLng | null>(draft?.safeArea.center ?? null);
  const [locating, setLocating] = useState(false);
  const [scanning, setScanning] = useState(false);
  const { pending, error, run, fieldErrors, setFieldErrors } = useSubmit();
  const toast = useToast(3000);

  const locate = useCallback(async () => {
    setLocating(true);
    const pos = await currentPosition();
    setLocating(false);
    if (pos) setCenter(pos);
    return pos;
  }, []);

  useEffect(() => {
    if (!replacing && !center) void locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScan = useCallback((text: string) => {
    setScanning(false);
    const masked = maskCollarCode(text);
    if (collarCodeValid(masked)) setCode(masked);
    else toast.show('QR code não reconhecido. Digite o código.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!collarCodeValid(code)) {
      setFieldErrors({ code: 'Código inválido. Formato: CT-0000-0000.' });
      return;
    }
    const collar = await run(() =>
      api.claimCollar({ code, nickname: nickname.trim() || null, updateIntervalSec: updateInterval, notifySignalLoss, notifyLowBattery }),
    );
    if (!collar) return;

    if (replacing && petId) {
      const ok = await run(() => api.attachCollar(petId, collar.id));
      if (ok) navigate(`/animais/${petId}`, { replace: true });
      return;
    }
    onboardingDraft.set({ collar, safeArea: { label: 'Casa', radiusM, center: center ?? undefined, alertOnExit: true } });
    navigate('/animais/novo');
  }

  return (
    <form className="screen screen--gap-lg" onSubmit={onSubmit} noValidate>
      {replacing ? <TopBar back={`/animais/${petId}/coleira`} title="Trocar coleira" /> : <StepHeader back="/" step={1} total={2} />}

      <div className="stack stack-4">
        <h1 className="title-xl">{replacing ? 'Nova coleira' : 'Cadastrar coleira'}</h1>
        <p className="lead">Ligue a coleira e aproxime o celular para vincular.</p>
      </div>

      <FormError message={error} />

      <button
        type="button"
        onClick={() => (qrSupported() ? setScanning(true) : toast.show('Leitura de QR indisponível neste navegador. Digite o código.'))}
        style={{ height: 128, border: '2px dashed var(--blue-dash)', borderRadius: 18, background: 'var(--blue-wash-2)', display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px', textAlign: 'left', cursor: 'pointer' }}
      >
        <span style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
          <Icon name="qr" size={32} strokeWidth={1.8} />
        </span>
        <span className="stack stack-4">
          <span style={{ fontSize: 16, fontWeight: 700 }}>Escanear QR code</span>
          <span className="text-13 muted" style={{ lineHeight: 1.4 }}>
            O código fica na etiqueta interna da coleira.
          </span>
        </span>
      </button>

      <div className="row" style={{ gap: 12, fontSize: 13, color: 'var(--muted)' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--line-2)' }} />
        ou digite o código
        <div style={{ flex: 1, height: 1, background: 'var(--line-2)' }} />
      </div>

      <TextField
        label="Código da coleira"
        placeholder="CT-0000-0000"
        className="input--code"
        autoCapitalize="characters"
        autoComplete="off"
        value={code}
        onChange={(e) => setCode(maskCollarCode(e.target.value))}
        error={fieldErrors.code}
      />

      <TextField
        label={
          <>
            Apelido da coleira <Optional />
          </>
        }
        placeholder="Ex.: Coleira azul"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />

      {!replacing && (
        <div className="stack stack-10">
          <div className="stack stack-2">
            <span className="strong-15">Área segura</span>
            <span className="text-13 muted">Você recebe um alerta se o pet sair deste raio.</span>
          </div>
          <div style={{ borderRadius: 18, overflow: 'hidden', border: '1.5px solid var(--line-2)' }}>
            <MapView variant="form" height={150} center={center} radiusM={radiusM} home="small">
              <button
                type="button"
                onClick={locate}
                style={{ position: 'absolute', left: 10, bottom: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 10, border: 0, background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                <Icon name="homeSimple" size={14} color="var(--blue)" />
                {locating ? 'Localizando…' : center ? 'Sua localização atual' : 'Usar minha localização'}
              </button>
            </MapView>
          </div>
          <RadiusChips value={radiusM} onChange={setRadiusM} />
        </div>
      )}

      <Segmented<UpdateIntervalSec>
        label="Atualizar localização a cada"
        labelStyle="section"
        value={updateInterval}
        onChange={setUpdateInterval}
        options={intervalOptions.map((o) => ({ value: o.value, label: o.short }))}
        hint="Intervalos maiores economizam bateria. Dá para mudar depois."
      />

      <div className="stack stack-4">
        <span className="strong-15">Avisos</span>
        <div className="toggle-list">
          <ToggleRow title="Avisar quando perder o sinal" subtitle="Status vermelho no app" checked={notifySignalLoss} onChange={setNotifySignalLoss} />
          <ToggleRow title="Avisar com bateria baixa" subtitle="Abaixo de 15%" checked={notifyLowBattery} onChange={setNotifyLowBattery} />
        </div>
      </div>

      <div className="spacer" />

      <button type="submit" className="btn btn--primary" disabled={pending}>
        {pending ? 'Vinculando…' : replacing ? 'Vincular coleira' : 'Continuar'}
        {!pending && !replacing && <Icon name="arrowRight" strokeWidth={2.2} />}
      </button>

      {scanning && <QrScanner onResult={onScan} onClose={() => setScanning(false)} />}
      {toast.node}
    </form>
  );
}
