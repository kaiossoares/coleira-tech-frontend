import { useState } from 'react';
import { ApiError } from '@/api';

/** Estado de envio de formulário: pending, mensagem de erro e erros por campo. */
export function useSubmit() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    setPending(true);
    setError(null);
    setFieldErrors({});
    try {
      return await fn();
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        if (e.fields) setFieldErrors(e.fields);
      } else {
        setError('Algo deu errado. Tente novamente.');
      }
      return undefined;
    } finally {
      setPending(false);
    }
  }

  return { pending, error, setError, fieldErrors, setFieldErrors, run };
}
