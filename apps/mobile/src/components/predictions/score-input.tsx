/**
 * ScoreInput — unified team + score section for match prediction.
 *
 *    [🛡️ 40px]              [🛡️ 40px]
 *  Estudiantes L.P.          Cusco
 *     [- 0 +]    –    [- 0 +]
 *
 * Each team column shows: avatar → name → stepper, all centered.
 * An en-dash sits between the two steppers, vertically aligned.
 *
 * IMPORTANT — NativeWind v4 ghost-card fix:
 * ALL visual properties live in StyleSheet. Never mix `style` and `className`
 * on the same element.
 */

import { StyleSheet, Text, View } from 'react-native';

import { Stepper } from '@/components/ui/stepper';
import { TeamAvatar } from '@/components/ui/team-avatar';
import { COLORS } from '@/theme/colors';

import type { MatchTeamDto } from '@pichichi/shared';

// ─── Props ──────────────────────────────────────────────────────────────────

interface ScoreInputProps {
  homeTeamName: string;
  awayTeamName: string;
  homeTeam?: MatchTeamDto | null;
  awayTeam?: MatchTeamDto | null;
  homeScore: number;
  awayScore: number;
  onHomeChange: (value: number) => void;
  onAwayChange: (value: number) => void;
  disabled?: boolean;
  minScore?: number;
  maxScore?: number;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ScoreInput({
  homeTeamName,
  awayTeamName,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  onHomeChange,
  onAwayChange,
  disabled = false,
  minScore = 0,
  maxScore = 20,
}: ScoreInputProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.columnsRow, disabled ? styles.disabled : undefined]}>
        {/* Home team column */}
        <View style={styles.teamColumn}>
          <TeamAvatar team={homeTeam ?? null} size={40} />
          <Text
            style={styles.teamName}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {homeTeamName}
          </Text>
          <View
            style={styles.stepperWrapper}
            pointerEvents={disabled ? 'none' : 'auto'}
          >
            <Stepper
              value={homeScore}
              min={minScore}
              max={maxScore}
              onChange={onHomeChange}
            />
          </View>
        </View>

        {/* En-dash separator — vertically aligned with steppers */}
        <View style={styles.separatorWrapper}>
          <Text style={styles.dashText}>–</Text>
        </View>

        {/* Away team column */}
        <View style={styles.teamColumn}>
          <TeamAvatar team={awayTeam ?? null} size={40} />
          <Text
            style={styles.teamName}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {awayTeamName}
          </Text>
          <View
            style={styles.stepperWrapper}
            pointerEvents={disabled ? 'none' : 'auto'}
          >
            <Stepper
              value={awayScore}
              min={minScore}
              max={maxScore}
              onChange={onAwayChange}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },

  // ── Main row with both columns + separator ──────────────────────────────
  columnsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },

  // ── Individual team column ──────────────────────────────────────────────
  teamColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  stepperWrapper: {
    alignItems: 'center',
  },

  // ── En-dash separator ───────────────────────────────────────────────────
  separatorWrapper: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 10,
  },
  dashText: {
    fontSize: 18,
    fontWeight: '400',
    color: COLORS.text.muted,
  },
});
