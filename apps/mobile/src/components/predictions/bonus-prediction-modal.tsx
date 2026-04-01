/**
 * BonusPredictionModal — slide-up modal for entering/editing a bonus prediction.
 *
 * Displays category label + TextInput for the predicted value (team/player name)
 * + points reward info + save button.
 * Pre-fills from existing prediction when editing.
 * Uses `useUpsertBonusPrediction` hook for submission.
 *
 * NativeWind v4 rule: className-only — NEVER mix style + className.
 */

import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button } from '@/components/ui/button';
import { useUpsertBonusPrediction } from '@/hooks/use-bonus-predictions';
import { COLORS } from '@/theme/colors';

// ─── Constants ──────────────────────────────────────────────────────────────

const MAX_VALUE_LENGTH = 100;
const BONUS_POINTS = 10;

// ─── Props ──────────────────────────────────────────────────────────────────

interface BonusPredictionModalProps {
  visible: boolean;
  onClose: () => void;
  category: string | null;
  categoryLabel: string | null;
  currentValue: string | null;
  groupId: string;
  tournamentId: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function BonusPredictionModal({
  visible,
  onClose,
  category,
  categoryLabel,
  currentValue,
  groupId,
}: BonusPredictionModalProps) {
  const [value, setValue] = useState('');

  const upsertBonusPrediction = useUpsertBonusPrediction();

  // Pre-fill from existing prediction or reset when modal opens
  useEffect(() => {
    if (visible && currentValue) {
      setValue(currentValue);
    } else if (visible) {
      setValue('');
    }
  }, [visible, currentValue]);

  function handleClose() {
    upsertBonusPrediction.reset();
    onClose();
  }

  function handleSubmit() {
    if (!category) return;

    const trimmedValue = value.trim();

    if (!trimmedValue) {
      Alert.alert('Campo vacío', 'Ingresá tu pronóstico antes de guardar.');
      return;
    }

    upsertBonusPrediction.mutate(
      {
        groupId,
        bonusTypeId: category,
        predictedValue: trimmedValue,
      },
      {
        onSuccess: () => {
          handleClose();
        },
        onError: (err: unknown) => {
          console.error('[BonusPredictionModal] Error:', err);
          const axiosErr = err as {
            response?: { data?: { message?: string } };
          };

          Alert.alert(
            'Error al guardar',
            axiosErr?.response?.data?.message ??
              'No se pudo guardar el pronóstico. Intentá de nuevo.',
          );
        },
      },
    );
  }

  // Don't render body when no category (modal is hidden)
  if (!category) return null;

  const displayLabel = categoryLabel ?? 'Pronóstico bonus';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-background"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-border px-5 pb-4 pt-5">
          <Text className="text-xl font-bold text-text-primary">
            {displayLabel}
          </Text>
          <Pressable onPress={handleClose} className="active:opacity-70">
            <Text className="text-base font-medium text-primary">
              Cancelar
            </Text>
          </Pressable>
        </View>

        {/* Body */}
        <View className="flex-1 px-5 pt-6">
          {/* Points info */}
          <View className="mb-6 items-center rounded-xl bg-primary-light px-4 py-3">
            <Text className="text-sm font-semibold text-primary">
              🏆 {BONUS_POINTS} pts si acertás
            </Text>
          </View>

          {/* Input label */}
          <Text className="mb-2 text-sm font-semibold text-text-primary">
            Tu pronóstico
          </Text>

          {/* Text input */}
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder={getPlaceholder(categoryLabel)}
            placeholderTextColor={COLORS.text.muted}
            maxLength={MAX_VALUE_LENGTH}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!upsertBonusPrediction.isPending}
            className="mb-1 rounded-xl border border-border bg-white px-4 py-3 text-base text-text-primary"
          />
          <Text className="mb-5 text-xs text-text-muted">
            {value.length}/{MAX_VALUE_LENGTH}
          </Text>
        </View>

        {/* Footer */}
        <View className="border-t border-border px-5 pb-8 pt-4">
          <Button
            title="Guardar pronóstico"
            variant="primary"
            loading={upsertBonusPrediction.isPending}
            disabled={!value.trim() || upsertBonusPrediction.isPending}
            onPress={handleSubmit}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getPlaceholder(categoryLabel: string | null): string {
  switch (categoryLabel) {
    case 'Campeón':
      return 'Ej: Argentina';
    case 'Goleador':
      return 'Ej: Lionel Messi';
    case 'MVP':
      return 'Ej: Kylian Mbappé';
    case 'Revelación':
      return 'Ej: Marruecos';
    default:
      return 'Ingresá tu pronóstico';
  }
}
