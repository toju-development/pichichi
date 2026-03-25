/**
 * Login screen — Google + Apple OAuth.
 *
 * Design: Selva Mundialista branded, full-screen deep green gradient.
 * Google OAuth via expo-auth-session.
 * Apple Sign In via expo-apple-authentication (iOS only).
 * All text in Spanish (app targets Argentine users).
 *
 * Google OAuth gracefully degrades when client IDs are not configured:
 * the button is rendered as disabled with a console warning instead of
 * crashing the entire screen.
 *
 * SAFETY: All critical layout styles (flex, backgroundColor) are duplicated
 * as inline `style` props so the screen is always visible, even if NativeWind
 * className processing fails. className is kept as progressive enhancement.
 *
 * PREMIUM COMPONENTS: GradientBackground and SafeLogo are lazy-loaded.
 * If expo-linear-gradient or react-native-svg fail, the screen degrades
 * to plain green bg and text-based branding — still fully functional.
 */

import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import type { AuthSessionResult } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLoginWithApple, useLoginWithGoogle } from '@/hooks/use-auth';
import { SafeLogo } from '@/components/brand/safe-logo';
import { useAuthStore } from '@/stores/auth-store';

WebBrowser.maybeCompleteAuthSession();

// ---------------------------------------------------------------------------
//  Styles — using StyleSheet so NativeWind cannot interfere
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  googleBtn: {
    backgroundColor: '#FFFFFF',
    height: 52,
    borderRadius: 12,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appleBtn: {
    backgroundColor: '#000000',
    height: 52,
    borderRadius: 12,
    overflow: 'hidden' as const,
    marginTop: 14,
  },
  btnInner: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#4285F4',
    marginRight: 10,
  },
  googleLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A2E',
  },
  appleIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    marginRight: 10,
  },
  appleLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  devBtn: {
    marginTop: 24,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden' as const,
  },
  devInner: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  devLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center' as const,
  },
});

// ---------------------------------------------------------------------------
//  Lazy-load GradientBackground — fallback to plain View if unavailable
// ---------------------------------------------------------------------------
let GradientBg: React.ComponentType<{
  colors?: readonly string[];
  children: React.ReactNode;
  className?: string;
  style?: import('react-native').ViewStyle;
}> | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  GradientBg = require('@/components/ui/gradient-bg').GradientBackground;
} catch (e) {
  console.warn('[login] GradientBackground unavailable:', e);
}

// ---------------------------------------------------------------------------
//  Google OAuth configuration
// ---------------------------------------------------------------------------
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

/**
 * Check if Google OAuth is configured for the current platform.
 * Without valid client IDs, expo-auth-session throws immediately.
 * The webClientId is also required so that the issued idToken uses the
 * Web Client ID as its `aud` claim, matching the backend's GOOGLE_CLIENT_ID.
 */
const isGoogleConfigured =
  !!GOOGLE_WEB_CLIENT_ID &&
  ((Platform.OS === 'ios' && !!GOOGLE_IOS_CLIENT_ID) ||
    (Platform.OS === 'android' && !!GOOGLE_ANDROID_CLIENT_ID));

/**
 * Wrapper around Google.useAuthRequest that returns null-safe defaults
 * when Google OAuth is not configured, preventing the crash:
 * "Client Id property 'iosClientId' must be defined to use Google auth."
 *
 * Hooks can't be called conditionally, so we isolate the real hook in a
 * component that only mounts when Google IS configured. This component
 * uses a null-returning fallback hook otherwise.
 */
function useGoogleAuthSafe() {
  if (!isGoogleConfigured) {
    return [null, null, async () => ({}) as AuthSessionResult] as const;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks -- guarded by constant
  return Google.useAuthRequest({
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });
}

export default function LoginScreen() {
  const loginWithGoogle = useLoginWithGoogle();
  const loginWithApple = useLoginWithApple();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  const [request, response, promptAsync] = useGoogleAuthSafe();

  useEffect(() => {
    if (!isGoogleConfigured) {
      console.warn(
        '[login] Google OAuth is not configured. Set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID and/or EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID in your .env file.',
      );
    }
  }, []);

  useEffect(() => {
    if (!isGoogleConfigured || !response) return;

    if (response.type === 'success') {
      const idToken = response.authentication?.idToken;

      if (idToken) {
        setIsGoogleLoading(true);
        loginWithGoogle.mutate(idToken, {
          onError: () => {
            Alert.alert(
              'Error',
              'No se pudo iniciar sesión con Google. Intentá de nuevo.',
            );
            setIsGoogleLoading(false);
          },
          onSuccess: () => {
            setIsGoogleLoading(false);
          },
        });
      }
    }

    if (response.type === 'error') {
      Alert.alert(
        'Error',
        'No se pudo iniciar sesión con Google. Intentá de nuevo.',
      );
    }
  }, [response]);

  async function handleGoogleLogin() {
    await promptAsync();
  }

  async function handleAppleLogin() {
    try {
      setIsAppleLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        loginWithApple.mutate(
          {
            token: credential.identityToken,
            firstName: credential.fullName?.givenName ?? undefined,
            lastName: credential.fullName?.familyName ?? undefined,
          },
          {
            onError: () => {
              Alert.alert(
                'Error',
                'No se pudo iniciar sesión con Apple. Intentá de nuevo.',
              );
              setIsAppleLoading(false);
            },
            onSuccess: () => {
              setIsAppleLoading(false);
            },
          },
        );
      }
    } catch (error: unknown) {
      const appleError = error as { code?: string };
      // User cancelled — not an error worth showing
      if (appleError.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert(
          'Error',
          'No se pudo iniciar sesión con Apple. Intentá de nuevo.',
        );
      }
      setIsAppleLoading(false);
    }
  }

  const isLoading =
    isGoogleLoading ||
    isAppleLoading ||
    loginWithGoogle.isPending ||
    loginWithApple.isPending;

  // ---------------------------------------------------------------------------
  //  DEV ONLY — bypass OAuth to test tab screens
  // ---------------------------------------------------------------------------
  async function handleDevBypass() {
    await useAuthStore.getState().login({
      accessToken: 'dev-fake-access-token',
      refreshToken: 'dev-fake-refresh-token',
      user: {
        id: 'dev-user-001',
        email: 'dev@pichichi.test',
        displayName: 'Dev User',
        username: 'devuser',
        avatarUrl: null,
        createdAt: new Date().toISOString(),
      },
    });
    // Navigate explicitly — index.tsx only redirects on mount, so changing
    // isAuthenticated while already on (auth)/login won't trigger a re-redirect.
    router.replace('/(tabs)');
  }

  // ---------------------------------------------------------------------------
  //  Background: GradientBackground if available, plain View otherwise
  // ---------------------------------------------------------------------------
  const BackgroundWrapper = GradientBg || View;
  const bgProps = GradientBg
    ? { colors: ['#0B6E4F', '#084a36'] as const, style: { flex: 1 } }
    : { style: { flex: 1, backgroundColor: '#0B6E4F' } };

  return (
    <BackgroundWrapper {...bgProps}>
      <SafeAreaView
        className="flex-1"
        style={{ flex: 1 }}
      >
        <View
          className="flex-1 justify-between px-8 py-6"
          style={{
            flex: 1,
            justifyContent: 'space-between',
            paddingHorizontal: 32,
            paddingVertical: 24,
          }}
        >
          {/* Top section — branding with SafeLogo, centered in available space */}
          <View
            className="flex-1 items-center justify-center"
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <SafeLogo size={80} variant="icon" />
            <Text
              style={{
                color: 'white',
                fontSize: 36,
                fontWeight: '900',
                letterSpacing: 3,
                marginTop: 16,
              }}
            >
              PICHICHI
            </Text>
            <Text
              style={{
                color: '#FFD166',
                fontSize: 16,
                fontStyle: 'italic',
                marginTop: 8,
              }}
            >
              Predecí, competí, ganá
            </Text>
          </View>

          {/* Bottom section — OAuth buttons pinned to bottom */}
          <View style={{ paddingBottom: 24 }}>
            {/* Google Sign-In */}
            <View style={[s.googleBtn, !isGoogleConfigured && { opacity: 0.5 }]}>
              <Pressable
                onPress={handleGoogleLogin}
                disabled={isGoogleLoading || !isGoogleConfigured}
                className="flex-1 active:opacity-70"
              >
                <View style={s.btnInner}>
                  {isGoogleLoading ? (
                    <ActivityIndicator color="#1A1A2E" />
                  ) : (
                    <>
                      <Text style={s.googleIcon}>G</Text>
                      <Text style={s.googleLabel}>Continuar con Google</Text>
                    </>
                  )}
                </View>
              </Pressable>
            </View>

            {/* Apple Sign-In — iOS only */}
            {Platform.OS === 'ios' && (
              <View style={s.appleBtn}>
                <Pressable
                  onPress={handleAppleLogin}
                  disabled={isAppleLoading}
                  className="flex-1 active:opacity-70"
                >
                  <View style={s.btnInner}>
                    {isAppleLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={s.appleIcon}>{'\uF8FF'}</Text>
                        <Text style={s.appleLabel}>Continuar con Apple</Text>
                      </>
                    )}
                  </View>
                </Pressable>
              </View>
            )}

            {/* Privacy / Terms disclaimer */}
            <Text
              style={{
                color: 'rgba(255,255,255,0.5)',
                textAlign: 'center',
                fontSize: 12,
                marginTop: 16,
              }}
            >
              Al continuar, aceptás los Términos y la Política de Privacidad
            </Text>

            {/* DEV ONLY — bypass OAuth for local testing */}
            {__DEV__ && (
              <View style={s.devBtn}>
                <Pressable
                  onPress={handleDevBypass}
                  className="flex-1 active:opacity-70"
                >
                  <View style={s.devInner}>
                    <Text style={s.devLabel}>⚙ Dev Mode — Skip Login</Text>
                  </View>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
}
