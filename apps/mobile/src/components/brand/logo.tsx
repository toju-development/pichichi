/**
 * Pichichi Logo — Shield SVG wordmark for React Native
 *
 * Ported from apps/web/src/components/logo.tsx
 * Uses react-native-svg for the shield graphic.
 */
import { Text, View, type ViewStyle } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";

interface LogoProps {
  /** Controls height; width auto-scales from viewBox aspect ratio */
  size?: number;
  /** 'full' = shield + "PICHICHI" text, 'icon' = shield only */
  variant?: "full" | "icon";
  style?: ViewStyle;
}

/**
 * Shield icon — 40x40 viewBox, renders at `size` x `size`.
 * All path data identical to the web version.
 */
function ShieldIcon({ size = 48 }: { size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
    >
      {/* Gradients */}
      <Defs>
        <LinearGradient
          id="logo-grad"
          x1="0"
          y1="0"
          x2="40"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0%" stopColor="#0B6E4F" />
          <Stop offset="100%" stopColor="#14A76C" />
        </LinearGradient>
        <LinearGradient
          id="logo-gold"
          x1="10"
          y1="0"
          x2="30"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0%" stopColor="#FFD166" />
          <Stop offset="100%" stopColor="#E6B84D" />
        </LinearGradient>
      </Defs>

      {/* Shield body */}
      <Path
        d="M20 2L4 10V22C4 30.5 11 37 20 39C29 37 36 30.5 36 22V10L20 2Z"
        fill="url(#logo-grad)"
      />

      {/* Inner shield highlight */}
      <Path
        d="M20 5L7 12V22C7 28.9 12.8 34.5 20 36.5C27.2 34.5 33 28.9 33 22V12L20 5Z"
        fill="none"
        stroke="white"
        strokeWidth={0.8}
        strokeOpacity={0.3}
      />

      {/* Net/mesh lines inside shield */}
      <Path
        d="M12 16L20 12L28 16M12 22L20 18L28 22M12 28L20 24L28 28"
        stroke="white"
        strokeWidth={1.2}
        strokeOpacity={0.4}
        strokeLinecap="round"
      />
      <Path
        d="M12 16V28M20 12V30M28 16V28"
        stroke="white"
        strokeWidth={1.2}
        strokeOpacity={0.3}
        strokeLinecap="round"
      />

      {/* Gold accent — small football/star at center */}
      <Circle cx={20} cy={20} r={4} fill="url(#logo-gold)" />
      <Circle
        cx={20}
        cy={20}
        r={4}
        fill="none"
        stroke="white"
        strokeWidth={0.6}
        strokeOpacity={0.5}
      />
    </Svg>
  );
}

export function Logo({ size = 48, variant = "full", style }: LogoProps) {
  if (variant === "icon") {
    return (
      <View style={style}>
        <ShieldIcon size={size} />
      </View>
    );
  }

  // variant === 'full': shield + "PICHICHI" wordmark
  return (
    <View
      style={[
        { flexDirection: "column", alignItems: "center", gap: 4 },
        style,
      ]}
    >
      <ShieldIcon size={size} />
      <Text
        style={{
          fontSize: size * 0.35,
          fontWeight: "800",
          letterSpacing: 2,
          color: "#0B6E4F",
        }}
      >
        PICHICHI
      </Text>
    </View>
  );
}

export default Logo;
