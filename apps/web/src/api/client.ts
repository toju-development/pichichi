/**
 * Axios API client con inyección de Bearer y refresh queue para 401.
 *
 * Refresh queue (CRÍTICO): cuando varios requests pegan 401 en simultáneo,
 * sólo UNO dispara `/auth/refresh`. El resto queda en `failedQueue` y se
 * resuelve con el nuevo access token cuando el refresh termina. Sin esto,
 * la rotación de tokens detecta reuse y revoca todo => relogin forzado.
 *
 * NOTA sobre la circularidad client → store → api → client:
 * En mobile (Metro) usamos lazy require porque el ciclo rompe en evaluation
 * time. En web (Vite/Webpack ESM) los ciclos se resuelven con bindings live:
 * importamos `useAuthStore` arriba y los interceptores acceden a él vía
 * `getState()` siempre en runtime, así que el ciclo es inocuo.
 */
import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

import { env } from "@/lib/env";
import { useAuthStore } from "@/stores/auth-store";

const baseURL = env.apiUrlOptional() || "http://localhost:3000/api/v1";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request interceptor: inyecta Bearer ─────────────────────────────────────

api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ─── Response interceptor: refresh queue ─────────────────────────────────────

interface QueueItem {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

function processQueue(error: unknown, token: string | null): void {
  for (const item of failedQueue) {
    if (error) {
      item.reject(error);
    } else {
      item.resolve(token!);
    }
  }
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const { refreshToken, setTokens, logout } = useAuthStore.getState();

    if (!refreshToken) {
      isRefreshing = false;
      processQueue(new Error("No refresh token"), null);
      logout();
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post<{
        accessToken: string;
        refreshToken: string;
      }>(`${baseURL}/auth/refresh`, { refreshToken });

      setTokens(data.accessToken, data.refreshToken);
      processQueue(null, data.accessToken);

      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

/** Test-only: resetea estado interno del refresh queue entre specs. */
export function __resetRefreshQueueForTests(): void {
  isRefreshing = false;
  failedQueue = [];
}
