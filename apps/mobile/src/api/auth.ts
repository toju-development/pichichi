import type { AuthResponseDto } from '@pichichi/shared';

import { api } from './client';

export async function loginWithGoogle(token: string): Promise<AuthResponseDto> {
  const { data } = await api.post<AuthResponseDto>('/auth/google', { token });
  return data;
}

export async function loginWithApple(
  token: string,
  firstName?: string,
  lastName?: string,
): Promise<AuthResponseDto> {
  const { data } = await api.post<AuthResponseDto>('/auth/apple', {
    token,
    firstName,
    lastName,
  });
  return data;
}

export async function refreshTokens(
  refreshToken: string,
): Promise<AuthResponseDto> {
  const { data } = await api.post<AuthResponseDto>('/auth/refresh', {
    refreshToken,
  });
  return data;
}

export async function devLogin(
  email: string,
  displayName?: string,
): Promise<AuthResponseDto> {
  const { data } = await api.post<AuthResponseDto>('/auth/dev-login', {
    email,
    displayName,
  });
  return data;
}

export async function logout(refreshToken: string): Promise<void> {
  await api.post('/auth/logout', { refreshToken });
}
