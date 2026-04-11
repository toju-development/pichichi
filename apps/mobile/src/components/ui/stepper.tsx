/**
 * Stepper — increment/decrement control for numeric values.
 *
 * [ - ]  12  [ + ]
 *
 * Respects min/max boundaries. Buttons auto-disable at limits.
 * The minus button has a light outline style; the plus button
 * uses the green accent background.
 *
 * IMPORTANT — NativeWind v4 ghost-card fix:
 * ALL visual properties live in StyleSheet. Never mix `style` and `className`
 * on the same element.
 */

import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

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
    <View style={styles.row}>
      <Pressable
        onPress={decrement}
        disabled={atMin}
        style={[styles.button, styles.minusButton, atMin ? styles.disabledButton : undefined]}
      >
        <Text style={[styles.minusText, atMin ? styles.disabledText : undefined]}>
          −
        </Text>
      </Pressable>

      <View style={styles.valueContainer}>
        <Text style={styles.valueText}>{value}</Text>
      </View>

      <Pressable
        onPress={increment}
        disabled={atMax}
        style={[styles.button, styles.plusButton, atMax ? styles.disabledButton : undefined]}
      >
        <Text style={[styles.plusText, atMax ? styles.disabledText : undefined]}>
          +
        </Text>
      </Pressable>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },

  // ── Minus button: light outline ───────────────────────────────────────
  minusButton: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  minusText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.secondary,
  },

  // ── Plus button: green accent ─────────────────────────────────────────
  plusButton: {
    backgroundColor: COLORS.primary.DEFAULT,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary.DEFAULT,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  plusText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── Disabled state ────────────────────────────────────────────────────
  disabledButton: {
    opacity: 0.35,
  },
  disabledText: {
    color: COLORS.text.muted,
  },

  // ── Value display ─────────────────────────────────────────────────────
  valueContainer: {
    minWidth: 36,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  valueText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
});
