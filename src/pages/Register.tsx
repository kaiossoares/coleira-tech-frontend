import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { BackButton } from '@/components/TopBar';
import { LogoPin } from '@/components/Icon';
import { TextField } from '@/components/Field';
import { FormError } from '@/components/States';
import { useSubmit } from '@/hooks/useSubmit';
import { maskPhone } from '@/utils/format';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', terms: false });
  const { pending, error, run, fieldErrors, setFieldErrors } = useSubmit();
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Informe seu nome.';
    if (!EMAIL_RE.test(form.email.trim())) errs.email = 'E-mail inválido.';
    if (form.phone.replace(/\D/g, '').length < 10) errs.phone = 'Celular inválido.';
    if (form.password.length < 8) errs.password = 'A senha precisa ter ao menos 8 caracteres.';
    if (form.confirm !== form.password) errs.confirm = 'As senhas não conferem.';
    if (!form.terms) errs.terms = 'Aceite os termos para continuar.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const ok = await run(async () => {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone,
        password: form.password,
        acceptedTerms: form.terms,
      });
      return true;
    });
    if (ok) navigate('/', { replace: true });
  }

  return (
    <form className="screen" onSubmit={onSubmit} noValidate>
      <div className="topbar">
        <BackButton to="/login" />
        <div className="row" style={{ gap: 8, fontSize: 14, fontWeight: 700, color: 'var(--blue)' }}>
          <LogoPin />
          Coleira Tech
        </div>
        <div className="topbar__side" />
      </div>

      <div className="stack stack-4" style={{ marginTop: 4 }}>
        <h1 className="title-xl">Criar conta</h1>
        <p className="lead">Leva menos de um minuto. Depois é só cadastrar sua coleira.</p>
      </div>

      <FormError message={error} />

      <TextField label="Nome completo" autoComplete="name" placeholder="Como devemos te chamar?" value={form.name} onChange={(e) => set('name', e.target.value)} error={fieldErrors.name} />
      <TextField label="E-mail" type="email" autoComplete="email" placeholder="seuemail@exemplo.com" value={form.email} onChange={(e) => set('email', e.target.value)} error={fieldErrors.email} />
      <TextField
        label="Celular"
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        placeholder="(00) 00000-0000"
        value={form.phone}
        onChange={(e) => set('phone', maskPhone(e.target.value))}
        hint="Usado para alertas caso seu pet saia da área segura."
        error={fieldErrors.phone}
      />
      <TextField label="Senha" type="password" autoComplete="new-password" placeholder="Mínimo de 8 caracteres" value={form.password} onChange={(e) => set('password', e.target.value)} error={fieldErrors.password} />
      <TextField label="Confirmar senha" type="password" autoComplete="new-password" placeholder="Repita a senha" value={form.confirm} onChange={(e) => set('confirm', e.target.value)} error={fieldErrors.confirm} />

      <div className="stack stack-4">
        <div className="checkbox-row">
          <input id="termos" type="checkbox" checked={form.terms} onChange={(e) => set('terms', e.target.checked)} />
          <label htmlFor="termos">
            Li e aceito os <a href="/termos" target="_blank" rel="noreferrer">Termos de uso</a> e a{' '}
            <a href="/privacidade" target="_blank" rel="noreferrer">Política de privacidade</a>.
          </label>
        </div>
        {fieldErrors.terms && <span className="field__error">{fieldErrors.terms}</span>}
      </div>

      <div className="spacer" />

      <button type="submit" className="btn btn--primary" disabled={pending}>
        {pending ? 'Criando conta…' : 'Criar minha conta'}
      </button>

      <div className="row" style={{ justifyContent: 'center', gap: 6, fontSize: 14, color: 'var(--muted)' }}>
        <span>Já tem conta?</span>
        <Link to="/login" className="link-accent">
          Entrar
        </Link>
      </div>
    </form>
  );
}
