/**
 * OfflineBanner — slides down when the device loses internet connection
 * and slides back up when connectivity is restored.
 *
 * IMPORTANT — NativeWind v4:
 * All visual props use StyleSheet. No className on this component.
 */

import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { WifiOff } from 'lucide-react-native';

import { useNetworkStatus } from '@/hooks/use-network-status';

const BANNER_HEIGHT = 40;

export function OfflineBanner() {
  const { isOffline } = useNetworkStatus();
  const translateY = useRef(new Animated.Value(-BANNER_HEIGHT)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: isOffline ? 0 : -BANNER_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOffline, translateY]);

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY }] }]}>
      <WifiOff size={14} color="#FFFFFF" />
      <Text style={styles.text}>Sin conexión a internet</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: BANNER_HEIGHT,
    backgroundColor: '#1A1A2E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 999,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
