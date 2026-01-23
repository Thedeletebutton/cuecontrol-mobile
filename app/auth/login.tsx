import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../src/context/AuthContext';
import { AboutModal } from '../../src/components/AboutModal';
import { colors, typography, spacing } from '../../src/constants/theme';

const STORAGE_KEYS = {
  REMEMBER_EMAIL: 'cuecontrol_remember_email',
  SAVED_EMAIL: 'cuecontrol_saved_email',
  STAY_SIGNED_IN: 'cuecontrol_stay_signed_in',
  SAVED_CREDENTIALS: 'cuecontrol_saved_credentials',
};

export default function LoginScreen() {
  const router = useRouter();
  const { login, register, isLoading, error, clearError } = useAuth();

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

        // Auto-login if credentials are saved
        if (creds.email && creds.password) {
          setIsAutoLogging(true);
          try {
            await login(creds.email, creds.password);
            router.replace('/');
          } catch (err) {
            // Clear saved credentials if auto-login fails
            await AsyncStorage.multiRemove([
              STORAGE_KEYS.SAVED_CREDENTIALS,
              STORAGE_KEYS.STAY_SIGNED_IN,
            ]);
            setStaySignedIn(false);
            setLocalError('Session expired. Please sign in again.');
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

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setLocalError(null);
    clearError();
  };

  const displayError = localError || error;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header bar matching desktop style */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>CueControl</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.aboutButton} onPress={() => setAboutVisible(true)}>
            <Text style={styles.aboutButtonText}>i</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="headset" size={48} color={colors.accent.primary} />
          </View>
          <Text style={styles.title}>CueControl</Text>
          <Text style={styles.subtitle}>Live Requests, Without the Chaos.</Text>
          <Text style={styles.version}>Version 5.2.0</Text>
        </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colors.text.muted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          editable={!isLoading}
        />

        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colors.text.muted}
          secureTextEntry
          editable={!isLoading}
        />

        {displayError && (
          <Text style={styles.error}>{displayError}</Text>
        )}

        <View style={styles.checkboxGroup}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setRememberEmail(!rememberEmail)}
          >
            <View style={[styles.checkbox, rememberEmail && styles.checkboxChecked]}>
              {rememberEmail && <Ionicons name="checkmark" size={14} color={colors.text.primary} />}
            </View>
            <Text style={styles.checkboxLabel}>Remember email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={toggleStaySignedIn}
          >
            <View style={[styles.checkbox, staySignedIn && styles.checkboxChecked]}>
              {staySignedIn && <Ionicons name="checkmark" size={14} color={colors.text.primary} />}
            </View>
            <Text style={styles.checkboxLabel}>Stay signed in</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, (isLoading || isAutoLogging) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading || isAutoLogging}
        >
          {isLoading || isAutoLogging ? (
            <ActivityIndicator color={colors.text.primary} />
          ) : (
            <Text style={styles.submitButtonText}>
              {isSignUp ? 'Sign Up' : 'Login'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.toggleButton} onPress={toggleMode}>
          <Text style={styles.toggleButtonText}>
            {isSignUp
              ? 'Already have an account? Login'
              : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>

      <AboutModal visible={aboutVisible} onClose={() => setAboutVisible(false)} userEmail={null} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  headerBar: {
    height: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#787878',
    backgroundColor: colors.background.main,
  },
  headerTitle: {
    fontFamily: 'Helvetica Neue',
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aboutButton: {
    width: 20,
    height: 20,
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
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
    justifyContent: 'flex-start',
    padding: spacing.xl,
    paddingTop: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
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
  },
  version: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  form: {
    backgroundColor: colors.background.panel,
    borderRadius: 16,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.background.row,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  error: {
    color: colors.status.error,
    fontSize: typography.sizes.sm,
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
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
  toggleButton: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: colors.accent.primary,
    fontSize: typography.sizes.sm,
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
    width: 20,
    height: 20,
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
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
});
