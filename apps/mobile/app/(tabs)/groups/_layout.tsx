/**
 * Groups section stack layout.
 *
 * Nested Stack inside the Groups tab for list → detail navigation.
 * headerShown: false on the Stack lets each screen control its own header.
 */

import { Stack } from 'expo-router';

export default function GroupsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
