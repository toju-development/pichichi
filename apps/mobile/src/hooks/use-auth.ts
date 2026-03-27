import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { AuthResponseDto } from '@pichichi/shared';

import * as authApi from '@/api/auth';
import { useAuthStore } from '@/stores/auth-store';

export function useLoginWithGoogle() {
  const login = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: (token: string) => authApi.loginWithGoogle(token),
    onSuccess: (data: AuthResponseDto) => login(data),
  });
}

export function useLoginWithApple() {
  const login = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: ({
      token,
      firstName,
      lastName,
    }: {
      token: string;
      firstName?: string;
      lastName?: string;
    }) => authApi.loginWithApple(token, firstName, lastName),
    onSuccess: (data: AuthResponseDto) => login(data),
  });
}

export function useDevLogin() {
  const login = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: ({
      email,
      displayName,
    }: {
      email: string;
      displayName?: string;
    }) => authApi.devLogin(email, displayName),
    onSuccess: (data: AuthResponseDto) => login(data),
  });
}

/**
 * Logout hook — calls the API to revoke the refresh token on the server,
 * then clears local auth state. The API call is best-effort: even if it
 * fails (e.g. token already expired), we still clear local state so the
 * user isn't stuck in a "logged in but broken" state.
 */
export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { refreshToken } = useAuthStore.getState();

      // Revoke refresh token on the server BEFORE clearing local state
      // so the Authorization header interceptor still has a valid access token.
      if (refreshToken) {
        try {
          await authApi.logout(refreshToken);
        } catch {
          // Best-effort — token might already be invalid
        }
      }

      // Clear local state + SecureStore
      await logout();
    },
    onSettled: () => {
      qc.clear();
    },
  });
}
