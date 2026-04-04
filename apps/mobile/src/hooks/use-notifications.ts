import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as notificationsApi from '@/api/notifications';

import { queryKeys } from './query-keys';

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: notificationsApi.getNotifications,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: notificationsApi.getUnreadCount,
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
