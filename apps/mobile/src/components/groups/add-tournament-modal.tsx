/**
 * Modal to add a tournament to a group.
 *
 * Shows available tournaments (those NOT already associated) and lets
 * the admin tap "Agregar" to link one to the group.
 * Handles 403 plan-limit errors with a friendly message.
 *
 * IMPORTANT — NativeWind v4 ghost-card fix:
 * ALL visual properties use StyleSheet to guarantee rendering on the first
 * frame. className is NEVER used for visual props.
 */

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { TrophyIcon } from '@/components/brand/icons';
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
    const isAdding = addTournament.isPending;

    return (
      <View style={s.card}>
        {/* Left: icon circle + text column */}
        <View style={s.cardLeft}>
          <View style={s.iconCircle}>
            <TrophyIcon size={20} color="#0B6E4F" />
            {item.logoUrl ? (
              <Image
                source={{ uri: item.logoUrl }}
                style={s.tournamentLogoImage}
              />
            ) : null}
          </View>

          <View style={s.cardTextCol}>
            <Text style={s.cardName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={s.cardMeta} numberOfLines={1}>
              {typeLabel} · {statusLabel}
            </Text>
          </View>
        </View>

        {/* Right: "Agregar" outlined button */}
        <View style={[s.addBtnOuter, isAdding && s.addBtnDisabled]}>
          <Pressable
            onPress={() => handleAdd(item.id)}
            disabled={isAdding}
            style={({ pressed }) =>
              pressed ? { opacity: 0.7 } : undefined
            }
          >
            {isAdding ? (
              <ActivityIndicator size="small" color="#0B6E4F" />
            ) : (
              <Text style={s.addBtnText}>Agregar</Text>
            )}
          </Pressable>
        </View>
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
      <View style={s.root}>
        {/* ─── Native drag handle ────────────────────────── */}
        <View style={s.handleContainer}>
          <View style={s.handlePill} />
        </View>

        {/* ─── Header ───────────────────────────────────── */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Agregar torneo</Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) =>
              pressed ? { opacity: 0.7 } : undefined
            }
          >
            <Text style={s.headerCancel}>Cancelar</Text>
          </Pressable>
        </View>

        {/* ─── Content ──────────────────────────────────── */}
        {isLoading ? (
          <View style={s.centered}>
            <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
          </View>
        ) : availableTournaments.length === 0 ? (
          <View style={s.centered}>
            <TrophyIcon size={48} color={COLORS.text.muted} />
            <Text style={s.emptyTitle}>No hay torneos disponibles</Text>
            <Text style={s.emptySubtitle}>
              Todos los torneos ya están agregados a este grupo.
            </Text>
          </View>
        ) : (
          <FlatList
            data={availableTournaments}
            keyExtractor={(item) => item.id}
            renderItem={renderTournamentRow}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F0FAF4',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: 'hidden',
  },

  // Native drag handle
  handleContainer: {
    paddingTop: 8,
    paddingBottom: 4,
    alignItems: 'center',
    backgroundColor: '#F0FAF4',
  },
  handlePill: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F0FAF4',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  headerCancel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0B6E4F',
  },

  // Content
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  list: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 10,
  },

  // Tournament card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#0000000A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tournamentLogoImage: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  cardTextCol: {
    flex: 1,
    gap: 2,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  cardMeta: {
    fontSize: 11,
    color: '#6B7280',
  },

  // "Agregar" outlined button
  addBtnOuter: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0B6E4F',
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B6E4F',
  },

  // Empty state
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },
});
