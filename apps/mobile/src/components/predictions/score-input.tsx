/**
 * ScoreInput — dual-stepper control for entering a match score prediction.
 *
 *   [Home Team]         [Away Team]
 *     [- 0 +]    VS      [- 0 +]
 *
 * Composes two `Stepper` instances side-by-side with team name labels
 * and a centered "VS" separator.
 *
 * NativeWind v4 rule: className-only — NEVER mix style + className.
 */

import { Text, View } from 'react-native';

import { Stepper } from '@/components/ui/stepper';

// ─── Props ──────────────────────────────────────────────────────────────────

interface ScoreInputProps {
  homeTeamName: string;
  awayTeamName: string;
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
  homeScore,
  awayScore,
  onHomeChange,
  onAwayChange,
  disabled = false,
  minScore = 0,
  maxScore = 20,
}: ScoreInputProps) {
  return (
    <View className="items-center gap-3">
      {/* Team name labels */}
      <View className="w-full flex-row items-center justify-between px-2">
        <View className="flex-1 items-center">
          <Text
            className="text-sm font-semibold text-text-primary"
            numberOfLines={1}
          >
            {homeTeamName}
          </Text>
        </View>

        {/* Spacer matching VS width */}
        <View className="mx-3 w-10" />

        <View className="flex-1 items-center">
          <Text
            className="text-sm font-semibold text-text-primary"
            numberOfLines={1}
          >
            {awayTeamName}
          </Text>
        </View>
      </View>

      {/* Steppers + VS separator */}
      <View className={`flex-row items-center ${disabled ? 'opacity-50' : ''}`}>
        <View className="items-center" pointerEvents={disabled ? 'none' : 'auto'}>
          <Stepper
            value={homeScore}
            min={minScore}
            max={maxScore}
            onChange={onHomeChange}
          />
        </View>

        <View className="mx-3 w-10 items-center">
          <Text className="text-base font-medium text-text-muted">VS</Text>
        </View>

        <View className="items-center" pointerEvents={disabled ? 'none' : 'auto'}>
          <Stepper
            value={awayScore}
            min={minScore}
            max={maxScore}
            onChange={onAwayChange}
          />
        </View>
      </View>
    </View>
  );
}
