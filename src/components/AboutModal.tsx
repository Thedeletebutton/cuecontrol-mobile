import React, { useState } from 'react';
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
import { SupportModal } from './SupportModal';

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
  userEmail?: string | null;
}

export function AboutModal({ visible, onClose, userEmail }: AboutModalProps) {
  const [supportVisible, setSupportVisible] = useState(false);

  const openSocialLink = () => {
    Linking.openURL('https://linktr.ee/trinitromusic');
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header bar */}
          <View style={styles.headerBar}>
            <Text style={styles.headerBarTitle}>CueControl</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity style={[styles.iconButton, styles.closeButton]} onPress={onClose}>
                <Ionicons name="close" size={16} color={colors.status.error} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Image
                source={require('../../assets/icon.png')}
                style={styles.logoIcon}
              />
              <Text style={styles.title}>CueControl</Text>
              <Text style={styles.subtitle}>Live Requests, Without the Chaos.</Text>
              <Text style={styles.version}>Version 11.5.0</Text>
              <TouchableOpacity style={styles.supportButton} onPress={() => setSupportVisible(true)}>
                <Ionicons name="help-circle-outline" size={18} color={colors.accent.primary} />
                <Text style={styles.supportButtonText}>Contact Support</Text>
              </TouchableOpacity>
            </View>

            {/* Credits Card */}
            <View style={styles.card}>
              <View style={styles.credits}>
                <Text style={styles.creatorText}>Created & Designed by</Text>
                <Text style={styles.creatorName}>Andrew Keim / Trinitro</Text>
                <Text style={styles.followText}>Please follow on Facebook, Instagram, and Twitch:</Text>
                <TouchableOpacity onPress={openSocialLink}>
                  <Text style={styles.socialLink}>@trinitromusic</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.copyright}>Copyright © 2025</Text>
          </ScrollView>

          <SupportModal
            visible={supportVisible}
            onClose={() => setSupportVisible(false)}
            userEmail={userEmail}
          />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    justifyContent: 'flex-start',
    padding: spacing.xl,
    paddingTop: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: 'Helvetica Neue',
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: 'Helvetica Neue',
    fontSize: typography.sizes.md,
    color: colors.text.muted,
    fontStyle: 'italic',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  version: {
    fontFamily: 'Helvetica Neue',
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: colors.accent.primary,
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.sm,
  },
  supportButtonText: {
    fontFamily: 'Helvetica Neue',
    fontSize: typography.sizes.md,
    color: colors.accent.primary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.background.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  credits: {
    alignItems: 'center',
  },
  creatorText: {
    fontFamily: 'Helvetica Neue',
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  creatorName: {
    fontFamily: 'Helvetica Neue',
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  followText: {
    fontFamily: 'Helvetica Neue',
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  socialLink: {
    fontFamily: 'Helvetica Neue',
    fontSize: typography.sizes.md,
    color: colors.accent.primary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  copyright: {
    fontFamily: 'Helvetica Neue',
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
