/**
 * Root layout — outermost provider hierarchy for the app.
 *
 * Provider order (outermost → innermost):
 * 1. QueryClientProvider (TanStack Query)
 * 2. AuthProvider (hydration + auth state)
 * 3. SocketProvider (real-time connection lifecycle)
 * 4. Stack (Expo Router)
 *
 * Uses a root Stack (instead of Slot) so screens like /notifications can be
 * pushed from any tab via `router.push('/notifications')`.
 */

import '../global.css';
import '@/nativewind-interop';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';

import { queryClient } from '@/hooks/query-client';
import { AuthProvider } from '@/providers/auth-provider';
import { SocketProvider } from '@/providers/socket-provider';
import { AppErrorBoundary } from '@/components/ui/error-boundary';

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SocketProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="notifications"
                options={{ animation: 'slide_from_right' }}
              />
            </Stack>
          </SocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
