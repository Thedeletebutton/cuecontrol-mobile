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
import { SupportModal } from '../src/components/SupportModal';
import { colors, typography, spacing } from '../src/constants/theme';
import { IS_CONFIGURED } from '../src/config/firebase.config';

export default function ModeSelection() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user, logout } = useAuth();
  const { setMode, loading: modeLoading, clearMode } = useAppModeContext();
  const [aboutVisible, setAboutVisible] = useState(false);
  const [supportVisible, setSupportVisible] = useState(false);

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
    router.push('/viewer/dashboard');
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
            <TouchableOpacity style={[styles.iconButton, styles.aboutButton]} onPress={() => setAboutVisible(true)}>
              <Ionicons name="information" size={16} color={colors.accent.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconButton, styles.settingsButton]} onPress={() => router.push('/(tabs)/settings')}>
              <Ionicons name="settings-sharp" size={14} color={colors.text.grey} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconButton, styles.closeButton]} onPress={handleLogout}>
              <Ionicons name="close" size={16} color={colors.status.error} />
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
            <Text style={styles.version}>Version 11.6.0</Text>
            <TouchableOpacity
              style={styles.supportButton}
              onPress={() => setSupportVisible(true)}
            >
              <Ionicons name="help-circle-outline" size={18} color={colors.accent.primary} />
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

        <AboutModal visible={aboutVisible} onClose={() => setAboutVisible(false)} userEmail={user?.email} />
        <SupportModal
          visible={supportVisible}
          onClose={() => setSupportVisible(false)}
          userEmail={user?.email}
        />
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
  headerTitle: {
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
    gap: 6,
    width: 98,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    paddingHorizontal: 1,
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
  aboutButton: {
    borderColor: colors.accent.primary,
  },
  settingsButton: {
    borderColor: colors.text.grey,
  },
  closeButton: {
    borderColor: colors.status.error,
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
    fontSize: typography.sizes.md,
    color: colors.accent.primary,
    fontWeight: '600',
    letterSpacing: 1,
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
    fontFamily: 'Helvetica Neue',
    fontSize: typography.sizes.xl,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  modeDesc: {
    fontFamily: 'Helvetica Neue',
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },
});
