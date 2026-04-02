/**
 * BonusPredictionModal — slide-up modal for picking a bonus prediction.
 *
 * Replaces the old TextInput approach with structured FlatList pickers:
 * - Team mode (CHAMPION/REVELATION): single-step team FlatList
 * - Player mode (TOP_SCORER/MVP): two-step flow (team → player)
 *
 * Receives teams[] and players[] as props from the parent (BonusSection).
 * Stores `String(externalId)` as the predictedValue — NOT names.
 * Filters out entities without externalId.
 *
 * NativeWind v4 rule: className-only — NEVER mix style + className.
 */

import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';

import type {
  TournamentPlayerResponseDto,
  TournamentTeamDto,
} from '@pichichi/shared';

import { useUpsertBonusPrediction } from '@/hooks/use-bonus-predictions';
import { COLORS } from '@/theme/colors';

// ─── Constants ──────────────────────────────────────────────────────────────

const BONUS_TYPE_KEY = {
  CHAMPION: 'CHAMPION',
  TOP_SCORER: 'TOP_SCORER',
  MVP: 'MVP',
  REVELATION: 'REVELATION',
} as const;

type BonusTypeKey = (typeof BONUS_TYPE_KEY)[keyof typeof BONUS_TYPE_KEY];

const PICKER_MODE = {
  TEAM: 'team',
  PLAYER: 'player',
} as const;

type PickerMode = (typeof PICKER_MODE)[keyof typeof PICKER_MODE];

const PICKER_STEP = {
  TEAM_LIST: 'team-list',
  PLAYER_SELECT: 'player-select',
} as const;

type PickerStep = (typeof PICKER_STEP)[keyof typeof PICKER_STEP];

/** Maps bonusTypeKey → picker mode */
const KEY_TO_MODE: Record<string, PickerMode> = {
  [BONUS_TYPE_KEY.CHAMPION]: PICKER_MODE.TEAM,
  [BONUS_TYPE_KEY.REVELATION]: PICKER_MODE.TEAM,
  [BONUS_TYPE_KEY.TOP_SCORER]: PICKER_MODE.PLAYER,
  [BONUS_TYPE_KEY.MVP]: PICKER_MODE.PLAYER,
};

// ─── Props ──────────────────────────────────────────────────────────────────

interface BonusPredictionModalProps {
  visible: boolean;
  onClose: () => void;
  bonusTypeId: string | null;
  bonusTypeKey: string | null;
  bonusTypeLabel: string | null;
  currentValue: string | null;
  groupId: string;
  tournamentId: string;
  teams: TournamentTeamDto[];
  players: TournamentPlayerResponseDto[];
  isPlayersLoading: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function BonusPredictionModal({
  visible,
  onClose,
  bonusTypeId,
  bonusTypeKey,
  bonusTypeLabel,
  currentValue,
  groupId,
  teams,
  players,
  isPlayersLoading,
}: BonusPredictionModalProps) {
  const [step, setStep] = useState<PickerStep>(PICKER_STEP.TEAM_LIST);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const upsertBonusPrediction = useUpsertBonusPrediction();

  // ── Derived state ───────────────────────────────────────────────────────

  const mode: PickerMode = bonusTypeKey
    ? (KEY_TO_MODE[bonusTypeKey.toUpperCase()] ?? PICKER_MODE.TEAM)
    : PICKER_MODE.TEAM;

  const displayLabel = bonusTypeLabel ?? 'Pronóstico bonus';

  // Filter out teams without externalId, sort alphabetically
  const filteredTeams = teams
    .filter((t) => t.externalId != null)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Filter players for selected team, exclude those without externalId
  const filteredPlayers = selectedTeamId
    ? players
        .filter((p) => p.teamId === selectedTeamId && p.externalId != null)
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  const selectedTeam = selectedTeamId
    ? filteredTeams.find((t) => t.teamId === selectedTeamId) ?? null
    : null;

  // ── Blocked state checks ────────────────────────────────────────────────

  const isTeamsBlocked = filteredTeams.length === 0;
  const isPlayersBlocked =
    mode === PICKER_MODE.PLAYER &&
    step === PICKER_STEP.PLAYER_SELECT &&
    filteredPlayers.length === 0 &&
    !isPlayersLoading;

  // ── Handlers ────────────────────────────────────────────────────────────

  function resetState() {
    setStep(PICKER_STEP.TEAM_LIST);
    setSelectedTeamId(null);
    upsertBonusPrediction.reset();
  }

  function handleClose() {
    resetState();
    onClose();
  }

  function handleTeamSelect(team: TournamentTeamDto) {
    if (mode === PICKER_MODE.TEAM) {
      // Direct team selection — submit immediately
      submitPrediction(String(team.externalId));
    } else {
      // Player mode — go to step 2
      setSelectedTeamId(team.teamId);
      setStep(PICKER_STEP.PLAYER_SELECT);
    }
  }

  function handlePlayerSelect(player: TournamentPlayerResponseDto) {
    submitPrediction(String(player.externalId));
  }

  function handleBackToTeams() {
    setSelectedTeamId(null);
    setStep(PICKER_STEP.TEAM_LIST);
  }

  function submitPrediction(predictedValue: string) {
    if (!bonusTypeId) return;

    upsertBonusPrediction.mutate(
      {
        groupId,
        bonusTypeId,
        predictedValue,
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

  // ── Don't render when no bonusTypeId ─────────────────────────────────────

  if (!bonusTypeId) return null;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-background">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <View className="flex-row items-center justify-between border-b border-border px-5 pb-4 pt-5">
          <Text className="text-xl font-bold text-text-primary">
            {displayLabel}
          </Text>
          <Pressable onPress={handleClose} className="active:opacity-70">
            <Text className="text-base font-medium text-primary">
              Cerrar
            </Text>
          </Pressable>
        </View>

        {/* ── Sub-header for player step 2 (back + team name) ─────── */}
        {mode === PICKER_MODE.PLAYER &&
          step === PICKER_STEP.PLAYER_SELECT &&
          selectedTeam && (
            <View className="flex-row items-center border-b border-border px-5 py-3">
              <Pressable
                onPress={handleBackToTeams}
                className="mr-3 active:opacity-70"
              >
                <Text className="text-2xl text-primary">←</Text>
              </Pressable>
              {selectedTeam.logoUrl ? (
                <Image
                  source={{ uri: selectedTeam.logoUrl }}
                  className="mr-2 h-4 w-6 rounded-sm"
                  resizeMode="cover"
                />
              ) : null}
              <Text className="text-base font-semibold text-text-primary">
                {selectedTeam.name}
              </Text>
            </View>
          )}

        {/* ── Saving indicator ────────────────────────────────────── */}
        {upsertBonusPrediction.isPending && (
          <View className="items-center py-4">
            <ActivityIndicator size="small" color={COLORS.primary.DEFAULT} />
            <Text className="mt-1 text-sm text-text-muted">
              Guardando...
            </Text>
          </View>
        )}

        {/* ── Body content ────────────────────────────────────────── */}
        {step === PICKER_STEP.TEAM_LIST && (
          <TeamList
            teams={filteredTeams}
            currentValue={currentValue}
            isBlocked={isTeamsBlocked}
            isSubmitting={upsertBonusPrediction.isPending}
            showSelectHint={mode === PICKER_MODE.PLAYER}
            onSelect={handleTeamSelect}
          />
        )}

        {step === PICKER_STEP.PLAYER_SELECT && (
          <PlayerList
            players={filteredPlayers}
            currentValue={currentValue}
            isBlocked={isPlayersBlocked}
            isLoading={isPlayersLoading}
            isSubmitting={upsertBonusPrediction.isPending}
            onSelect={handlePlayerSelect}
          />
        )}
      </View>
    </Modal>
  );
}

// ─── TeamList sub-component ─────────────────────────────────────────────────

interface TeamListProps {
  teams: TournamentTeamDto[];
  currentValue: string | null;
  isBlocked: boolean;
  isSubmitting: boolean;
  /** Show "Elegí un equipo" hint (player mode step 1) */
  showSelectHint: boolean;
  onSelect: (team: TournamentTeamDto) => void;
}

function TeamList({
  teams,
  currentValue,
  isBlocked,
  isSubmitting,
  showSelectHint,
  onSelect,
}: TeamListProps) {
  if (isBlocked) {
    return (
      <View className="flex-1 items-center justify-center px-5">
        <Text className="text-base text-text-muted">
          Equipos no disponibles
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={teams}
      keyExtractor={(item) => item.teamId}
      className="flex-1"
      contentContainerClassName="px-5 py-3"
      ListHeaderComponent={
        showSelectHint ? (
          <Text className="mb-3 text-sm text-text-secondary">
            Elegí un equipo para ver sus jugadores
          </Text>
        ) : null
      }
      renderItem={({ item }) => {
        const isSelected =
          currentValue != null && currentValue === String(item.externalId);

        return (
          <Pressable
            onPress={() => onSelect(item)}
            disabled={isSubmitting}
            className={`mb-2 flex-row items-center rounded-xl px-4 py-3.5 active:opacity-70 ${
              isSelected
                ? 'border border-primary bg-primary-light'
                : 'border border-border bg-white'
            } ${isSubmitting ? 'opacity-50' : ''}`}
          >
            {item.logoUrl ? (
              <Image
                source={{ uri: item.logoUrl }}
                className="mr-3 h-4 w-6 rounded-sm"
                resizeMode="cover"
              />
            ) : (
              <View className="mr-3 h-4 w-6 rounded-sm bg-border" />
            )}
            <Text
              className={`flex-1 text-base font-medium ${
                isSelected ? 'text-primary' : 'text-text-primary'
              }`}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {isSelected && (
              <Text className="text-sm font-semibold text-primary">✓</Text>
            )}
          </Pressable>
        );
      }}
    />
  );
}

// ─── PlayerList sub-component ───────────────────────────────────────────────

interface PlayerListProps {
  players: TournamentPlayerResponseDto[];
  currentValue: string | null;
  isBlocked: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  onSelect: (player: TournamentPlayerResponseDto) => void;
}

/** Maps API position strings to Spanish display labels */
const POSITION_LABELS: Record<string, string> = {
  Goalkeeper: 'Arquero',
  Defender: 'Defensor',
  Midfielder: 'Mediocampista',
  Attacker: 'Delantero',
};

function PlayerList({
  players,
  currentValue,
  isBlocked,
  isLoading,
  isSubmitting,
  onSelect,
}: PlayerListProps) {
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
        <Text className="mt-3 text-sm text-text-muted">
          Cargando jugadores...
        </Text>
      </View>
    );
  }

  if (isBlocked) {
    return (
      <View className="flex-1 items-center justify-center px-5">
        <Text className="text-base text-text-muted">
          Jugadores no disponibles
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={players}
      keyExtractor={(item) => item.id}
      className="flex-1"
      contentContainerClassName="px-5 py-3"
      renderItem={({ item }) => {
        const isSelected =
          currentValue != null && currentValue === String(item.externalId);

        const positionLabel = item.position
          ? (POSITION_LABELS[item.position] ?? item.position)
          : null;

        return (
          <Pressable
            onPress={() => onSelect(item)}
            disabled={isSubmitting}
            className={`mb-2 flex-row items-center rounded-xl px-4 py-3 active:opacity-70 ${
              isSelected
                ? 'border border-primary bg-primary-light'
                : 'border border-border bg-white'
            } ${isSubmitting ? 'opacity-50' : ''}`}
          >
            {/* Player photo */}
            {item.photoUrl ? (
              <Image
                source={{ uri: item.photoUrl }}
                className="mr-3 h-10 w-10 rounded-full bg-border"
                resizeMode="cover"
              />
            ) : (
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-border">
                <Text className="text-sm text-text-muted">⚽</Text>
              </View>
            )}

            {/* Name + position column */}
            <View className="flex-1">
              <Text
                className={`text-base font-medium ${
                  isSelected ? 'text-primary' : 'text-text-primary'
                }`}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              {positionLabel && (
                <Text className="mt-0.5 text-xs text-text-secondary">
                  {positionLabel}
                  {item.shirtNumber != null ? ` · #${item.shirtNumber}` : ''}
                </Text>
              )}
            </View>

            {isSelected && (
              <Text className="text-sm font-semibold text-primary">✓</Text>
            )}
          </Pressable>
        );
      }}
    />
  );
}
