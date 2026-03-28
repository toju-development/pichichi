/**
 * TanStack Query client singleton.
 *
 * Configured with sensible defaults for a mobile app:
 * - 5 min staleTime: avoid re-fetching on every screen focus
 * - 30 min gcTime: keep unused data in memory longer for back navigation
 * - retry: skip 404s (resource gone, retrying is pointless), retry others twice
 * - refetchOnWindowFocus: disabled — mobile apps don't have "window focus"
 *   like web browsers; unnecessary refetches waste battery
 */

import { QueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

const FIVE_MINUTES = 5 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;

/** HTTP status codes that are permanent — retrying won't change the outcome. */
const NON_RETRYABLE_STATUSES = new Set([400, 401, 403, 404, 409, 422]);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: FIVE_MINUTES,
      gcTime: THIRTY_MINUTES,
      retry: (failureCount, error) => {
        const status = (error as AxiosError)?.response?.status;
        if (status && NON_RETRYABLE_STATUSES.has(status)) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
