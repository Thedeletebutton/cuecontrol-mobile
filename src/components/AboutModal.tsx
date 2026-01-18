import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Linking,
  Image,
} from 'react-native';
import { colors, typography, spacing } from '../constants/theme';

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AboutModal({ visible, onClose }: AboutModalProps) {
  const openLink = () => {
    Linking.openURL('https://linktr.ee/trinitromusic');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.container} onStartShouldSetResponder={() => true}>
          {/* Header bar */}
          <View style={styles.headerBar}>
            <Text style={styles.headerTitle}>CueControl</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Logo section */}
            <View style={styles.logo}>
              <View style={styles.logoIcon}>
                <Text style={styles.logoIconText}>CC</Text>
              </View>
              <Text style={styles.appName}>CueControl</Text>
              <Text style={styles.tagline}>Live Requests, Without the Chaos.</Text>
              <Text style={styles.version}>Version 3.9.0</Text>
            </View>

            {/* Card section */}
            <View style={styles.card}>
              <View style={styles.credits}>
                <Text style={styles.creatorText}>Created & Designed by Andrew Keim / Trinitro</Text>
                <Text style={styles.followText}>Please follow on Facebook, Instagram, and Twitch:</Text>
                <TouchableOpacity onPress={openLink}>
                  <Text style={styles.socialLink}>@trinitromusic</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.copyright}>Copyright © 2025</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.background.main,
    borderRadius: 0,
    width: '90%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  headerBar: {
    height: 36,
    backgroundColor: colors.background.main,
    borderBottomWidth: 1,
    borderBottomColor: '#787878',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: 1,
  },
  closeButton: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: colors.status.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: colors.status.error,
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  logo: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: colors.accent.soft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoIconText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.accent.primary,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: 13,
    color: colors.text.muted,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  version: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  card: {
    backgroundColor: colors.background.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  credits: {
    alignItems: 'center',
  },
  creatorText: {
    fontSize: 13,
    color: colors.text.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  followText: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  socialLink: {
    fontSize: 13,
    color: colors.accent.primary,
    fontWeight: '600',
  },
  copyright: {
    fontSize: 11,
    color: colors.text.muted,
  },
});
