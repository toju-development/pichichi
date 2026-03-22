import type { UpdateProfileDto, UserDto } from '@pichichi/shared';

import { api } from './client';

export async function getMe(): Promise<UserDto> {
  const { data } = await api.get<UserDto>('/users/me');
  return data;
}

export async function updateMe(dto: UpdateProfileDto): Promise<UserDto> {
  const { data } = await api.patch<UserDto>('/users/me', dto);
  return data;
}
