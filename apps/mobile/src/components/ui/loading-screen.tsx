/**
 * Full-screen branded loading indicator.
 *
 * Used during auth hydration to show a branded splash
 * while tokens are being restored from SecureStore.
 *
 * IMPORTANT: This component intentionally does NOT use GradientBackground,
 * NativeWind className, or any native module that might fail to load. It uses
 * ONLY inline StyleSheet styles so it renders reliably even if NativeWind is
 * broken. If LoadingScreen crashes, the entire app white-screens because it's
 * rendered by AuthProvider before any other UI.
 *
 * NativeWind v4 rule: NEVER mix style + className on the same element.
 * Since this is the splash screen, we use style-only for maximum reliability.
 *
 * SafeLogo is lazy-loaded — if react-native-svg fails, the shield is
 * replaced by a text-based fallback. The screen remains visible either way.
 */

import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { SafeLogo } from '@/components/brand/safe-logo';

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <SafeLogo size={64} variant="icon" />

      <Text style={styles.title}>PICHICHI</Text>

      <ActivityIndicator size="large" color="#FFD166" style={styles.spinner} />

      <Text style={styles.subtitle}>Cargando...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B6E4F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 3,
    color: '#FFFFFF',
    marginTop: 12,
  },
  spinner: {
    marginTop: 24,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
});
