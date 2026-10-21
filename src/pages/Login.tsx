import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api, apiMode } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import { Icon } from '@/components/Icon';
import { TextField } from '@/components/Field';
import { FormError, useToast } from '@/components/States';
import { useSubmit } from '@/hooks/useSubmit';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const { pending, error, setError, run } = useSubmit();
  const toast = useToast();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }
    const ok = await run(async () => {
      await login({ email: email.trim(), password });
      return true;
    });
    if (ok) navigate(from, { replace: true });
  }

  async function onForgot() {
    if (!email.trim()) {
      setError('Digite seu e-mail acima para recuperar a senha.');
      return;
    }
    const ok = await run(async () => {
      await api.requestPasswordReset(email.trim());
      return true;
    });
    if (ok) toast.show('Enviamos um link de recuperação para seu e-mail.');
  }

  return (
    <div className="screen screen--flush" style={{ overflow: 'hidden' }}>
      <div
        style={{
          height: 300,
          background: 'var(--blue)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <svg viewBox="0 0 390 300" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden="true">
          <g stroke="#FFFFFF" strokeOpacity="0.09" strokeWidth="10" fill="none" strokeLinecap="round">
            <path d="M-10 70 H400" />
            <path d="M-10 210 L400 150" />
            <path d="M90 -10 V310" />
            <path d="M300 -10 V310" />
          </g>
          <circle cx="300" cy="70" r="46" fill="#F28A2E" fillOpacity="0.18" />
          <circle cx="300" cy="70" r="9" fill="#F28A2E" />
        </svg>
        <div style={{ width: 76, height: 76, borderRadius: 24, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
            <circle cx="12" cy="10" r="2.6" stroke="var(--orange-bright)" fill="var(--orange-bright)" />
          </svg>
        </div>
        <div className="stack stack-4" style={{ alignItems: 'center', position: 'relative' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Coleira Tech</div>
          <div style={{ fontSize: 14, color: '#DCE6FF' }}>Saiba sempre onde seu pet está.</div>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        noValidate
        style={{
          flex: 1,
          marginTop: -28,
          background: '#fff',
          borderRadius: '28px 28px 0 0',
          padding: '32px var(--gutter) calc(28px + env(safe-area-inset-bottom))',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          position: 'relative',
        }}
      >
        <div className="stack stack-4">
          <h1 className="title-lg">Entrar</h1>
          <p className="lead">Acesse sua conta para acompanhar suas coleiras.</p>
        </div>

        <FormError message={error} />

        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="seuemail@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leading={<Icon name="mail" strokeWidth={1.8} color="var(--muted)" />}
        />

        <div className="stack stack-8">
          <TextField
            label="Senha"
            type={showPass ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leading={<Icon name="lock" strokeWidth={1.8} color="var(--muted)" />}
            trailing={
              <button type="button" className="icon-btn" aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPass} onClick={() => setShowPass((v) => !v)}>
                <Icon name={showPass ? 'eyeOff' : 'eye'} strokeWidth={1.8} color="var(--muted)" />
              </button>
            }
          />
          <button type="button" className="link-btn" style={{ alignSelf: 'flex-end', fontSize: 13, padding: '6px 0' }} onClick={onForgot}>
            Esqueci minha senha
          </button>
        </div>

        <button type="submit" className="btn btn--primary" disabled={pending}>
          {pending ? 'Entrando…' : 'Entrar'}
        </button>

        {apiMode === 'mock' && (
          <p className="field__hint" style={{ textAlign: 'center' }}>
            Modo demonstração: demo@coleira.tech / 12345678
          </p>
        )}

        <div className="spacer" />

        <div className="row" style={{ justifyContent: 'center', gap: 6, fontSize: 14, color: 'var(--muted)' }}>
          <span>Ainda não tem conta?</span>
          <Link to="/cadastro" className="link-accent">
            Criar conta
          </Link>
        </div>
      </form>
      {toast.node}
    </div>
  );
}
