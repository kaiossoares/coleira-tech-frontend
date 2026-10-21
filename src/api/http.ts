import { ApiError, type ApiClient } from './client';
import { tokenStore } from './token';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { method, headers, body: payload });
  } catch {
    throw new ApiError('Sem conexão com o servidor.', 0, 'network');
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) tokenStore.set(null);
    throw new ApiError(
      data?.message ?? 'Algo deu errado. Tente novamente.',
      res.status,
      data?.code,
      data?.fields,
    );
  }
  return data as T;
}

export const httpApi: ApiClient = {
  login: (input) => request('POST', '/auth/login', input),
  register: (input) => request('POST', '/auth/register', input),
  me: () => request('GET', '/auth/me'),
  logout: () => request('POST', '/auth/logout'),
  requestPasswordReset: (email) => request('POST', '/auth/password-reset', { email }),

  listPets: () => request('GET', '/pets'),
  getPet: (petId) => request('GET', `/pets/${petId}`),
  createPet: (input) => request('POST', '/pets', input),
  updatePet: (petId, input) => request('PATCH', `/pets/${petId}`, input),
  deletePet: (petId) => request('DELETE', `/pets/${petId}`),
  uploadPetPhoto: (petId, file) => {
    const form = new FormData();
    form.append('photo', file);
    return request('PUT', `/pets/${petId}/photo`, form);
  },

  updateSafeArea: (petId, input) => request('PUT', `/pets/${petId}/safe-area`, input),

  claimCollar: (input) => request('POST', '/collars', input),
  updateCollar: (collarId, input) => request('PATCH', `/collars/${collarId}`, input),
  releaseCollar: (collarId) => request('DELETE', `/collars/${collarId}`),
  attachCollar: (petId, collarId) => request('PUT', `/pets/${petId}/collar`, { collarId }),
};
