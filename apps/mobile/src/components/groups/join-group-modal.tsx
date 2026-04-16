/**
 * Modal to join a group via invite code.
 *
 * Slide-up sheet with a single large invite code input.
 * Uses useJoinGroup mutation and navigates to the group on success.
 *
 * IMPORTANT — NativeWind v4 ghost-card fix:
 * ALL visual properties use StyleSheet to guarantee rendering on the first
 * frame. className is NEVER used for visual props.
 */

import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Hash } from 'lucide-react-native';

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
          Alert.alert(
            'Error',
            axiosErr?.response?.data?.message ?? 'No se pudo unir al grupo. Intentá de nuevo.',
          );
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
      <View style={s.root}>
        {/* ─── Native drag handle ────────────────────────── */}
        <View style={s.handleContainer}>
          <View style={s.handlePill} />
        </View>

        {/* ─── Header ───────────────────────────────────── */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Unirme a un grupo</Text>
          <Pressable onPress={handleClose} style={({ pressed }) => pressed ? { opacity: 0.7 } : undefined}>
            <Text style={s.headerCancel}>Cancelar</Text>
          </Pressable>
        </View>

        {/* ─── Content area ─────────────────────────────── */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.flex1}
        >
          <View style={s.content}>
            {/* Hero icon */}
            <View style={s.heroCircle}>
              <Hash size={32} color={COLORS.primary.DEFAULT} />
            </View>

            {/* Text group */}
            <View style={s.textGroup}>
              <Text style={s.heroText}>Pedile el código de invitación</Text>
              <Text style={s.heroText}>al admin del grupo</Text>
            </View>

            {/* Code input section */}
            <View style={s.codeSection}>
              <Text style={s.codeLabel}>Código de invitación</Text>
              <TextInput
                value={inviteCode}
                onChangeText={handleChangeCode}
                placeholder="ABCD1234"
                placeholderTextColor="#9CA3AF"
                maxLength={8}
                autoCapitalize="characters"
                autoCorrect={false}
                style={s.codeInput}
              />
              <Text style={s.codeHelper}>8 caracteres, letras y números</Text>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* ─── Bottom bar with CTA ──────────────────────── */}
        <View style={s.bottomBar}>
          <View style={s.ctaShadow}>
            <Pressable
              onPress={handleSubmit}
              disabled={inviteCode.trim().length === 0 || joinGroup.isPending}
              style={({ pressed }) => [
                pressed ? { opacity: 0.9 } : undefined,
                (inviteCode.trim().length === 0 || joinGroup.isPending) ? { opacity: 0.5 } : undefined,
              ]}
            >
              <LinearGradient
                colors={['#0B6E4F', '#0a5e43']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.ctaGradient}
              >
                {joinGroup.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={s.ctaText}>Unirme al grupo</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
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

  // Content
  content: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 32,
    alignItems: 'center',
  },

  // Hero icon
  heroCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Text group
  textGroup: {
    gap: 4,
    alignItems: 'center',
  },
  heroText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    textAlign: 'center',
  },

  // Code section
  codeSection: {
    width: '100%',
    gap: 10,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  codeInput: {
    width: '100%',
    height: 64,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: 4,
  },
  codeHelper: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Bottom bar
  bottomBar: {
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 32,
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
