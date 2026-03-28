/**
 * Reusable Button component with NativeWind styling.
 *
 * Variants: primary, outline, google, apple, gradient.
 * Supports loading + disabled states.
 *
 * The gradient variant uses expo-linear-gradient with a safe fallback
 * to a plain View if the native module is unavailable.
 */

import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { COLORS } from '@/theme/colors';

// Lazy-load LinearGradient to avoid crashing the entire module if the
// native module is unavailable. Non-gradient variants work without it.
let LinearGradientComponent: React.ComponentType<{
  colors: readonly string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  className?: string;
  children?: React.ReactNode;
}> | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  LinearGradientComponent = require('expo-linear-gradient').LinearGradient;
} catch {
  console.warn(
    '[Button] expo-linear-gradient is unavailable — gradient variant will use plain background.',
  );
}

const VARIANT = {
  primary: 'primary',
  outline: 'outline',
  google: 'google',
  apple: 'apple',
  gradient: 'gradient',
} as const;

type Variant = (typeof VARIANT)[keyof typeof VARIANT];

interface ButtonProps extends Omit<import('react-native').PressableProps, 'children'> {
  title: string;
  variant?: Variant;
  loading?: boolean;
}

const CONTAINER_CLASSES: Record<Variant, string> = {
  primary:
    'flex-row items-center justify-center rounded-xl bg-primary px-6 py-4',
  outline:
    'flex-row items-center justify-center rounded-xl border border-primary bg-transparent px-6 py-4',
  google:
    'flex-row items-center justify-center rounded-xl bg-white border border-border px-6 py-4',
  apple:
    'flex-row items-center justify-center rounded-xl bg-black px-6 py-4',
  gradient:
    'overflow-hidden rounded-xl',
};

const TEXT_CLASSES: Record<Variant, string> = {
  primary: 'text-base font-semibold text-white',
  outline: 'text-base font-semibold text-primary',
  google: 'text-base font-semibold text-text-primary',
  apple: 'text-base font-semibold text-white',
  gradient: 'text-base font-bold text-white',
};

const SPINNER_COLORS: Record<Variant, string> = {
  primary: '#FFFFFF',
  outline: COLORS.primary.DEFAULT,
  google: COLORS.text.primary,
  apple: '#FFFFFF',
  gradient: '#FFFFFF',
};

function ButtonContent({
  variant,
  loading,
  title,
}: {
  variant: Variant;
  loading: boolean;
  title: string;
}) {
  return (
    <>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={SPINNER_COLORS[variant]}
          className="mr-2"
        />
      ) : null}
      <Text className={TEXT_CLASSES[variant]}>{title}</Text>
    </>
  );
}

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  if (variant === 'gradient') {
    const Gradient = LinearGradientComponent;

    return (
      <Pressable
        className={`${CONTAINER_CLASSES.gradient} ${isDisabled ? 'opacity-50' : ''}`}
        disabled={isDisabled}
        {...rest}
      >
        {Gradient ? (
          <Gradient
            colors={['#0B6E4F', '#0a5e43']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="flex-row items-center justify-center px-6 py-4"
          >
            <ButtonContent variant={variant} loading={loading} title={title} />
          </Gradient>
        ) : (
          <View className="flex-row items-center justify-center bg-primary px-6 py-4">
            <ButtonContent variant={variant} loading={loading} title={title} />
          </View>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      className={`${CONTAINER_CLASSES[variant]} ${isDisabled ? 'opacity-50' : ''}`}
      disabled={isDisabled}
      {...rest}
    >
      <ButtonContent variant={variant} loading={loading} title={title} />
    </Pressable>
  );
}
