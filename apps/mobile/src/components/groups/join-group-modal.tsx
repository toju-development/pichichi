/**
 * Modal to join a group via invite code.
 *
 * Slide-up sheet with a single large invite code input.
 * Uses useJoinGroup mutation and navigates to the group on success.
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
import { useJoinGroup } from '@/hooks/use-groups';
import { COLORS } from '@/theme/colors';

interface JoinGroupModalProps {
  visible: boolean;
  onClose: () => void;
}

export function JoinGroupModal({ visible, onClose }: JoinGroupModalProps) {
  const [inviteCode, setInviteCode] = useState('');

  const joinGroup = useJoinGroup();

  function resetForm() {
    setInviteCode('');
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleChangeCode(text: string) {
    // Auto-uppercase and strip spaces
    setInviteCode(text.toUpperCase().replace(/\s/g, ''));
  }

  function handleSubmit() {
    const trimmed = inviteCode.trim();

    if (!trimmed) {
      Alert.alert('Error', 'Ingresá el código de invitación.');
      return;
    }

    joinGroup.mutate(trimmed, {
      onSuccess: (data) => {
        handleClose();
        router.push(`/(tabs)/groups/${data.id}`);
      },
      onError: (err: unknown) => {
        const axiosErr = err as { response?: { data?: { message?: string }; status?: number } };
        const serverMsg = axiosErr?.response?.data?.message?.toLowerCase() ?? '';
        const status = axiosErr?.response?.status;

        if (status === 404 || serverMsg.includes('not found') || serverMsg.includes('invalid')) {
          Alert.alert(
            'Código inválido',
            'No se encontró un grupo con ese código. Verificá que esté bien escrito.',
          );
        } else if (status === 409 || serverMsg.includes('already')) {
          Alert.alert(
            'Ya sos miembro',
            'Ya estás en este grupo.',
          );
        } else if (serverMsg.includes('full') || serverMsg.includes('capacity') || serverMsg.includes('máximo')) {
          Alert.alert(
            'Grupo lleno',
            'Este grupo ya alcanzó el máximo de miembros.',
          );
        } else {
          const fallback = 'No se pudo unir al grupo. Intentá de nuevo.';
          const message = axiosErr?.response?.data?.message ?? fallback;
          Alert.alert('Error', status ? `(${status}) ${message}` : message);
        }
      },
    });
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
            Unirme a un grupo
          </Text>
          <Pressable onPress={handleClose} className="active:opacity-70">
            <Text className="text-base font-medium text-primary">
              Cancelar
            </Text>
          </Pressable>
        </View>

        {/* Content */}
        <View className="flex-1 items-center px-5 pt-10">
          <Text className="mb-2 text-center text-sm text-text-secondary">
            Pedile el código de invitación al admin del grupo
          </Text>

          {/* Code input */}
          <Text className="mb-3 text-sm font-semibold text-text-primary">
            Código de invitación
          </Text>
          <TextInput
            value={inviteCode}
            onChangeText={handleChangeCode}
            placeholder="ABCD1234"
            placeholderTextColor={COLORS.text.muted}
            maxLength={8}
            autoCapitalize="characters"
            autoCorrect={false}
            className="mb-2 w-full rounded-xl border border-border bg-white px-4 py-4 text-center text-2xl font-bold tracking-widest text-text-primary"
          />
          <Text className="mb-6 text-xs text-text-muted">
            8 caracteres, letras y números
          </Text>
        </View>

        {/* Submit */}
        <View className="border-t border-border px-5 pb-8 pt-4">
          <Button
            title="Unirme al grupo"
            variant="primary"
            loading={joinGroup.isPending}
            disabled={inviteCode.trim().length === 0 || joinGroup.isPending}
            onPress={handleSubmit}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
