import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../constants/theme';

interface SupportModalProps {
  visible: boolean;
  onClose: () => void;
  userEmail?: string | null;
}

export function SupportModal({ visible, onClose, userEmail }: SupportModalProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      Alert.alert('Message Required', 'Please enter a message before sending.');
      return;
    }

    setSending(true);

    const subject = encodeURIComponent('CueControl Support Request');
    const body = encodeURIComponent(
      `${message.trim()}\n\n---\nSent from: ${userEmail || 'Unknown user'}\nApp Version: 5.1.0`
    );
    const mailtoUrl = `mailto:Admin@cuecontrolapp.com?subject=${subject}&body=${body}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        setMessage('');
        onClose();
      } else {
        Alert.alert(
          'Email Not Available',
          'Unable to open email client. Please email Admin@cuecontrolapp.com directly.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open email client. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Contact Support</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            <View style={styles.infoSection}>
              <Ionicons name="mail-outline" size={32} color={colors.accent.primary} />
              <Text style={styles.infoText}>
                Send us a message and we'll get back to you as soon as possible.
              </Text>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>Your Message *</Text>
              <TextInput
                style={styles.messageInput}
                value={message}
                onChangeText={setMessage}
                placeholder="Describe your issue or question..."
                placeholderTextColor={colors.text.muted}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.sendButton, sending && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={sending}
            >
              <Ionicons name="send" size={18} color={colors.text.primary} />
              <Text style={styles.sendButtonText}>
                {sending ? 'Opening Email...' : 'Send Message'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.noteText}>
              This will open your email app with your message pre-filled.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  safeArea: {
    backgroundColor: colors.background.main,
  },
  header: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background.main,
    borderTopWidth: 1,
    borderTopColor: '#787878',
    borderBottomWidth: 1,
    borderBottomColor: '#787878',
  },
  headerTitle: {
    fontFamily: 'Helvetica Neue',
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderLeftWidth: 1,
    borderLeftColor: '#787878',
    paddingLeft: 8,
    height: '100%',
  },
  closeButton: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: colors.status.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.status.error,
    fontSize: 12,
    fontWeight: '700',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  infoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  infoText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  messageInput: {
    backgroundColor: colors.background.row,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    minHeight: 150,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent.primary,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: '700',
  },
  noteText: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
