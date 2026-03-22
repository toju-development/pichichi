/**
 * Reusable Button component with NativeWind styling.
 *
 * Variants: primary, outline, google, apple.
 * Supports loading + disabled states.
 */

import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from 'react-native';

import { COLORS } from '@/theme/colors';

const VARIANT = {
  primary: 'primary',
  outline: 'outline',
  google: 'google',
  apple: 'apple',
} as const;

type Variant = (typeof VARIANT)[keyof typeof VARIANT];

interface ButtonProps extends Omit<PressableProps, 'children'> {
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
};

const TEXT_CLASSES: Record<Variant, string> = {
  primary: 'text-base font-semibold text-white',
  outline: 'text-base font-semibold text-primary',
  google: 'text-base font-semibold text-text-primary',
  apple: 'text-base font-semibold text-white',
};

const SPINNER_COLORS: Record<Variant, string> = {
  primary: '#FFFFFF',
  outline: COLORS.primary.DEFAULT,
  google: COLORS.text.primary,
  apple: '#FFFFFF',
};

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      className={`${CONTAINER_CLASSES[variant]} ${isDisabled ? 'opacity-50' : ''}`}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={SPINNER_COLORS[variant]}
          className="mr-2"
        />
      ) : null}
      <Text className={TEXT_CLASSES[variant]}>{title}</Text>
    </Pressable>
  );
}
