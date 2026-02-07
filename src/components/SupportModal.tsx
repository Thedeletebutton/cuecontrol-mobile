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
      `${message.trim()}\n\n---\nSent from: ${userEmail || 'Unknown user'}\nApp Version: 11.5.0`
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.headerBar}>
            <Text style={styles.headerBarTitle}>Contact Support</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity style={[styles.iconButton, styles.closeButton]} onPress={handleClose}>
                <Ionicons name="close" size={16} color={colors.status.error} />
              </TouchableOpacity>
            </View>
          </View>

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
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
    borderWidth: 2,
    borderColor: colors.border,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  headerBar: {
    height: 35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.main,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  headerBarTitle: {
    flex: 1,
    fontFamily: 'Helvetica Neue',
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 1,
    paddingLeft: 5,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 35,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    height: '100%',
  },
  iconButton: {
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 0,
    backgroundColor: colors.background.main,
  },
  closeButton: {
    borderColor: colors.status.error,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    paddingTop: spacing.xxl,
  },
  infoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  infoText: {
    fontFamily: 'Helvetica Neue',
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
    letterSpacing: 0.5,
  },
  inputSection: {
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: 'Helvetica Neue',
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 1,
  },
  messageInput: {
    fontFamily: 'Helvetica Neue',
    backgroundColor: colors.background.row,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    letterSpacing: 0.5,
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
    fontFamily: 'Helvetica Neue',
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: '800',
    letterSpacing: 1,
  },
  noteText: {
    fontFamily: 'Helvetica Neue',
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
});
