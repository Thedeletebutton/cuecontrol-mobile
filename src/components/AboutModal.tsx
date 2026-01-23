import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Image,
  ScrollView,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header bar */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>CueControl</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Centered Logo Section */}
          <View style={styles.logoSection}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logoIcon}
            />
            <Text style={styles.appName}>CueControl</Text>
            <Text style={styles.tagline}>Live Requests, Without the Chaos.</Text>
            <Text style={styles.version}>Version 5.0.0</Text>
          </View>

          {/* Card with Credits and Support */}
          <View style={styles.card}>
            <View style={styles.credits}>
              <Text style={styles.creatorText}>Created & Designed by</Text>
              <Text style={styles.creatorName}>Andrew Keim / Trinitro</Text>
              <Text style={styles.followText}>Please follow on Facebook, Instagram, and Twitch:</Text>
              <TouchableOpacity onPress={openLink}>
                <Text style={styles.socialLink}>@trinitromusic</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.supportButton} onPress={openLink}>
              <Ionicons name="help-circle-outline" size={18} color={colors.accent.primary} />
              <Text style={styles.supportButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.copyright}>Copyright © 2025</Text>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  tagline: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  version: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  card: {
    backgroundColor: colors.background.panel,
    borderRadius: 16,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.lg,
  },
  credits: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  creatorText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  creatorName: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  followText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  socialLink: {
    fontSize: typography.sizes.md,
    color: colors.accent.primary,
    fontWeight: '600',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accent.primary,
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.sm,
  },
  supportButtonText: {
    fontSize: typography.sizes.md,
    color: colors.accent.primary,
    fontWeight: '600',
  },
  copyright: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    textAlign: 'center',
  },
});
