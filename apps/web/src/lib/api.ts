import axios, { AxiosError } from 'axios';

export const api = axios.create({
  baseURL: '/api',
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
