import type { ApiClient } from './client';
import { httpApi } from './http';
import { mockApi } from './mock';

export const apiMode = (import.meta.env.VITE_API_MODE as string | undefined) ?? 'mock';

export const api: ApiClient = apiMode === 'http' ? httpApi : mockApi;

export { ApiError } from './client';
export type * from './types';
