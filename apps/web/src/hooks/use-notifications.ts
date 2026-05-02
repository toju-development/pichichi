/**
 * Notifications query hooks.
 *
 * Port literal de `apps/mobile/src/hooks/use-notifications.ts`. Mismas
 * keys, mismo PAGE_SIZE, misma estrategia de invalidación. Cualquier
 * cambio acá DEBE replicarse en mobile.
 *
 * `useNotifications` usa `useInfiniteQuery` (paginación scroll).
 * `useUnreadCount` está gateado por `isAuthenticated` para evitar fetches
 * antes de que el store rehidrate.
 */
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { notificationsApi } from "@/api";
import { useAuthStore } from "@/stores/auth-store";

import { queryKeys } from "./query-keys";

const PAGE_SIZE = 20;

/**
 * Paginated infinite query for the notification list page.
 * Loads 20 notifications at a time; `fetchNextPage` loads the next batch.
 */
export function useNotifications() {
  return useInfiniteQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: ({ pageParam = 0 }) =>
      notificationsApi.getNotifications(PAGE_SIZE, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.reduce((total, page) => total + page.length, 0);
    },
  });
}

export function useUnreadCount() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: notificationsApi.getUnreadCount,
    enabled: isAuthenticated,
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
      qc.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount,
      });
    },
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
      qc.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount,
      });
    },
  });
}
