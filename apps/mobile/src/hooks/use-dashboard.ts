import { useQuery } from '@tanstack/react-query';

import * as dashboardApi from '@/api/dashboard';

import { queryKeys } from './query-keys';

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard.all,
    queryFn: dashboardApi.getDashboard,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}
