/**
 * Root layout — outermost provider hierarchy for the app.
 *
 * Provider order (outermost → innermost):
 * 1. QueryClientProvider (TanStack Query)
 * 2. AuthProvider (hydration + auth state)
 * 3. SocketProvider (real-time connection lifecycle)
 * 4. Slot (Expo Router)
 */

import '../global.css';
import '@/nativewind-interop';

import { QueryClientProvider } from '@tanstack/react-query';
import { Slot } from 'expo-router';

import { queryClient } from '@/hooks/query-client';
import { AuthProvider } from '@/providers/auth-provider';
import { SocketProvider } from '@/providers/socket-provider';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <Slot />
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
