/**
 * Auth group layout — Stack with no header.
 *
 * Contains screens for unauthenticated users (login, register, etc.).
 */

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
