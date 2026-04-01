/**
 * ScorePredictionModal — slide-up modal for entering/editing a match score prediction.
 *
 * Displays match info (teams, date, phase) + dual-stepper ScoreInput + save button.
 * Pre-fills from existing prediction when editing (R6).
 * Re-checks lock boundary before mutation submit (S12).
 *
 * NativeWind v4 rule: className-only — NEVER mix style + className.
 */

import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ScoreInput } from '@/components/predictions/score-input';
import { useUpsertPrediction } from '@/hooks/use-predictions';
import { formatMatchDateTime, isMatchLocked, PHASE_LABELS } from '@/utils/match-helpers';

import type { MatchDto, PredictionDto } from '@pichichi/shared';

// ─── Props ──────────────────────────────────────────────────────────────────

interface ScorePredictionModalProps {
  visible: boolean;
  onClose: () => void;
  match: MatchDto | null;
  prediction: PredictionDto | null | undefined;
  groupId: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ScorePredictionModal({
  visible,
  onClose,
  match,
  prediction,
  groupId,
}: ScorePredictionModalProps) {
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);

  const upsertPrediction = useUpsertPrediction();

  // Pre-fill scores from existing prediction or reset to 0-0 (R6, S4)
  useEffect(() => {
    if (visible && prediction) {
      setHomeScore(prediction.predictedHome);
      setAwayScore(prediction.predictedAway);
    } else if (visible) {
      setHomeScore(0);
      setAwayScore(0);
    }
  }, [visible, prediction]);

  function handleClose() {
    upsertPrediction.reset();
    onClose();
  }

  function handleSubmit() {
    if (!match) return;

    // Re-check lock boundary before submit (S12)
    if (isMatchLocked(match)) {
      Alert.alert('Pronóstico cerrado', 'Este partido ya no acepta pronósticos.');
      handleClose();
      return;
    }

    upsertPrediction.mutate(
      {
        matchId: match.id,
        groupId,
        predictedHome: homeScore,
        predictedAway: awayScore,
      },
      {
        onSuccess: () => {
          handleClose();
        },
        onError: (err: unknown) => {
          console.error('[ScorePredictionModal] Error:', err);
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

  // Don't render body when no match (modal is hidden)
  if (!match) return null;

  const homeTeamName =
    match.homeTeam?.name ?? match.homeTeamPlaceholder ?? 'Local';
  const awayTeamName =
    match.awayTeam?.name ?? match.awayTeamPlaceholder ?? 'Visitante';

  const phaseLabel = PHASE_LABELS[match.phase] ?? match.phase;
  const dateLabel = formatMatchDateTime(match.scheduledAt);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-border px-5 pb-4 pt-5">
          <Text className="text-xl font-bold text-text-primary">
            Pronóstico
          </Text>
          <Pressable onPress={handleClose} className="active:opacity-70">
            <Text className="text-base font-medium text-primary">
              Cancelar
            </Text>
          </Pressable>
        </View>

        {/* Match info */}
        <View className="items-center px-5 pt-6">
          <Text className="text-sm text-text-secondary">{phaseLabel}</Text>
          <Text className="mt-1 text-xs text-text-muted">{dateLabel}</Text>

          <Text className="mt-5 text-center text-lg font-bold text-text-primary">
            {homeTeamName}
          </Text>
          <Text className="my-1 text-sm text-text-muted">vs</Text>
          <Text className="text-center text-lg font-bold text-text-primary">
            {awayTeamName}
          </Text>
        </View>

        {/* Score Input */}
        <View className="mt-8 px-5">
          <ScoreInput
            homeTeamName={homeTeamName}
            awayTeamName={awayTeamName}
            homeScore={homeScore}
            awayScore={awayScore}
            onHomeChange={setHomeScore}
            onAwayChange={setAwayScore}
            disabled={upsertPrediction.isPending}
          />
        </View>

        {/* Spacer */}
        <View className="flex-1" />

        {/* Footer */}
        <View className="border-t border-border px-5 pb-8 pt-4">
          <Button
            title="Guardar pronóstico"
            variant="primary"
            loading={upsertPrediction.isPending}
            disabled={upsertPrediction.isPending}
            onPress={handleSubmit}
          />
        </View>
      </View>
    </Modal>
  );
}
