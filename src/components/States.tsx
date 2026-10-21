import { useEffect, useState } from 'react';

export function Loading({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="center-state" role="status">
      <div className="spinner" />
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="center-state">
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="link-btn" onClick={onRetry}>
          Tentar de novo
        </button>
      )}
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="alert alert--error" role="alert">
      {message}
    </div>
  );
}

/** Mensagem curta que some sozinha. */
export function useToast(ms = 2200) {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), ms);
    return () => clearTimeout(t);
  }, [msg, ms]);
  const node = msg ? (
    <div className="toast" role="status">
      {msg}
    </div>
  ) : null;
  return { show: setMsg, node };
}
