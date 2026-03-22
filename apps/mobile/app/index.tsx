/**
 * Entry point — redirects based on auth state.
 *
 * - Hydrating → shows loading screen
 * - Authenticated → redirects to (tabs)
 * - Not authenticated → redirects to (auth)/login
 */

import { Redirect } from 'expo-router';

import { LoadingScreen } from '@/components/ui/loading-screen';
import { useAuthStore } from '@/stores/auth-store';

export default function Index() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isHydrated) return <LoadingScreen />;

  if (isAuthenticated) return <Redirect href="/(tabs)" />;

  return <Redirect href="/(auth)/login" />;
}
