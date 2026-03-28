/**
 * Modal to edit an existing group (admin only).
 *
 * Slide-up sheet with name, description, and maxMembers fields.
 * Pre-populated with current values. Uses useUpdateGroup mutation.
 */

import { useEffect, useState } from 'react';
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

import type { GroupDto } from '@pichichi/shared';

import { Button } from '@/components/ui/button';
import { useUpdateGroup } from '@/hooks/use-groups';
import { COLORS } from '@/theme/colors';

interface EditGroupModalProps {
  visible: boolean;
  group: GroupDto;
  onClose: () => void;
}

export function EditGroupModal({ visible, group, onClose }: EditGroupModalProps) {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? '');
  const [maxMembers, setMaxMembers] = useState(String(group.maxMembers));

  const updateGroup = useUpdateGroup();

  // Sync form state when group data changes (e.g. after refetch)
  useEffect(() => {
    if (visible) {
      setName(group.name);
      setDescription(group.description ?? '');
      setMaxMembers(String(group.maxMembers));
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

    const parsedMax = parseInt(maxMembers, 10);
    const finalMax = isNaN(parsedMax) ? group.maxMembers : Math.max(2, parsedMax);

    // Only send changed fields
    const data: { name?: string; description?: string; maxMembers?: number } = {};

    if (trimmedName !== group.name) {
      data.name = trimmedName;
    }

    const trimmedDesc = description.trim();
    if (trimmedDesc !== (group.description ?? '')) {
      data.description = trimmedDesc;
    }

    if (finalMax !== group.maxMembers) {
      data.maxMembers = finalMax;
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
          const message =
            axiosErr?.response?.data?.message ??
            'No se pudo actualizar el grupo. Intentá de nuevo.';
          const status = axiosErr?.response?.status;
          Alert.alert('Error', status ? `(${status}) ${message}` : message);
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
            Editar grupo
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
          <Text className="mb-5 text-xs text-text-muted">{name.length}/100</Text>

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
            className="mb-1 rounded-xl border border-border bg-white px-4 py-3 text-base text-text-primary"
            style={{ minHeight: 80 }}
          />
          <Text className="mb-5 text-xs text-text-muted">
            {description.length}/500
          </Text>

          {/* Max members */}
          <Text className="mb-2 text-sm font-semibold text-text-primary">
            Máximo de miembros
          </Text>
          <TextInput
            value={maxMembers}
            onChangeText={setMaxMembers}
            placeholder={String(group.maxMembers)}
            placeholderTextColor={COLORS.text.muted}
            keyboardType="number-pad"
            maxLength={3}
            className="mb-1 rounded-xl border border-border bg-white px-4 py-3 text-base text-text-primary"
            style={{ width: 100 }}
          />
          <Text className="mb-6 text-xs text-text-muted">
            Mínimo 2. No puede ser menor a los miembros actuales ({group.memberCount}).
          </Text>
        </View>

        {/* Submit */}
        <View className="border-t border-border px-5 pb-8 pt-4">
          <Button
            title="Guardar cambios"
            variant="primary"
            loading={updateGroup.isPending}
            disabled={!name.trim() || updateGroup.isPending}
            onPress={handleSubmit}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
