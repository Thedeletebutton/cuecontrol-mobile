import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
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
import { s, fs } from '../src/utils/responsive';
import { IS_CONFIGURED } from '../src/config/firebase.config';

export default function ModeSelection() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user, logout, login } = useAuth();
  const { setMode, loading: modeLoading, clearMode } = useAppModeContext();
  const [aboutVisible, setAboutVisible] = useState(false);
  const [supportVisible, setSupportVisible] = useState(false);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  useEffect(() => {
    if (authLoading || !IS_CONFIGURED) return;
    if (isAuthenticated) return;

    // Try auto-login from saved credentials before redirecting to login
    const tryAutoLogin = async () => {
      if (!autoLoginAttempted) {
        setAutoLoginAttempted(true);
        try {
          const staySignedIn = await AsyncStorage.getItem('cuecontrol_stay_signed_in');
          const savedCredentials = await AsyncStorage.getItem('cuecontrol_saved_credentials');
          if (staySignedIn === 'true' && savedCredentials) {
            const creds = JSON.parse(savedCredentials);
            if (creds.email && creds.password) {
              await login(creds.email, creds.password);
              return; // Success - useEffect will re-run with isAuthenticated=true
            }
          }
        } catch {
          // Auto-login failed, fall through to login screen
        }
      }
      router.replace('/auth/login');
    };
    tryAutoLogin();
  }, [isAuthenticated, authLoading, autoLoginAttempted]);

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
          <Text style={styles.headerTitle}>CueControl - Mode Selection</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={[styles.iconButton, styles.aboutButton]} onPress={() => setAboutVisible(true)}>
              <Ionicons name="information" size={s(16)} color={colors.accent.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconButton, styles.settingsButton]} onPress={() => router.push('/(tabs)/settings?from=mode')}>
              <Ionicons name="settings-sharp" size={s(14)} color={colors.text.grey} />
            </TouchableOpacity>
            <TouchableOpacity testID="mode-signout-button" style={[styles.iconButton, styles.closeButton]} onPress={handleLogout}>
              <Ionicons name="close" size={s(16)} color={colors.status.error} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Image
              source={require('../assets/icon.png')}
              style={styles.logoIcon}
            />
            <Text style={styles.title}>CueControl</Text>
            <Text style={styles.subtitle}>Live Requests, Without the Chaos.</Text>
            <Text style={styles.version}>Version 23.0.0</Text>
            <TouchableOpacity
              style={styles.supportButton}
              onPress={() => setSupportVisible(true)}
            >
              <Text style={styles.supportButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity testID="dj-mode-button" style={styles.modeButton} onPress={handleDJMode}>
              <View style={styles.iconContainer}>
                <Ionicons name="headset" size={s(48)} color={colors.accent.primary} />
              </View>
              <Text style={styles.modeTitle}>DJ Mode</Text>
              <Text style={styles.modeDesc}>Your queue, your rules.</Text>
            </TouchableOpacity>

            <TouchableOpacity testID="viewer-mode-button" style={styles.modeButton} onPress={handleViewerMode}>
              <View style={styles.iconContainer}>
                <Ionicons name="musical-notes" size={s(48)} color={colors.accent.primary} />
              </View>
              <Text style={styles.modeTitle}>Viewer Mode</Text>
              <Text style={styles.modeDesc}>Drop a request, watch the queue.</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

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
    height: s(35),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.main,
    borderBottomWidth: s(2),
    borderBottomColor: colors.border,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Helvetica Neue',
    fontSize: fs(18),
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 1,
    paddingLeft: s(5),
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(6),
    width: s(98),
    borderLeftWidth: s(2),
    borderLeftColor: colors.border,
    paddingHorizontal: 1,
    height: '100%',
  },
  iconButton: {
    width: s(25),
    height: s(25),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: s(2),
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: s(40),
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoIcon: {
    width: s(80),
    height: s(80),
    borderRadius: s(16),
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: 'Helvetica Neue',
    fontSize: fs(28),
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
  },
  version: {
    fontFamily: 'Helvetica Neue',
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    letterSpacing: 0.5,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
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
  },
  supportButtonText: {
    fontFamily: 'Helvetica Neue',
    fontSize: fs(15),
    color: colors.accent.primary,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  setupText: {
    fontFamily: 'Helvetica Neue',
    fontSize: typography.sizes.sm,
    fontWeight: '800',
    color: colors.text.secondary,
    letterSpacing: 1,
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
    borderRadius: s(16),
    padding: spacing.lg,
    alignItems: 'center',
  },
  iconContainer: {
    width: s(80),
    height: s(80),
    borderRadius: s(40),
    backgroundColor: colors.accent.soft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
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
    fontWeight: '800',
    color: colors.text.secondary,
    letterSpacing: 1,
  },
});
