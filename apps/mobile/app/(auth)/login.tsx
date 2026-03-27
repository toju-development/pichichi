/**
 * Login screen — Google + Apple OAuth.
 *
 * Design: Selva Mundialista branded, full-screen deep green gradient.
 * Google OAuth via @react-native-google-signin/google-signin (native).
 * Apple Sign In via expo-apple-authentication (iOS only).
 * All text in Spanish (app targets Argentine users).
 *
 * SAFETY: All critical layout styles (flex, backgroundColor) are duplicated
 * as inline `style` props so the screen is always visible, even if NativeWind
 * className processing fails. className is kept as progressive enhancement.
 *
 * PREMIUM COMPONENTS: GradientBackground and SafeLogo are lazy-loaded.
 * If expo-linear-gradient or react-native-svg fail, the screen degrades
 * to plain green bg and text-based branding — still fully functional.
 */

import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLoginWithApple, useLoginWithGoogle, useDevLogin } from '@/hooks/use-auth';
import { SafeLogo } from '@/components/brand/safe-logo';

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
  devSection: {
    marginTop: 24,
    borderWidth: 1,
    borderStyle: 'dashed' as const,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    padding: 14,
  },
  devHeader: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: 'center' as const,
  },
  devInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 12,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 10,
  },
  devBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
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
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.5)',
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

export default function LoginScreen() {
  const loginWithGoogle = useLoginWithGoogle();
  const loginWithApple = useLoginWithApple();
  const devLogin = useDevLogin();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [devEmail, setDevEmail] = useState('pablomartinez555@gmail.com');

  // ---------------------------------------------------------------------------
  //  Google Sign-In handler — native flow via Google Play Services / iOS SDK
  //  Uses dynamic import so the app can boot in Expo Go (no native modules).
  //  GoogleSignin.configure() is called right before signIn — safe to repeat.
  // ---------------------------------------------------------------------------
  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    try {
      const {
        GoogleSignin,
        isSuccessResponse,
        isErrorWithCode,
        statusCodes,
      } = await import('@react-native-google-signin/google-signin');

      // Configure (safe to call multiple times)
      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
      const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

      console.log('[login] GoogleSignin.configure()', {
        webClientId: webClientId ? `${webClientId.substring(0, 20)}...` : '⚠️ MISSING',
        iosClientId: iosClientId ? `${iosClientId.substring(0, 20)}...` : '⚠️ MISSING',
      });

      GoogleSignin.configure({ iosClientId, webClientId });

      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      console.log('[login] GoogleSignin.signIn() response:', JSON.stringify(response, null, 2));

      if (isSuccessResponse(response)) {
        const idToken = response.data.idToken;

        console.log('[login] idToken present:', !!idToken);

        if (idToken) {
          console.log('[login] Calling loginWithGoogle.mutate with idToken:', `${idToken.substring(0, 30)}...`);
          loginWithGoogle.mutate(idToken, {
            onError: (mutationError) => {
              console.error('[login] loginWithGoogle mutation error:', {
                message: mutationError?.message,
                name: mutationError?.name,
                full: JSON.stringify(mutationError, null, 2),
              });
              Alert.alert(
                'Error',
                `Error del servidor: ${mutationError?.message || 'No se pudo iniciar sesión con Google'}`,
              );
              setIsGoogleLoading(false);
            },
            onSuccess: () => {
              setIsGoogleLoading(false);
              router.replace('/(tabs)');
            },
          });
        } else {
          console.error('[login] idToken is null! This usually means webClientId is missing or incorrect in GoogleSignin.configure()');
          console.error('[login] Full response.data:', JSON.stringify(response.data, null, 2));
          Alert.alert(
            'Error',
            'No se obtuvo idToken de Google. Verificá la configuración de webClientId.',
          );
          setIsGoogleLoading(false);
        }
      } else {
        // User cancelled sign-in
        console.log('[login] Google Sign-In: user cancelled or non-success response:', JSON.stringify(response, null, 2));
        setIsGoogleLoading(false);
      }
    } catch (error: unknown) {
      setIsGoogleLoading(false);

      // Native module not available — user is in Expo Go without native build
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes('RNGoogleSignin') || errMsg.includes('TurboModuleRegistry')) {
        console.warn('[login] Google Sign-In native module not available (Expo Go?):', errMsg);
        Alert.alert(
          'Google Sign-In no disponible',
          'Google Sign-In requiere un build nativo. Usá Dev Login en Expo Go.',
        );
        return;
      }

      console.error('[login] Google Sign-In catch block:', {
        errorType: typeof error,
        message: errMsg,
        full: JSON.stringify(error, Object.getOwnPropertyNames(error instanceof Error ? error : {}), 2),
      });

      // Try to use isErrorWithCode/statusCodes — they may be available if
      // the dynamic import succeeded but signIn itself threw
      try {
        const { isErrorWithCode, statusCodes } =
          await import('@react-native-google-signin/google-signin');

        if (isErrorWithCode(error)) {
          switch (error.code) {
            case statusCodes.IN_PROGRESS:
              // Sign-in already in progress — ignore
              console.log('[login] Google Sign-In already in progress, ignoring');
              break;
            case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
              Alert.alert(
                'Error',
                'Google Play Services no está disponible. Actualizá tu dispositivo.',
              );
              break;
            default:
              console.error(`[login] Google Sign-In error code: ${error.code}`);
              Alert.alert(
                'Error',
                `Google Sign-In falló (code: ${error.code}): ${error.message || 'Error desconocido'}`,
              );
          }
          return;
        }
      } catch {
        // Dynamic import itself failed — already handled by native module check above
      }

      console.error('[login] Google Sign-In unexpected error:', errMsg);
      Alert.alert(
        'Error',
        `Google Sign-In falló: ${errMsg}`,
      );
    }
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
              router.replace('/(tabs)');
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
    loginWithApple.isPending ||
    devLogin.isPending;

  // ---------------------------------------------------------------------------
  //  DEV ONLY — hit /auth/dev-login for quick local testing
  // ---------------------------------------------------------------------------
  function handleDevLogin() {
    if (!devEmail.trim()) {
      Alert.alert('Error', 'Ingresá un email para dev login.');
      return;
    }

    devLogin.mutate(
      { email: devEmail.trim() },
      {
        onError: (error) => {
          Alert.alert(
            'Dev Login Error',
            error?.message || 'No se pudo hacer dev login.',
          );
        },
        onSuccess: () => {
          router.replace('/(tabs)');
        },
      },
    );
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
            <View style={s.googleBtn}>
              <Pressable
                onPress={handleGoogleLogin}
                disabled={isGoogleLoading}
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

            {/* DEV ONLY — real dev-login endpoint for local testing */}
            {__DEV__ && (
              <View style={s.devSection}>
                <Text style={s.devHeader}>⚙ Dev Login</Text>
                <TextInput
                  style={s.devInput}
                  value={devEmail}
                  onChangeText={setDevEmail}
                  placeholder="Email"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <View style={s.devBtn}>
                  <Pressable
                    onPress={handleDevLogin}
                    disabled={devLogin.isPending}
                    className="flex-1 active:opacity-70"
                  >
                    <View style={s.devInner}>
                      {devLogin.isPending ? (
                        <ActivityIndicator color="rgba(255,255,255,0.5)" />
                      ) : (
                        <Text style={s.devLabel}>Dev Login</Text>
                      )}
                    </View>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </BackgroundWrapper>
  );
}
