/**
 * Auth provider — hydrates auth state on app launch.
 *
 * On mount: calls `authStore.hydrate()` to restore tokens from SecureStore.
 * While hydrating: renders a branded loading screen.
 * After hydration: renders children (the rest of the app).
 *
 * User profile is fetched via the `useMe()` TanStack Query hook, which
 * is enabled only when `isAuthenticated` is true. This cleanly separates
 * concerns: the store manages token state, the hook manages API calls.
 * If the token turns out to be expired and refresh fails, the 401 interceptor
 * in client.ts triggers logout automatically.
 */

import { useEffect, type ReactNode } from 'react';

import { LoadingScreen } from '@/components/ui/loading-screen';
import { useMe } from '@/hooks/use-user';
import { useAuthStore } from '@/stores/auth-store';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Fetch user profile after hydration — only runs when isAuthenticated is true.
  // This replaces the getMe() call that was previously in auth-store.hydrate(),
  // breaking the circular dependency between store and API layer.
  useMe();

  if (!isHydrated) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
