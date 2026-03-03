import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useAppModeContext } from '../context/AppModeContext';
import { colors, typography, spacing } from '../constants/theme';

interface AppHeaderProps {
  title: string;
  showSettings?: boolean;
  showInfo?: boolean;
  showBack?: boolean;
}

export function AppHeader({
  title,
  showSettings = true,
  showInfo = true,
  showBack = false,
}: AppHeaderProps) {
  const router = useRouter();
  const { mode, clearMode } = useAppModeContext();
  const [aboutVisible, setAboutVisible] = useState(false);

  const handleBack = async () => {
    await clearMode();
    router.replace('/');
  };

  const handleSettings = () => {
    router.push('/(tabs)/settings');
  };

  const openLink = () => {
    Linking.openURL('https://linktr.ee/trinitromusic');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Left side - Back button or title */}
        <View style={styles.leftSection}>
          {showBack && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
            </TouchableOpacity>
          )}
          <Text style={styles.title}>{title}</Text>
        </View>

        {/* Right side - Info and Settings icons */}
        <View style={styles.rightSection}>
          {showInfo && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setAboutVisible(true)}
            >
              <Ionicons name="information-circle-outline" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          )}
          {showSettings && mode === 'dj' && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleSettings}
            >
              <Ionicons name="settings-outline" size={22} color={colors.text.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* About Modal */}
      <Modal
        visible={aboutVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAboutVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAboutVisible(false)}
        >
          <View style={styles.aboutContainer}>
            <View style={styles.aboutHeader}>
              <Text style={styles.aboutHeaderText}>About</Text>
              <TouchableOpacity
                style={styles.aboutCloseButton}
                onPress={() => setAboutVisible(false)}
              >
                <Text style={styles.aboutCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.aboutBody}>
              <Text style={styles.aboutTitle}>CueControl Mobile</Text>
              <Text style={styles.aboutVersion}>Version 5.1.0</Text>
              <TouchableOpacity onPress={openLink}>
                <Text style={styles.aboutLink}>@trinitromusic</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background.panel,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.panel,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.xs,
    marginLeft: -spacing.sm,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    color: colors.text.primary,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    padding: spacing.sm,
  },
  // About modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutContainer: {
    backgroundColor: colors.background.panel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    width: 280,
    overflow: 'hidden',
  },
  aboutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.main,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  aboutHeaderText: {
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: colors.text.primary,
    textTransform: 'uppercase',
  },
  aboutCloseButton: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: colors.status.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutCloseText: {
    color: colors.status.error,
    fontSize: 12,
    fontWeight: '700',
  },
  aboutBody: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  aboutTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  aboutVersion: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  aboutLink: {
    fontSize: typography.sizes.md,
    color: colors.accent.primary,
    fontWeight: '600',
  },
});
