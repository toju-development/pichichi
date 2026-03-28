/**
 * Stepper — increment/decrement control for numeric values.
 *
 * [ - ]  12  [ + ]
 *
 * Respects min/max boundaries. Buttons auto-disable at limits.
 * Uses the app's NativeWind design system.
 *
 * NativeWind v4 rule: NEVER mix style + className on the same element.
 * Dynamic states (disabled opacity, conditional colors) use className-only.
 */

import { Pressable, Text, View } from 'react-native';

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
        className={`h-11 w-11 items-center justify-center rounded-xl border border-border bg-white active:bg-gray-100 ${atMin ? 'opacity-35' : ''}`}
      >
        <Text
          className={`text-xl font-bold ${atMin ? 'text-text-muted' : 'text-primary'}`}
        >
          −
        </Text>
      </Pressable>

      <View className="mx-2 min-w-[36px] items-center">
        <Text className="text-xl font-bold text-text-primary">{value}</Text>
      </View>

      <Pressable
        onPress={increment}
        disabled={atMax}
        className={`h-11 w-11 items-center justify-center rounded-xl border border-border bg-white active:bg-gray-100 ${atMax ? 'opacity-35' : ''}`}
      >
        <Text
          className={`text-xl font-bold ${atMax ? 'text-text-muted' : 'text-primary'}`}
        >
          +
        </Text>
      </Pressable>
    </View>
  );
}
