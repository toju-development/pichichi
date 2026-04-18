import type { DashboardResponseDto } from '@pichichi/shared';

import { api } from './client';

export async function getDashboard(): Promise<DashboardResponseDto> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
  const { data } = await api.get<DashboardResponseDto>('/dashboard', {
    params: { tz },
  });
  return data;
}
