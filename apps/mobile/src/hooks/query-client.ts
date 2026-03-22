/**
 * TanStack Query client singleton.
 *
 * Configured with sensible defaults for a mobile app:
 * - 5 min staleTime: avoid re-fetching on every screen focus
 * - 30 min gcTime: keep unused data in memory longer for back navigation
 * - 2 retries: handle flaky mobile connections gracefully
 * - refetchOnWindowFocus: disabled — mobile apps don't have "window focus"
 *   like web browsers; unnecessary refetches waste battery
 */

import { QueryClient } from '@tanstack/react-query';

const FIVE_MINUTES = 5 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: FIVE_MINUTES,
      gcTime: THIRTY_MINUTES,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
