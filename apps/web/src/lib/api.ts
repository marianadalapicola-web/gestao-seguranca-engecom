import axios, { AxiosError } from 'axios';

// Same-origin deployments (the Vite dev proxy, or the API also serving the
// built frontend, e.g. the Railway single-service setup) work with a plain
// relative '/api'. A frontend hosted separately from the API (e.g. this app
// on Vercel, the API on Railway/Render) must set VITE_API_URL to the API's
// full public URL at build time.
const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

let isRefreshing = false;
let pendingQueue: Array<() => void> = [];

function resolveQueue() {
  pendingQueue.forEach((cb) => cb());
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;

    const isAuthRoute = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      if (isRefreshing) {
        await new Promise<void>((resolve) => pendingQueue.push(resolve));
        return api(originalRequest);
      }

      isRefreshing = true;
      try {
        await api.post('/auth/refresh');
        resolveQueue();
        return api(originalRequest);
      } catch (refreshError) {
        resolveQueue();
        window.dispatchEvent(new CustomEvent('engecom:session-expired'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Avatars (and other server-served static files) come back as API-relative
// paths like "/api/avatars/<file>". In same-origin setups that's already a
// valid URL; in a split-origin deployment (frontend on Vercel, API elsewhere)
// it must be prefixed with the API's origin, derived from VITE_API_URL.
const apiOrigin = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

export function resolveAssetUrl(assetPath: string | null | undefined): string | null {
  if (!assetPath) return null;
  return `${apiOrigin}${assetPath}`;
}

export interface ApiErrorShape {
  error: { code: string; message: string; details?: unknown };
}

export function getApiErrorMessage(err: unknown, fallback = 'Ocorreu um erro inesperado.'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorShape | undefined;
    if (data?.error?.message) return data.error.message;
  }
  return fallback;
}
