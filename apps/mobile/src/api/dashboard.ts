import type { DashboardResponseDto } from '@pichichi/shared';

import { api } from './client';

export async function getDashboard(): Promise<DashboardResponseDto> {
  const { data } = await api.get<DashboardResponseDto>('/dashboard');
  return data;
}
