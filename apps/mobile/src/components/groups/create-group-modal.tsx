/**
 * Modal to create a new group.
 *
 * Slide-up sheet with name, description, and max-members fields.
 * Uses useCreateGroup mutation and navigates to the new group on success.
 */

import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Stepper } from '@/components/ui/stepper';
import { useCreateGroup } from '@/hooks/use-groups';
import { useAuthStore } from '@/stores/auth-store';
import { COLORS } from '@/theme/colors';

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateGroupModal({ visible, onClose }: CreateGroupModalProps) {
  const planLimit = useAuthStore((s) => s.user?.plan.maxMembersPerGroup ?? 10);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxMembers, setMaxMembers] = useState(planLimit);

  const createGroup = useCreateGroup();

  function resetForm() {
    setName('');
    setDescription('');
    setMaxMembers(planLimit);
  }

  function handleClose() {
    resetForm();
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

    createGroup.mutate(
      {
        name: trimmedName,
        description: description.trim() || undefined,
        maxMembers,
      },
      {
        onSuccess: (data) => {
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
        <View className="flex-1 px-5 pt-6">
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
        </View>

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
