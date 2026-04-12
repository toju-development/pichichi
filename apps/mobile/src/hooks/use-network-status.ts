/**
 * useNetworkStatus — subscribes to connectivity changes via NetInfo.
 *
 * Returns `isOffline: boolean`. Starts as `false` (optimistic) and
 * updates as soon as the first NetInfo event fires.
 */

import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Fetch current state immediately on mount
    NetInfo.fetch().then((state) => {
      setIsOffline(state.isConnected === false);
    });

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false);
    });

    return unsubscribe;
  }, []);

  return { isOffline };
}
