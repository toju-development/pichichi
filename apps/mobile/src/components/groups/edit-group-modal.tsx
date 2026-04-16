/**
 * Modal to edit an existing group (admin only).
 *
 * Slide-up sheet with name, description, and maxMembers fields.
 * Pre-populated with current values. Uses useUpdateGroup mutation.
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

import { useEffect, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Minus, Plus } from 'lucide-react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import type { GroupDto } from '@pichichi/shared';

import { useUpdateGroup } from '@/hooks/use-groups';
import { useAuthStore } from '@/stores/auth-store';

interface EditGroupModalProps {
  visible: boolean;
  group: GroupDto;
  onClose: () => void;
}

export function EditGroupModal({ visible, group, onClose }: EditGroupModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <EditGroupModalContent group={group} onClose={onClose} visible={visible} />
      </SafeAreaProvider>
    </Modal>
  );
}

function EditGroupModalContent({ group, onClose, visible }: { group: GroupDto; onClose: () => void; visible: boolean }) {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? '');
  const [maxMembers, setMaxMembers] = useState(group.maxMembers);
  const insets = useSafeAreaInsets();

  const updateGroup = useUpdateGroup();
  const planLimit = useAuthStore((s) => s.user?.plan.maxMembersPerGroup ?? 10);
  const minMembers = Math.max(2, group.memberCount);

  // Sync form state when group data changes (e.g. after refetch)
  useEffect(() => {
    if (visible) {
      setName(group.name);
      setDescription(group.description ?? '');
      setMaxMembers(group.maxMembers);
    }
  }, [visible, group.name, group.description, group.maxMembers]);

  function handleClose() {
    onClose();
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

    // Only send changed fields
    const data: { name?: string; description?: string; maxMembers?: number } = {};

    if (trimmedName !== group.name) {
      data.name = trimmedName;
    }

    const trimmedDesc = description.trim();
    if (trimmedDesc !== (group.description ?? '')) {
      data.description = trimmedDesc;
    }

    if (maxMembers !== group.maxMembers) {
      data.maxMembers = maxMembers;
    }

    // Nothing changed
    if (Object.keys(data).length === 0) {
      handleClose();
      return;
    }

    updateGroup.mutate(
      { id: group.id, data },
      {
        onSuccess: () => {
          handleClose();
        },
        onError: (err: unknown) => {
          const axiosErr = err as {
            response?: { data?: { message?: string }; status?: number };
          };
          Alert.alert(
            'Error',
            axiosErr?.response?.data?.message ??
              'No se pudo actualizar el grupo. Intentá de nuevo.',
          );
        },
      },
    );
  }

  const atMin = maxMembers <= minMembers;
  const atMax = maxMembers >= planLimit;

  function decrementMembers() {
    if (!atMin) setMaxMembers((v) => Math.max(minMembers, v - 1));
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
        <Text style={s.headerTitle}>Editar grupo</Text>
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

          {/* Field 3 — Máximo de miembros */}
          <View style={s.fieldGroupStepper}>
            <Text style={s.label}>Máximo de miembros</Text>

            <View style={s.stepperRow}>
              {/* Minus button */}
              <View style={[s.stepperBtn, atMin && s.stepperBtnDisabled]}>
                <Pressable
                  onPress={decrementMembers}
                  disabled={atMin}
                  style={({ pressed }) => pressed && !atMin ? { opacity: 0.7 } : undefined}
                >
                  <Minus size={18} color={atMin ? '#9CA3AF' : '#1A1A2E'} strokeWidth={2.5} />
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
                  <Plus size={18} color={atMax ? '#9CA3AF' : '#1A1A2E'} strokeWidth={2.5} />
                </Pressable>
              </View>
            </View>

            <Text style={s.helperText}>
              Mínimo {minMembers}, máximo {planLimit} (según tu plan)
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── Bottom bar with CTA ──────────────────────── */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={s.ctaShadow}>
          <Pressable
            onPress={handleSubmit}
            disabled={!name.trim() || updateGroup.isPending}
            style={({ pressed }) => [
              pressed ? { opacity: 0.9 } : undefined,
              (!name.trim() || updateGroup.isPending) ? { opacity: 0.5 } : undefined,
            ]}
          >
            <LinearGradient
              colors={['#0B6E4F', '#0a5e43']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.ctaGradient}
            >
              {updateGroup.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={s.ctaText}>Guardar cambios</Text>
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
  fieldGroupStepper: {
    gap: 10,
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
