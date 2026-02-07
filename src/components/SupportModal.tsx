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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, set } from 'firebase/database';
import { getFirebaseDatabase, getFirebaseApp } from '../services/firebase';
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

    try {
      let db = getFirebaseDatabase();
      if (!db) {
        // Fallback: get database directly from the app instance
        const app = getFirebaseApp();
        if (app) {
          db = getDatabase(app);
        }
      }
      if (!db) throw new Error('Firebase not connected');

      const id = Date.now();
      const messageRef = ref(db, `supportMessages/${id}`);
      await set(messageRef, {
        id,
        message: message.trim(),
        email: 'admin@cuecontrolapp.com',
        appVersion: '11.8.0',
        timestamp: id,
      });

      setMessage('');
      Alert.alert('Message Sent', 'Your support message has been sent. We\'ll get back to you soon.');
      onClose();
    } catch (error: any) {
      console.error('Support message error:', error);
      Alert.alert('Error', `Failed to send message: ${error.message || 'Unknown error'}`);
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
            <Text style={styles.headerBarTitle}>CueControl - Contact Support</Text>
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
                  {sending ? 'Sending...' : 'Send Message'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.noteText}>
                Your message will be sent directly to the CueControl team.
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
    paddingTop: spacing.xl,
  },
  infoSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  infoText: {
    fontFamily: 'Helvetica Neue',
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
    letterSpacing: 1,
  },
  inputSection: {
    marginBottom: spacing.lg,
  },
  messageInput: {
    fontFamily: 'Helvetica Neue',
    backgroundColor: colors.background.row,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 1,
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
    marginBottom: spacing.lg,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontFamily: 'Helvetica Neue',
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  noteText: {
    fontFamily: 'Helvetica Neue',
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.muted,
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
});
