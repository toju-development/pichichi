/**
 * Tournaments section stack layout.
 *
 * Nested Stack inside the Torneos tab for list → detail navigation.
 * headerShown: false on the Stack lets each screen control its own header.
 */

import { Stack } from 'expo-router';

export default function TournamentsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
