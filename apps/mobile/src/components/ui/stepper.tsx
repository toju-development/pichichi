/**
 * Stepper — increment/decrement control for numeric values.
 *
 * [ - ]  12  [ + ]
 *
 * Respects min/max boundaries. Buttons auto-disable at limits.
 * Uses the app's NativeWind + COLORS design system.
 */

import { Pressable, Text, View } from 'react-native';

import { COLORS } from '@/theme/colors';

interface StepperProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

export function Stepper({ value, min, max, step = 1, onChange }: StepperProps) {
  const atMin = value <= min;
  const atMax = value >= max;

  function decrement() {
    if (!atMin) onChange(Math.max(min, value - step));
  }

  function increment() {
    if (!atMax) onChange(Math.min(max, value + step));
  }

  return (
    <View className="flex-row items-center">
      <Pressable
        onPress={decrement}
        disabled={atMin}
        className="h-11 w-11 items-center justify-center rounded-xl border border-border bg-white active:bg-gray-100"
        style={atMin ? { opacity: 0.35 } : undefined}
      >
        <Text
          className="text-xl font-bold"
          style={{ color: atMin ? COLORS.text.muted : COLORS.primary.DEFAULT }}
        >
          −
        </Text>
      </Pressable>

      <View className="mx-4 min-w-[48px] items-center">
        <Text className="text-xl font-bold text-text-primary">{value}</Text>
      </View>

      <Pressable
        onPress={increment}
        disabled={atMax}
        className="h-11 w-11 items-center justify-center rounded-xl border border-border bg-white active:bg-gray-100"
        style={atMax ? { opacity: 0.35 } : undefined}
      >
        <Text
          className="text-xl font-bold"
          style={{ color: atMax ? COLORS.text.muted : COLORS.primary.DEFAULT }}
        >
          +
        </Text>
      </Pressable>
    </View>
  );
}
