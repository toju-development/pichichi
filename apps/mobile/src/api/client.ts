/**
 * Axios API client with token injection and 401 refresh queue.
 *
 * The refresh queue pattern is CRITICAL: when multiple requests hit 401
 * simultaneously, only ONE refresh call fires. All other failed requests
 * wait on the same promise and retry with the new token once it resolves.
 *
 * Without this, parallel refreshes trigger token rotation reuse detection
 * on the backend, which revokes ALL tokens and forces a re-login.
 *
 * NOTE: auth-store is accessed via lazy getter to break the circular
 * dependency: api/client → stores/auth-store → api/* → api/client.
 * The store is only resolved at runtime (inside interceptors), never at
 * module evaluation time, so the cycle is harmless.
 */

import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Lazy getter — breaks circular dependency at module evaluation time.
// The store module is only resolved when an interceptor actually runs,
// which is always after all modules have finished loading.
type AuthStoreApi = typeof import('@/stores/auth-store').useAuthStore;
let _authStore: AuthStoreApi | null = null;
function getAuthStore(): AuthStoreApi {
  if (!_authStore) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _authStore = require('@/stores/auth-store').useAuthStore as AuthStoreApi;
  }
  return _authStore;
}

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor: inject Bearer token ────────────────────────────────

api.interceptors.request.use((config) => {
  const { accessToken } = getAuthStore().getState();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// ─── Response interceptor: 401 refresh queue ─────────────────────────────────

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
      | InternalAxiosRequestConfig & { _retry?: boolean }
      | undefined;

    // Only handle 401s, not other errors
    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // Don't retry the refresh endpoint itself — that causes infinite loops
    if (originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    // Already retried this request — bail out
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // A refresh is already in flight — queue this request
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

    const { refreshToken, setTokens, logout } = getAuthStore().getState();

    if (!refreshToken) {
      isRefreshing = false;
      processQueue(new Error('No refresh token'), null);
      await logout();
      return Promise.reject(error);
    }

    try {
      // Call refresh endpoint directly (bypassing the interceptor)
      const { data } = await axios.post<{
        accessToken: string;
        refreshToken: string;
      }>(`${BASE_URL}/auth/refresh`, { refreshToken });

      await setTokens(data.accessToken, data.refreshToken);

      // Retry all queued requests with the new token
      processQueue(null, data.accessToken);

      // Retry the original request
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
