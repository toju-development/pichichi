/**
 * Root layout — outermost provider hierarchy for the app.
 *
 * Provider order (outermost → innermost):
 * 1. QueryClientProvider (TanStack Query)
 * 2. AuthProvider (hydration + auth state)
 * 3. Slot (Expo Router)
 */

import '../global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { Slot } from 'expo-router';

import { queryClient } from '@/hooks/query-client';
import { AuthProvider } from '@/providers/auth-provider';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </QueryClientProvider>
  );
}
