import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Keyboard,
  BackHandler,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../src/context/AuthContext';
import { AboutModal } from '../../src/components/AboutModal';
import { colors, typography, spacing } from '../../src/constants/theme';
import { s, fs } from '../../src/utils/responsive';

const STORAGE_KEYS = {
  REMEMBER_EMAIL: 'cuecontrol_remember_email',
  SAVED_EMAIL: 'cuecontrol_saved_email',
  STAY_SIGNED_IN: 'cuecontrol_stay_signed_in',
  SAVED_CREDENTIALS: 'cuecontrol_saved_credentials',
};

export default function LoginScreen() {
  const router = useRouter();
  const { login, register, isLoading, error, clearError } = useAuth();
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(false);
  const [isAutoLogging, setIsAutoLogging] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    loadSavedPreferences();
  }, []);

  const loadSavedPreferences = async () => {
    try {
      const [savedRememberEmail, savedEmail, savedStaySignedIn, savedCredentials] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_EMAIL),
        AsyncStorage.getItem(STORAGE_KEYS.SAVED_EMAIL),
        AsyncStorage.getItem(STORAGE_KEYS.STAY_SIGNED_IN),
        AsyncStorage.getItem(STORAGE_KEYS.SAVED_CREDENTIALS),
      ]);

      if (savedRememberEmail === 'true') {
        setRememberEmail(true);
        if (savedEmail) {
          setEmail(savedEmail);
        }
      }

      if (savedStaySignedIn === 'true' && savedCredentials) {
        setStaySignedIn(true);
        setRememberEmail(true);
        const creds = JSON.parse(savedCredentials);
        setEmail(creds.email || '');

        // Auto-login if credentials are saved (backup - primary auto-login is in index.tsx)
        if (creds.email && creds.password) {
          setIsAutoLogging(true);
          try {
            await login(creds.email, creds.password);
            router.replace('/');
          } catch (err) {
            // Don't clear credentials on failure - only clear on explicit sign-out
            // This preserves "stay signed in" across transient network errors
            setLocalError('Could not auto-login. Please sign in manually.');
          }
          setIsAutoLogging(false);
        }
      }
    } catch (err) {
      console.log('Could not load saved preferences');
    }
  };

  const savePreferences = async (userEmail: string, userPassword: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_EMAIL, rememberEmail ? 'true' : 'false');

      if (rememberEmail) {
        await AsyncStorage.setItem(STORAGE_KEYS.SAVED_EMAIL, userEmail);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_EMAIL);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.STAY_SIGNED_IN, staySignedIn ? 'true' : 'false');

      if (staySignedIn) {
        await AsyncStorage.setItem(STORAGE_KEYS.SAVED_CREDENTIALS, JSON.stringify({ email: userEmail, password: userPassword }));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_CREDENTIALS);
      }
    } catch (err) {
      console.log('Could not save preferences');
    }
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setLocalError('Please enter email and password');
      return;
    }

    setLocalError(null);
    clearError();

    try {
      if (isSignUp) {
        await register(email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      await savePreferences(email.trim(), password);
      router.replace('/');
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  const toggleStaySignedIn = () => {
    const newValue = !staySignedIn;
    setStaySignedIn(newValue);
    if (newValue) {
      setRememberEmail(true);
    }
  };

  const handleCloseApp = () => {
    BackHandler.exitApp();
  };

  const handleSettings = () => {
    Alert.alert('Settings', 'Sign in to access settings.');
  };

  const displayError = localError || error;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header bar */}
        <View style={styles.headerBar}>
          <Text style={styles.headerBarTitle}>CueControl - Login</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={[styles.iconButton, styles.aboutButton]} onPress={() => setAboutVisible(true)}>
              <Ionicons name="information" size={s(16)} color={colors.accent.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconButton, styles.settingsButton]} onPress={handleSettings}>
              <Ionicons name="settings-sharp" size={s(14)} color={colors.text.grey} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconButton, styles.closeButton]} onPress={handleCloseApp}>
              <Ionicons name="close" size={s(16)} color={colors.status.error} />
            </TouchableOpacity>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="headset" size={s(48)} color={colors.accent.primary} />
              </View>
              <Text style={styles.title}>CueControl</Text>
              <Text style={styles.subtitle}>Live Requests, Without the Chaos.</Text>
              <Text style={styles.version}>Version 22.0.0</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.tabRow}>
                <TouchableOpacity
                  testID="login-tab"
                  style={[styles.tab, !isSignUp && styles.tabActive]}
                  onPress={() => { setIsSignUp(false); setLocalError(null); clearError(); }}
                >
                  <Text style={[styles.tabText, !isSignUp && styles.tabTextActive]}>Login!</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="signup-tab"
                  style={[styles.tab, isSignUp && styles.tabActive]}
                  onPress={() => { setIsSignUp(true); setLocalError(null); clearError(); }}
                >
                  <Text style={[styles.tabText, isSignUp && styles.tabTextActive]}>Sign Up!</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                testID="login-email-input"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={colors.text.muted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!isLoading}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              <TextInput
                testID="login-password-input"
                ref={passwordRef}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={colors.text.muted}
                secureTextEntry
                editable={!isLoading}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />

              {displayError && (
                <Text testID="login-error-text" style={styles.error}>{displayError}</Text>
              )}

              <View style={styles.checkboxGroup}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setRememberEmail(!rememberEmail)}
                >
                  <View style={[styles.checkbox, rememberEmail && styles.checkboxChecked]}>
                    {rememberEmail && <Ionicons name="checkmark" size={s(14)} color={colors.text.primary} />}
                  </View>
                  <Text style={styles.checkboxLabel}>Remember Email</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={toggleStaySignedIn}
                >
                  <View style={[styles.checkbox, staySignedIn && styles.checkboxChecked]}>
                    {staySignedIn && <Ionicons name="checkmark" size={s(14)} color={colors.text.primary} />}
                  </View>
                  <Text style={styles.checkboxLabel}>Stay Signed In</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                testID="login-submit-button"
                style={[styles.submitButton, (isLoading || isAutoLogging) && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading || isAutoLogging}
              >
                {isLoading || isAutoLogging ? (
                  <ActivityIndicator color={colors.text.primary} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isSignUp ? 'Sign Up!' : 'Login!'}
                  </Text>
                )}
              </TouchableOpacity>

            </View>
          </View>
        </KeyboardAvoidingView>

        <AboutModal visible={aboutVisible} onClose={() => setAboutVisible(false)} userEmail={null} />
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
  headerBarTitle: {
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
  keyboardView: {
    flex: 1,
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
  iconContainer: {
    width: s(80),
    height: s(80),
    borderRadius: s(40),
    backgroundColor: colors.accent.soft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
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
  },
  form: {
    backgroundColor: colors.background.panel,
    borderRadius: s(16),
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.background.row,
  },
  tabActive: {
    backgroundColor: colors.accent.primary,
  },
  tabText: {
    fontFamily: 'Helvetica Neue',
    fontSize: fs(16),
    fontWeight: '800',
    color: colors.text.muted,
    letterSpacing: 1,
  },
  tabTextActive: {
    color: colors.text.primary,
  },
  input: {
    fontFamily: 'Helvetica Neue',
    backgroundColor: colors.background.row,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  error: {
    fontFamily: 'Helvetica Neue',
    color: colors.status.error,
    fontSize: typography.sizes.sm,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontFamily: 'Helvetica Neue',
    color: colors.text.primary,
    fontSize: fs(16),
    fontWeight: '800',
    letterSpacing: 1,
  },
  checkboxGroup: {
    marginBottom: spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  checkbox: {
    width: s(20),
    height: s(20),
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background.row,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  checkboxLabel: {
    fontFamily: 'Helvetica Neue',
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    letterSpacing: 0.5,
  },
});
