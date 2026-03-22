/**
 * Thin wrapper over expo-secure-store for token persistence.
 *
 * SecureStore encrypts values in the device keychain (iOS) / EncryptedSharedPreferences (Android).
 * NEVER use AsyncStorage for tokens — it stores them in plain text.
 *
 * All operations are wrapped in try/catch to prevent crashes on web or
 * in test environments where SecureStore may not be available.
 */

import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'pichichi_access_token',
  REFRESH_TOKEN: 'pichichi_refresh_token',
} as const;

export async function getAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
  } catch {
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  } catch {
    return null;
  }
}

export async function setTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  try {
    await Promise.all([
      SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
      SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  } catch (error) {
    console.warn('[storage] Failed to persist tokens:', error);
  }
}

export async function clearTokens(): Promise<void> {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
  } catch {
    // Silently fail — tokens may already be cleared or SecureStore unavailable
  }
}
