/**
 * Login screen — Google + Apple OAuth.
 *
 * Design: Selva Mundialista branded, full-screen.
 * Google OAuth via expo-auth-session.
 * Apple Sign In via expo-apple-authentication (iOS only).
 * All text in Spanish (app targets Argentine users).
 *
 * Google OAuth gracefully degrades when client IDs are not configured:
 * the button is rendered as disabled with a console warning instead of
 * crashing the entire screen.
 */

import { useEffect, useState } from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import type { AuthSessionResult } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

import { Button } from '@/components/ui/button';
import { useLoginWithApple, useLoginWithGoogle } from '@/hooks/use-auth';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

/**
 * Check if Google OAuth is configured for the current platform.
 * Without valid client IDs, expo-auth-session throws immediately.
 */
const isGoogleConfigured =
  (Platform.OS === 'ios' && !!GOOGLE_IOS_CLIENT_ID) ||
  (Platform.OS === 'android' && !!GOOGLE_ANDROID_CLIENT_ID);

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

  return (
    <View className="flex-1 bg-background px-8">
      {/* Top section — branding */}
      <View className="flex-1 items-center justify-center">
        <Text className="text-6xl">⚽</Text>
        <Text className="mt-4 text-4xl font-bold text-primary">Pichichi</Text>
        <Text className="mt-3 text-center text-lg text-text-secondary">
          Competí con amigos prediciendo resultados
        </Text>
      </View>

      {/* Bottom section — OAuth buttons */}
      <View className="mb-12 gap-4">
        <Button
          title="Continuar con Google"
          variant="google"
          loading={isGoogleLoading || loginWithGoogle.isPending}
          disabled={!isGoogleConfigured || !request || isLoading}
          onPress={handleGoogleLogin}
        />

        {Platform.OS === 'ios' && (
          <Button
            title="Continuar con Apple"
            variant="apple"
            loading={isAppleLoading || loginWithApple.isPending}
            disabled={isLoading}
            onPress={handleAppleLogin}
          />
        )}

        <Text className="mt-2 text-center text-xs text-text-muted">
          Al continuar, aceptás nuestros términos y condiciones
        </Text>
      </View>
    </View>
  );
}
