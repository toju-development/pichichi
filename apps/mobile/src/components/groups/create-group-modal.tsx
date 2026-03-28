/**
 * Modal to create a new group.
 *
 * Slide-up sheet with name, description, tournament selection, and max-members fields.
 * Uses useCreateGroup mutation, then sequentially adds selected tournaments via
 * groupsApi.addTournament, and navigates to the new group on success.
 */

import { useState } from 'react';
import {
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
import { router } from 'expo-router';

import { TrophyIcon } from '@/components/brand/icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Stepper } from '@/components/ui/stepper';
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
  const planLimit = useAuthStore((s) => s.user?.plan.maxMembersPerGroup ?? 10);

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
            Crear grupo
          </Text>
          <Pressable onPress={handleClose} className="active:opacity-70">
            <Text className="text-base font-medium text-primary">
              Cancelar
            </Text>
          </Pressable>
        </View>

        {/* Form */}
        <ScrollView className="flex-1 px-5 pt-6" keyboardShouldPersistTaps="handled">
          {/* Name */}
          <Text className="mb-2 text-sm font-semibold text-text-primary">
            Nombre del grupo *
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ej: Los cracks del mundial"
            placeholderTextColor={COLORS.text.muted}
            maxLength={100}
            className="mb-1 rounded-xl border border-border bg-white px-4 py-3 text-base text-text-primary"
          />
          <Text className="mb-5 text-xs text-text-muted">
            {name.length}/100
          </Text>

          {/* Description */}
          <Text className="mb-2 text-sm font-semibold text-text-primary">
            Descripción (opcional)
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="¿De qué se trata el grupo?"
            placeholderTextColor={COLORS.text.muted}
            maxLength={500}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="mb-1 min-h-[80px] rounded-xl border border-border bg-white px-4 py-3 text-base text-text-primary"
          />
          <Text className="mb-5 text-xs text-text-muted">
            {description.length}/500
          </Text>

          {/* Tournaments */}
          <Text className="mb-3 text-sm font-semibold text-text-primary">
            Torneos{availableTournaments?.length
              ? ` (${selectedTournaments.length} de ${availableTournaments.length} seleccionados)`
              : ''}
          </Text>

          {availableTournaments?.map((tournament: TournamentDto) => {
            const isSelected = selectedTournaments.includes(tournament.id);
            const typeLabel = TOURNAMENT_TYPE_LABELS[tournament.type] ?? tournament.type;
            const statusLabel = TOURNAMENT_STATUS_LABELS[tournament.status] ?? tournament.status;

            return (
              <Card
                key={tournament.id}
                accent={isSelected}
                className="mb-3"
                onPress={() => toggleTournament(tournament.id)}
              >
                <View style={tournamentStyles.row}>
                  <View
                    style={[
                      tournamentStyles.iconBox,
                      isSelected && tournamentStyles.iconBoxSelected,
                    ]}
                  >
                    <TrophyIcon
                      size={22}
                      color={isSelected ? COLORS.primary.DEFAULT : COLORS.text.muted}
                    />
                  </View>

                  <View style={tournamentStyles.info}>
                    <Text style={tournamentStyles.name} numberOfLines={1}>
                      {tournament.name}
                    </Text>
                    <Text style={tournamentStyles.meta} numberOfLines={1}>
                      {typeLabel} · {statusLabel}
                    </Text>
                  </View>

                  <View
                    style={[
                      tournamentStyles.check,
                      isSelected && tournamentStyles.checkSelected,
                    ]}
                  >
                    {isSelected && (
                      <Text style={tournamentStyles.checkMark}>✓</Text>
                    )}
                  </View>
                </View>
              </Card>
            );
          })}

          <View className="mb-5" />

          {/* Max members */}
          <Text className="mb-3 text-sm font-semibold text-text-primary">
            Máximo de miembros
          </Text>
          <Stepper
            value={maxMembers}
            min={2}
            max={planLimit}
            onChange={setMaxMembers}
          />
          <Text className="mt-2 mb-6 text-xs text-text-muted">
            Mínimo 2, máximo {planLimit} (según tu plan)
          </Text>
        </ScrollView>

        {/* Submit */}
        <View className="border-t border-border px-5 pb-8 pt-4">
          <Button
            title="Crear grupo"
            variant="primary"
            loading={createGroup.isPending}
            disabled={!name.trim() || createGroup.isPending}
            onPress={handleSubmit}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Tournament selection styles ────────────────────────────────────────────

const tournamentStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconBoxSelected: {
    backgroundColor: COLORS.primary.light,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  meta: {
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: {
    borderColor: COLORS.primary.DEFAULT,
    backgroundColor: COLORS.primary.DEFAULT,
  },
  checkMark: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: -1,
  },
});
