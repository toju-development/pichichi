/**
 * Safe wrapper around the SVG Logo component.
 *
 * Lazy-loads `react-native-svg`-based Logo to prevent a module-level crash
 * from taking down the entire screen. Falls back to a text-based logo
 * when the SVG module is unavailable.
 *
 * All fallback rendering uses INLINE styles only — no NativeWind.
 */

import { Text, View } from 'react-native';

// Lazy-load the SVG Logo to prevent module-level crash if react-native-svg
// is not linked or fails to initialize.
let LogoComponent: React.ComponentType<{
  size?: number;
  variant?: 'full' | 'icon';
}> | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  LogoComponent = require('./logo').Logo;
} catch (e) {
  console.warn('[SafeLogo] Failed to load SVG Logo:', e);
}

interface SafeLogoProps {
  size?: number;
  variant?: 'full' | 'icon';
}

/**
 * Renders the SVG shield logo when react-native-svg is available,
 * otherwise renders a styled "PICHICHI" text as fallback.
 */
export function SafeLogo({ size = 48, variant = 'icon' }: SafeLogoProps) {
  if (!LogoComponent) {
    return (
      <View style={{ alignItems: 'center' }}>
        <Text
          style={{
            fontSize: size * 0.6,
            fontWeight: '900',
            color: 'white',
            letterSpacing: 4,
          }}
        >
          PICHICHI
        </Text>
      </View>
    );
  }

  try {
    return <LogoComponent size={size} variant={variant} />;
  } catch {
    return (
      <View style={{ alignItems: 'center' }}>
        <Text
          style={{
            fontSize: size * 0.6,
            fontWeight: '900',
            color: 'white',
            letterSpacing: 4,
          }}
        >
          PICHICHI
        </Text>
      </View>
    );
  }
}
