/**
 * ScorePredictionModal — slide-up modal for entering/editing a match score prediction.
 *
 * Displays match info (phase, date) + unified ScoreInput (logos, names, steppers) + save button.
 * Pre-fills from existing prediction when editing (R6).
 * Re-checks lock boundary before mutation submit (S12).
 *
 * IMPORTANT — NativeWind v4 ghost-card fix:
 * ALL visual properties live in StyleSheet. Never mix `style` and `className`
 * on the same element.
 */

import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ScoreInput } from '@/components/predictions/score-input';
import { useUpsertPrediction } from '@/hooks/use-predictions';
import { formatMatchDateTime, isMatchLocked, PHASE_LABELS } from '@/utils/match-helpers';
import { COLORS } from '@/theme/colors';

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
      <View style={styles.root}>
        {/* Header bar */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pronóstico</Text>
          <Pressable onPress={handleClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>

        {/* Match info */}
        <View style={styles.matchInfo}>
          <Text style={styles.phaseText}>{phaseLabel}</Text>
          <Text style={styles.dateText}>{dateLabel}</Text>
        </View>

        {/* Score Input — unified section with logos, names & steppers */}
        <View style={styles.scoreSection}>
          <ScoreInput
            homeTeamName={homeTeamName}
            awayTeamName={awayTeamName}
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
            homeScore={homeScore}
            awayScore={awayScore}
            onHomeChange={setHomeScore}
            onAwayChange={setAwayScore}
            disabled={upsertPrediction.isPending}
          />
        </View>

        {/* Footer — sits right below the score input with proper spacing */}
        <View style={styles.footer}>
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

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  cancelButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.primary.DEFAULT,
  },

  // ── Match info ──────────────────────────────────────────────────────────
  matchInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 0,
  },
  phaseText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.text.muted,
    marginTop: 4,
  },

  // ── Score section ───────────────────────────────────────────────────────
  scoreSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },

  // ── Footer ──────────────────────────────────────────────────────────────
  footer: {
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 16,
  },
});
