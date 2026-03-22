import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { UpdateProfileDto } from '@pichichi/shared';

import * as usersApi from '@/api/users';
import { useAuthStore } from '@/stores/auth-store';

import { queryKeys } from './query-keys';

export function useMe() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: queryKeys.user.me,
    queryFn: async () => {
      const user = await usersApi.getMe();
      setUser(user);
      return user;
    },
    enabled: isAuthenticated,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (dto: UpdateProfileDto) => usersApi.updateMe(dto),
    onSuccess: (user) => {
      setUser(user);
      qc.setQueryData(queryKeys.user.me, user);
    },
  });
}
