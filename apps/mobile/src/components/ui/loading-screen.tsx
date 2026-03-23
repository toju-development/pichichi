/**
 * Full-screen branded loading indicator.
 *
 * Used during auth hydration to show a branded splash
 * while tokens are being restored from SecureStore.
 *
 * IMPORTANT: This component intentionally does NOT use GradientBackground
 * or any native module that might fail to load. It uses a plain View with
 * backgroundColor AND inline flex:1 so it can always render — even when
 * NativeWind or native modules are broken. If LoadingScreen crashes, the
 * entire app white-screens because it's rendered by AuthProvider before
 * any other UI.
 *
 * All critical styles are INLINE to guarantee visibility regardless of
 * NativeWind state. className is kept as a progressive enhancement.
 *
 * SafeLogo is lazy-loaded — if react-native-svg fails, the shield is
 * replaced by a text-based fallback. The screen remains visible either way.
 */

import { ActivityIndicator, Text, View } from 'react-native';

import { SafeLogo } from '@/components/brand/safe-logo';

export function LoadingScreen() {
  return (
    <View
      className="flex-1 items-center justify-center"
      style={{
        flex: 1,
        backgroundColor: '#0B6E4F',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <SafeLogo size={64} variant="icon" />

      <Text
        style={{
          fontSize: 28,
          fontWeight: '900',
          letterSpacing: 3,
          color: '#FFFFFF',
          marginTop: 12,
        }}
      >
        PICHICHI
      </Text>

      <ActivityIndicator size="large" color="#FFD166" style={{ marginTop: 24 }} />

      <Text
        className="mt-4 text-sm font-medium"
        style={{ color: 'rgba(255,255,255,0.6)', marginTop: 12, fontSize: 14 }}
      >
        Cargando...
      </Text>
    </View>
  );
}
