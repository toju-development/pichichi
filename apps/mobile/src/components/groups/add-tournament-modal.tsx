/**
 * Modal to add a tournament to a group.
 *
 * Shows available tournaments (those NOT already associated) and lets
 * the admin tap "Agregar" to link one to the group.
 * Handles 403 plan-limit errors with a friendly message.
 */

import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { TrophyIcon } from '@/components/brand/icons';
import { Button } from '@/components/ui/button';
import { useAddTournament } from '@/hooks/use-groups';
import { useTournaments } from '@/hooks/use-tournaments';
import { COLORS } from '@/theme/colors';
import {
  TOURNAMENT_STATUS_LABELS,
  TOURNAMENT_TYPE_LABELS,
} from '@/utils/match-helpers';

import type { TournamentDto } from '@pichichi/shared';

// ─── Props ──────────────────────────────────────────────────────────────────

interface AddTournamentModalProps {
  visible: boolean;
  groupId: string;
  /** Already-associated tournament IDs to filter out from the list */
  currentTournamentIds: string[];
  onClose: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function AddTournamentModal({
  visible,
  groupId,
  currentTournamentIds,
  onClose,
}: AddTournamentModalProps) {
  const { data: allTournaments, isLoading } = useTournaments();
  const addTournament = useAddTournament();

  const availableTournaments =
    allTournaments?.filter((t) => !currentTournamentIds.includes(t.id)) ?? [];

  function handleAdd(tournamentId: string) {
    addTournament.mutate(
      { groupId, tournamentId },
      {
        onSuccess: () => {
          Alert.alert('Listo', 'Torneo agregado al grupo.');
          onClose();
        },
        onError: (err: unknown) => {
          console.error(
            '[AddTournament] Error:',
            JSON.stringify(err, null, 2),
          );
          const axiosErr = err as {
            response?: { data?: { message?: string }; status?: number };
          };
          const status = axiosErr?.response?.status;

          if (status === 403) {
            Alert.alert(
              'Límite alcanzado',
              axiosErr?.response?.data?.message ??
                'Alcanzaste el límite de torneos de tu plan.',
            );
            return;
          }

          Alert.alert(
            'Error',
            axiosErr?.response?.data?.message ??
              'No se pudo agregar el torneo. Intentá de nuevo.',
          );
        },
      },
    );
  }

  function renderTournamentRow({ item }: { item: TournamentDto }) {
    const typeLabel = TOURNAMENT_TYPE_LABELS[item.type] ?? item.type;
    const statusLabel = TOURNAMENT_STATUS_LABELS[item.status] ?? item.status;

    return (
      <View style={styles.row}>
        <View style={styles.rowIcon}>
          <TrophyIcon size={28} color={COLORS.primary.DEFAULT} />
        </View>

        <View style={styles.rowContent}>
          <Text style={styles.rowName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {typeLabel} · {statusLabel}
          </Text>
        </View>

        <Button
          title="Agregar"
          variant="outline"
          loading={addTournament.isPending}
          disabled={addTournament.isPending}
          onPress={() => handleAdd(item.id)}
        />
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-background"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-border px-5 pb-4 pt-5">
          <Text className="text-xl font-bold text-text-primary">
            Agregar torneo
          </Text>
          <Pressable onPress={onClose} className="active:opacity-70">
            <Text className="text-base font-medium text-primary">
              Cancelar
            </Text>
          </Pressable>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
          </View>
        ) : availableTournaments.length === 0 ? (
          <View style={styles.centered}>
            <TrophyIcon size={48} color={COLORS.text.muted} />
            <Text style={styles.emptyTitle}>No hay torneos disponibles</Text>
            <Text style={styles.emptySubtitle}>
              Todos los torneos ya están agregados a este grupo.
            </Text>
          </View>
        ) : (
          <FlatList
            data={availableTournaments}
            keyExtractor={(item) => item.id}
            renderItem={renderTournamentRow}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={Separator}
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Separator ──────────────────────────────────────────────────────────────

function Separator() {
  return <View style={styles.separator} />;
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowContent: {
    flex: 1,
    marginRight: 12,
  },
  rowName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  rowMeta: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  separator: {
    height: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 6,
    textAlign: 'center',
  },
});
