/**
 * NativeWind v4 cssInterop registrations.
 *
 * Third-party components (e.g. expo-linear-gradient) are NOT standard React
 * Native primitives, so NativeWind does not know how to map `className` to
 * their internal `style` prop. We register them here once, at app boot.
 *
 * Import this file in the root layout (`app/_layout.tsx`) BEFORE any
 * component that uses these third-party components with `className`.
 */

import { cssInterop } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';

cssInterop(LinearGradient, { className: 'style' });
