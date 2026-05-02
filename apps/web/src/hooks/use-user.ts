/**
 * User profile hooks.
 *
 * Port literal de `apps/mobile/src/hooks/use-user.ts`. Cierra el TODO que
 * Phase 4 dejó en `auth-provider.tsx`: el bootstrap de `GET /users/me`
 * después de la hidratación de tokens.
 *
 * Notas:
 *   - `useMe()` queda gateado por `isAuthenticated` (deriva de
 *     `accessToken && user`). Si no hay sesión, el query queda `idle` y
 *     no dispara la llamada — comportamiento idéntico a mobile.
 *   - Cuando `usersApi.getMe()` resuelve, llamamos `setUser` para sincronizar
 *     el store con la última versión del back (puede traer cambios en
 *     `displayName`, plan, etc.).
 *   - 401 lo maneja el interceptor de `client.ts` (refresh queue + logout
 *     si refresh falla). NO duplicamos lógica acá.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { UpdateProfileDto } from "@pichichi/shared";

import { usersApi } from "@/api";
import { useAuthStore } from "@/stores/auth-store";

import { queryKeys } from "./query-keys";

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
