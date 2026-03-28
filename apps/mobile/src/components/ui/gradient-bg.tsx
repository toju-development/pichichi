/**
 * Reusable gradient background wrapper.
 *
 * Wraps children in an `expo-linear-gradient` LinearGradient that defaults to
 * the Pichichi primary-to-background vertical gradient.
 *
 * Gracefully falls back to a plain View with backgroundColor if the native
 * LinearGradient module fails to load (e.g. in Expo Go without dev build,
 * or if the native module is not linked). This prevents the entire app from
 * white-screening when the gradient module is unavailable.
 *
 * IMPORTANT — NativeWind v4 rules applied here:
 * LinearGradient is registered with cssInterop (see nativewind-interop.ts),
 * so `className` maps to `style`. To avoid mixing style+className on the same
 * element, we wrap with an outer View for any inline styles and keep
 * LinearGradient with className-only.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, type ColorValue, type ViewStyle } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

/** Tuple of at least two colour values (expo-linear-gradient requirement). */
type GradientColors = readonly [ColorValue, ColorValue, ...ColorValue[]];

/** Tuple of at least two number stops matching `colors` length. */
type GradientLocations = readonly [number, number, ...number[]];

interface GradientBackgroundProps {
  /** Gradient color stops. Default: primary → background. */
  colors?: GradientColors;
  /** Gradient stop positions (0-1). Must match `colors` length. */
  locations?: GradientLocations | null;
  /** Gradient start point. Default: top-left `{ x: 0, y: 0 }`. */
  start?: { x: number; y: number };
  /** Gradient end point. Default: bottom-left `{ x: 0, y: 1 }`. */
  end?: { x: number; y: number };
  children: React.ReactNode;
  /** NativeWind classes forwarded to LinearGradient. */
  className?: string;
  /** Additional inline styles applied to an outer wrapper View. */
  style?: ViewStyle;
}

/* -------------------------------------------------------------------------- */
/*  Error Boundary — catches LinearGradient native module crashes             */
/* -------------------------------------------------------------------------- */

interface FallbackState {
  hasError: boolean;
}

class GradientErrorBoundary extends Component<
  { fallbackColor: string; style?: ViewStyle; children: ReactNode },
  FallbackState
> {
  state: FallbackState = { hasError: false };

  static getDerivedStateFromError(): FallbackState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn(
      '[GradientBackground] LinearGradient crashed — falling back to plain View.',
      error.message,
      info.componentStack,
    );
  }

  render() {
    if (this.state.hasError) {
      // SAFETY: fallback uses ONLY inline styles — no className/NativeWind
      // which could also fail and cause a cascading crash.
      return (
        <View
          style={[
            { flex: 1, backgroundColor: this.props.fallbackColor },
            this.props.style,
          ]}
        >
          {this.props.children}
        </View>
      );
    }
    return this.props.children;
  }
}

/* -------------------------------------------------------------------------- */
/*  GradientBackground                                                        */
/* -------------------------------------------------------------------------- */

export function GradientBackground({
  colors = ['#0B6E4F', '#F0FAF4'] as GradientColors,
  locations,
  start = { x: 0, y: 0 },
  end = { x: 0, y: 1 },
  children,
  className,
  style,
}: GradientBackgroundProps) {
  // Use the first color as fallback background when LinearGradient fails
  const fallbackColor = String(colors[0]);

  const gradient = (
    <LinearGradient
      colors={colors}
      locations={locations}
      start={start}
      end={end}
      className={className}
    >
      {children}
    </LinearGradient>
  );

  return (
    <GradientErrorBoundary fallbackColor={fallbackColor} style={style}>
      {style ? <View style={style}>{gradient}</View> : gradient}
    </GradientErrorBoundary>
  );
}
