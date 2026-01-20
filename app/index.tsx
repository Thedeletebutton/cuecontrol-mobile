import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Linking,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useAppModeContext } from '../src/context/AppModeContext';
import { AboutModal } from '../src/components/AboutModal';
import { colors, typography, spacing } from '../src/constants/theme';
import { IS_CONFIGURED } from '../src/config/firebase.config';

export default function ModeSelection() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user, logout } = useAuth();
  const { setMode, loading: modeLoading, clearMode } = useAppModeContext();
  const [aboutVisible, setAboutVisible] = useState(false);

  useEffect(() => {
    // If Firebase is configured but user is not authenticated, redirect to login
    if (!authLoading && IS_CONFIGURED && !isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    // Always show mode selection after login - do NOT auto-redirect to saved mode
  }, [isAuthenticated, authLoading]);

  const handleDJMode = async () => {
    await setMode('dj');
    router.push('/(tabs)/queue');
  };

  const handleViewerMode = async () => {
    await setMode('viewer');
    router.push('/viewer/request');
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            // Clear saved credentials to prevent auto-login
            await AsyncStorage.multiRemove([
              'cuecontrol_saved_credentials',
              'cuecontrol_stay_signed_in',
            ]);
            await logout();
            await clearMode();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  if (authLoading || modeLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </View>
    );
  }

  // If not configured, show setup message
  if (!IS_CONFIGURED) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>CueControl</Text>
          <Text style={styles.subtitle}>Firebase not configured</Text>
          <Text style={styles.setupText}>
            Edit src/config/firebase.config.ts to add your Firebase credentials
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header bar matching desktop style */}
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>CueControl</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.aboutButton} onPress={() => setAboutVisible(true)}>
              <Text style={styles.aboutButtonText}>i</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsButton} onPress={() => setAboutVisible(true)}>
              <Ionicons name="settings-sharp" size={14} color={colors.text.grey} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={handleLogout}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Image
              source={require('../assets/icon.png')}
              style={styles.logoIcon}
            />
            <Text style={styles.title}>CueControl</Text>
            <Text style={styles.subtitle}>Live Requests, Without the Chaos.</Text>
            <Text style={styles.version}>Version 3.9.2</Text>
            <TouchableOpacity
              style={styles.supportButton}
              onPress={() => Linking.openURL('https://linktr.ee/trinitromusic')}
            >
              <Text style={styles.supportButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.modeButton} onPress={handleDJMode}>
              <View style={styles.iconContainer}>
                <Ionicons name="headset" size={48} color={colors.accent.primary} />
              </View>
              <Text style={styles.modeTitle}>DJ Mode</Text>
              <Text style={styles.modeDesc}>Manage your request queue</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modeButton} onPress={handleViewerMode}>
              <View style={styles.iconContainer}>
                <Ionicons name="musical-notes" size={48} color={colors.accent.primary} />
              </View>
              <Text style={styles.modeTitle}>Request Mode</Text>
              <Text style={styles.modeDesc}>Submit a song request</Text>
            </TouchableOpacity>
          </View>
        </View>

        <AboutModal visible={aboutVisible} onClose={() => setAboutVisible(false)} />
      </View>
    </SafeAreaView>
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
  },
  headerBar: {
    height: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#787878',
    borderBottomWidth: 1,
    borderBottomColor: '#787878',
    backgroundColor: colors.background.main,
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
  aboutButton: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutButtonText: {
    color: colors.accent.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  settingsButton: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: colors.text.grey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: '#ff3b3b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ff3b3b',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    flex: 1,
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
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.text.muted,
    fontStyle: 'italic',
    marginBottom: spacing.xs,
  },
  version: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  supportButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.accent.primary,
    borderRadius: 8,
  },
  supportButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.accent.primary,
    fontWeight: '600',
  },
  setupText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  buttons: {
    gap: spacing.lg,
  },
  modeButton: {
    backgroundColor: colors.background.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent.soft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modeTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  modeDesc: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
});
