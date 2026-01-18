import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../constants/theme';

interface ManualEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (username: string, track: string) => Promise<void>;
  defaultUsername?: string;
}

export function ManualEntryModal({
  visible,
  onClose,
  onSubmit,
  defaultUsername = '',
}: ManualEntryModalProps) {
  const [username, setUsername] = useState(defaultUsername);
  const [track, setTrack] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!track.trim()) {
      setError('Track name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit(username.trim(), track.trim());
      setUsername(defaultUsername);
      setTrack('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add request');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUsername(defaultUsername);
    setTrack('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Request</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.status.error} />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Requested By</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Username (optional)"
              placeholderTextColor={colors.text.muted}
            />

            <Text style={styles.label}>Artist / Track</Text>
            <TextInput
              style={styles.input}
              value={track}
              onChangeText={setTrack}
              placeholder="Artist - Track Name"
              placeholderTextColor={colors.text.muted}
              autoFocus
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Adding...' : 'Add Request'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: colors.background.panel,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  form: {
    padding: spacing.lg,
  },
  label: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.background.row,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  error: {
    color: colors.status.error,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.md,
  },
  submitButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
});
