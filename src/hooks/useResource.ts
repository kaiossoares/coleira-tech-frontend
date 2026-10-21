import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/api';

interface Resource<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  reload(): Promise<void>;
  setData(next: T): void;
}

/**
 * Carrega um recurso da API e, opcionalmente, o atualiza a cada `pollMs`
 * (pausa quando a aba está em segundo plano).
 */
export function useResource<T>(load: () => Promise<T>, deps: unknown[], pollMs?: number): Resource<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const loadRef = useRef(load);
  loadRef.current = load;

  const reload = useCallback(async () => {
    try {
      const next = await loadRef.current();
      setData(next);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError('Erro inesperado.', 0));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!pollMs) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void reload();
    }, pollMs);
    return () => window.clearInterval(id);
  }, [pollMs, reload]);

  return { data, error, loading, reload, setData };
}
