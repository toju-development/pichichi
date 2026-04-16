/**
 * Modal to create a new group.
 *
 * Slide-up sheet with name, description, tournament selection, and max-members fields.
 * Uses useCreateGroup mutation, then sequentially adds selected tournaments via
 * groupsApi.addTournament, and navigates to the new group on success.
 *
 * IMPORTANT — NativeWind v4 ghost-card fix:
 * ALL visual properties use StyleSheet to guarantee rendering on the first
 * frame. className is NEVER used for visual props.
 *
 * IMPORTANT — Android SafeArea:
 * React Native <Modal> on Android creates a separate window that does NOT
 * inherit the parent SafeAreaProvider. We wrap modal content in its own
 * SafeAreaProvider so useSafeAreaInsets() returns correct values.
 */

import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';

import { TrophyIcon } from '@/components/brand/icons';
import { useCreateGroup } from '@/hooks/use-groups';
import { queryKeys } from '@/hooks/query-keys';
import { useTournaments } from '@/hooks/use-tournaments';
import { useAuthStore } from '@/stores/auth-store';
import { COLORS } from '@/theme/colors';
import {
  TOURNAMENT_STATUS_LABELS,
  TOURNAMENT_TYPE_LABELS,
} from '@/utils/match-helpers';

import * as groupsApi from '@/api/groups';
import type { TournamentDto } from '@pichichi/shared';

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateGroupModal({ visible, onClose }: CreateGroupModalProps) {
  // Read insets from the PARENT SafeAreaProvider — on Android, the Modal
  // creates a separate window where SafeAreaProvider may report bottom = 0
  // because the modal window doesn't inherit edge-to-edge configuration.
  // By reading here and passing as a prop, the CTA always clears the nav bar.
  const parentInsets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <CreateGroupModalContent onClose={onClose} parentBottomInset={parentInsets.bottom} />
      </SafeAreaProvider>
    </Modal>
  );
}

function CreateGroupModalContent({ onClose, parentBottomInset }: { onClose: () => void; parentBottomInset: number }) {
  const planLimit = useAuthStore((s) => s.user?.plan.maxMembersPerGroup ?? 10);
  const insets = useSafeAreaInsets();

  // Use the larger of modal-local insets vs parent insets.
  // On iOS (pageSheet), local insets are correct. On Android, local may be 0
  // so parentBottomInset provides the fallback.
  const bottomInset = Math.max(insets.bottom, parentBottomInset);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxMembers, setMaxMembers] = useState(planLimit);
  const [selectedTournaments, setSelectedTournaments] = useState<string[]>([]);

  const createGroup = useCreateGroup();
  const { data: availableTournaments } = useTournaments();
  const qc = useQueryClient();

  function resetForm() {
    setName('');
    setDescription('');
    setMaxMembers(planLimit);
    setSelectedTournaments([]);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function toggleTournament(id: string) {
    setSelectedTournaments((prev) =>
      prev.includes(id)
        ? prev.filter((t) => t !== id)
        : [...prev, id],
    );
  }

  function handleSubmit() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert('Error', 'El nombre del grupo es obligatorio.');
      return;
    }

    if (trimmedName.length > 100) {
      Alert.alert('Error', 'El nombre no puede tener más de 100 caracteres.');
      return;
    }

    createGroup.mutate(
      {
        name: trimmedName,
        description: description.trim() || undefined,
        maxMembers,
      },
      {
        onSuccess: async (data) => {
          // Add selected tournaments to the new group
          for (const tournamentId of selectedTournaments) {
            try {
              await groupsApi.addTournament(data.id, tournamentId);
            } catch (err) {
              console.warn('[CreateGroup] Failed to add tournament:', tournamentId, err);
              // Don't block navigation — the tournament can be added later
            }
          }

          // Sync tournament cache for the new group
          if (selectedTournaments.length > 0) {
            qc.invalidateQueries({ queryKey: queryKeys.groups.tournaments(data.id) });
          }

          handleClose();
          router.push(`/(tabs)/groups/${data.id}`);
        },
        onError: (err: unknown) => {
          console.error('[CreateGroup] Error:', JSON.stringify(err, null, 2));
          const axiosErr = err as { response?: { data?: { message?: string }; status?: number } };
          const status = axiosErr?.response?.status;

          // Plan limit → friendly message (backend sends 403)
          if (status === 403) {
            Alert.alert(
              'Límite alcanzado',
              axiosErr?.response?.data?.message
                ?? 'Alcanzaste el límite de grupos de tu plan.',
            );
            return;
          }

          Alert.alert(
            'Error',
            axiosErr?.response?.data?.message
              ?? 'No se pudo crear el grupo. Intentá de nuevo.',
          );
        },
      },
    );
  }

  const atMin = maxMembers <= 2;
  const atMax = maxMembers >= planLimit;

  function decrementMembers() {
    if (!atMin) setMaxMembers((v) => Math.max(2, v - 1));
  }

  function incrementMembers() {
    if (!atMax) setMaxMembers((v) => Math.min(planLimit, v + 1));
  }

  return (
      <View style={s.root}>
        {/* ─── Native drag handle ────────────────────────── */}
        <View style={s.handleContainer}>
          <View style={s.handlePill} />
        </View>

        {/* ─── Header ───────────────────────────────────── */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Crear grupo</Text>
          <Pressable onPress={handleClose} style={({ pressed }) => pressed ? { opacity: 0.7 } : undefined}>
            <Text style={s.headerCancel}>Cancelar</Text>
          </Pressable>
        </View>

        {/* ─── Form (scrollable) ────────────────────────── */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.flex1}
        >
          <ScrollView
            style={s.flex1}
            contentContainerStyle={s.formContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Field 1 — Nombre del grupo */}
            <View style={s.fieldGroup}>
              <Text style={s.label}>Nombre del grupo *</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ej: Los cracks del mundial"
                placeholderTextColor="#9CA3AF"
                maxLength={100}
                style={s.textInput}
              />
              <Text style={s.counter}>{name.length}/100</Text>
            </View>

            {/* Field 2 — Descripción */}
            <View style={s.fieldGroup}>
              <Text style={s.label}>Descripción (opcional)</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="¿De qué se trata el grupo?"
                placeholderTextColor="#9CA3AF"
                maxLength={500}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={s.textArea}
              />
              <Text style={s.counter}>{description.length}/500</Text>
            </View>

            {/* Field 3 — Torneos */}
            <View style={s.fieldGroup}>
              <Text style={s.label}>
                Torneos{availableTournaments?.length
                  ? ` (${selectedTournaments.length} de ${availableTournaments.length} seleccionados)`
                  : ''}
              </Text>

              {availableTournaments?.map((tournament: TournamentDto) => {
                const isSelected = selectedTournaments.includes(tournament.id);
                const typeLabel = TOURNAMENT_TYPE_LABELS[tournament.type] ?? tournament.type;
                const statusLabel = TOURNAMENT_STATUS_LABELS[tournament.status] ?? tournament.status;

                return (
                  <View key={tournament.id} style={s.tournamentRowOuter}>
                    <Pressable
                      onPress={() => toggleTournament(tournament.id)}
                      style={({ pressed }) => pressed ? { opacity: 0.7 } : undefined}
                    >
                      <View style={s.tournamentRow}>
                        {/* Left: icon + text */}
                        <View style={s.tournamentLeft}>
                          <TrophyIcon size={24} color={COLORS.primary.DEFAULT} />
                          <View style={s.tournamentTextCol}>
                            <Text style={s.tournamentName} numberOfLines={1}>
                              {tournament.name}
                            </Text>
                            <Text style={s.tournamentMeta} numberOfLines={1}>
                              {typeLabel} · {statusLabel}
                            </Text>
                          </View>
                        </View>

                        {/* Right: circle checkbox */}
                        <View
                          style={[
                            s.checkbox,
                            isSelected && s.checkboxSelected,
                          ]}
                        >
                          {isSelected && (
                            <Check size={14} color="#FFFFFF" strokeWidth={3} />
                          )}
                        </View>
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* Field 4 — Máximo de miembros */}
            <View style={s.fieldGroup}>
              <Text style={s.label}>Máximo de miembros</Text>

              <View style={s.stepperRow}>
                {/* Minus button */}
                <View style={[s.stepperBtn, atMin && s.stepperBtnDisabled]}>
                  <Pressable
                    onPress={decrementMembers}
                    disabled={atMin}
                    style={({ pressed }) => pressed && !atMin ? { opacity: 0.7 } : undefined}
                  >
                    <Text style={[s.stepperBtnText, atMin && s.stepperBtnTextDisabled]}>−</Text>
                  </Pressable>
                </View>

                <Text style={s.stepperValue}>{maxMembers}</Text>

                {/* Plus button */}
                <View style={[s.stepperBtn, atMax && s.stepperBtnDisabled]}>
                  <Pressable
                    onPress={incrementMembers}
                    disabled={atMax}
                    style={({ pressed }) => pressed && !atMax ? { opacity: 0.7 } : undefined}
                  >
                    <Text style={[s.stepperBtnText, atMax && s.stepperBtnTextDisabled]}>+</Text>
                  </Pressable>
                </View>
              </View>

              <Text style={s.helperText}>
                Mínimo 2, máximo {planLimit} (según tu plan)
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* ─── Bottom bar with CTA ──────────────────────── */}
        <View style={[s.bottomBar, { paddingBottom: Math.max(bottomInset, 24) }]}>
          <View style={s.ctaShadow}>
            <Pressable
              onPress={handleSubmit}
              disabled={!name.trim() || createGroup.isPending}
              style={({ pressed }) => [
                pressed ? { opacity: 0.9 } : undefined,
                (!name.trim() || createGroup.isPending) ? { opacity: 0.5 } : undefined,
              ]}
            >
              <LinearGradient
                colors={['#0B6E4F', '#0a5e43']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.ctaGradient}
              >
                {createGroup.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={s.ctaText}>Crear grupo</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: 'hidden',
  },
  flex1: {
    flex: 1,
  },

  // Native drag handle
  handleContainer: {
    paddingTop: 8,
    paddingBottom: 4,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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

  // Form
  formContent: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 24,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#1A1A2E',
  },
  textArea: {
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#1A1A2E',
  },
  counter: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
  },

  // Tournament rows
  tournamentRowOuter: {
    marginTop: 2,
  },
  tournamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  tournamentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  tournamentTextCol: {
    flex: 1,
  },
  tournamentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  tournamentMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: COLORS.primary.DEFAULT,
    backgroundColor: COLORS.primary.DEFAULT,
  },

  // Stepper
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  stepperBtnDisabled: {
    opacity: 0.35,
  },
  stepperBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  stepperBtnTextDisabled: {
    color: '#9CA3AF',
  },
  stepperValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  helperText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // Bottom bar
  bottomBar: {
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  ctaShadow: {
    borderRadius: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#0B6E4F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.19,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  ctaGradient: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
