import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../src/context/AuthContext';
import { useAppModeContext } from '../../src/context/AppModeContext';
import { AboutModal } from '../../src/components/AboutModal';
import { sendRequestByHandle } from '../../src/services/requests';
import { colors, typography, spacing } from '../../src/constants/theme';

const DJ_HANDLE_STORAGE = '@cuecontrol_viewer_dj_handle';
const USERNAME_STORAGE_KEY = '@cuecontrol_username';
const SAVE_DJ_HANDLE_KEY = '@cuecontrol_save_dj_handle';
const SAVE_USERNAME_KEY = '@cuecontrol_save_username';

export default function RequestScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { clearMode } = useAppModeContext();

  const [djHandle, setDjHandle] = useState('');
  const [username, setUsername] = useState('');
  const [track, setTrack] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);
  const [djDisplayName, setDjDisplayName] = useState('');
  const [aboutVisible, setAboutVisible] = useState(false);
  const [saveDjHandle, setSaveDjHandle] = useState(true);
  const [saveUsername, setSaveUsername] = useState(true);

  // Load saved DJ handle and username on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedDjHandle = await AsyncStorage.getItem(DJ_HANDLE_STORAGE);
        const savedUsername = await AsyncStorage.getItem(USERNAME_STORAGE_KEY);
        const savedSaveDjHandle = await AsyncStorage.getItem(SAVE_DJ_HANDLE_KEY);
        const savedSaveUsername = await AsyncStorage.getItem(SAVE_USERNAME_KEY);

        if (savedDjHandle) setDjHandle(savedDjHandle);
        if (savedUsername) setUsername(savedUsername);
        if (savedSaveDjHandle !== null) setSaveDjHandle(savedSaveDjHandle === 'true');
        if (savedSaveUsername !== null) setSaveUsername(savedSaveUsername === 'true');
      } catch (error) {
        console.error('Failed to load saved data:', error);
      }
    };
    loadSavedData();
  }, []);

  // Format handle as user types (lowercase, no special chars except underscore)
  const handleDjHandleChange = (text: string) => {
    const cleaned = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setDjHandle(cleaned);
  };

  const handleBack = async () => {
    await clearMode();
    router.replace('/');
  };

  const handleSubmit = async () => {
    const handle = djHandle.toLowerCase().trim();

    if (!handle) {
      Alert.alert('DJ Handle Required', 'Please enter the DJ\'s handle');
      return;
    }

    if (handle.length < 3) {
      Alert.alert('Invalid Handle', 'DJ handle must be at least 3 characters');
      return;
    }

    if (!username.trim()) {
      Alert.alert('Name Required', 'Please enter your name');
      return;
    }

    if (!track.trim()) {
      Alert.alert('Song Required', 'Please enter a song name');
      return;
    }

    setLoading(true);

    try {
      // Conditionally save DJ handle and username based on checkbox settings
      if (saveDjHandle) {
        await AsyncStorage.setItem(DJ_HANDLE_STORAGE, handle);
      } else {
        await AsyncStorage.removeItem(DJ_HANDLE_STORAGE);
      }

      if (saveUsername) {
        await AsyncStorage.setItem(USERNAME_STORAGE_KEY, username.trim());
      } else {
        await AsyncStorage.removeItem(USERNAME_STORAGE_KEY);
      }

      // Send the request to the DJ's queue by handle
      const result = await sendRequestByHandle(handle, {
        username: username.trim(),
        track: track.trim(),
      });

      setQueuePosition(result.queuePosition);
      setDjDisplayName(result.djDisplayName);
      setSubmitted(true);
    } catch (error: any) {
      if (error.message?.includes('DJ not found')) {
        Alert.alert('DJ Not Found', 'No DJ found with that handle. Please check and try again.');
      } else if (error.message?.includes('PERMISSION_DENIED')) {
        Alert.alert('Error', 'Failed to submit request. Please try again.');
      } else {
        Alert.alert('Error', error.message || 'Failed to submit request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewRequest = () => {
    setTrack('');
    setSubmitted(false);
    setQueuePosition(0);
  };

  // Custom header with back and info buttons - matching desktop style
  const renderHeader = (title: string) => (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CueControl</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.infoButton} onPress={() => setAboutVisible(true)}>
            <Text style={styles.infoButtonText}>i</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modeButton} onPress={handleBack}>
            <Text style={styles.modeButtonText}>⇄</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={handleBack}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        {renderHeader('Request a Song')}
        <View style={styles.notConnected}>
          <Ionicons name="person-circle-outline" size={64} color={colors.text.muted} />
          <Text style={styles.notConnectedTitle}>Not Signed In</Text>
          <Text style={styles.notConnectedText}>
            Please sign in to submit song requests.
          </Text>
          <TouchableOpacity style={styles.signInButton} onPress={() => router.replace('/auth/login')}>
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
        <AboutModal visible={aboutVisible} onClose={() => setAboutVisible(false)} />
      </View>
    );
  }

  if (submitted) {
    return (
      <View style={styles.container}>
        {renderHeader('Request Sent')}
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={colors.status.success} />
          </View>
          <Text style={styles.successTitle}>Request Submitted!</Text>
          <Text style={styles.successText}>Your song has been added to the queue</Text>
          <View style={styles.positionBox}>
            <Text style={styles.positionLabel}>Queue Position</Text>
            <Text style={styles.positionNumber}>#{queuePosition}</Text>
          </View>
          <TouchableOpacity style={styles.newRequestButton} onPress={handleNewRequest}>
            <Ionicons name="add" size={20} color={colors.text.primary} />
            <Text style={styles.newRequestButtonText}>Submit Another Request</Text>
          </TouchableOpacity>
        </View>
        <AboutModal visible={aboutVisible} onClose={() => setAboutVisible(false)} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader('Request a Song')}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>DJ Handle *</Text>
              <View style={styles.handleInputContainer}>
                <Text style={styles.handlePrefix}>@</Text>
                <TextInput
                  style={styles.handleInput}
                  value={djHandle}
                  onChangeText={handleDjHandleChange}
                  placeholder="dj_name"
                  placeholderTextColor={colors.text.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                />
              </View>
              <View style={styles.checkboxRow}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={async () => {
                    const newValue = !saveDjHandle;
                    setSaveDjHandle(newValue);
                    await AsyncStorage.setItem(SAVE_DJ_HANDLE_KEY, newValue.toString());
                  }}
                >
                  {saveDjHandle && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>Save DJ Handle</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your Username *</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your username"
                placeholderTextColor={colors.text.muted}
                autoCapitalize="words"
              />
              <View style={styles.checkboxRow}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={async () => {
                    const newValue = !saveUsername;
                    setSaveUsername(newValue);
                    await AsyncStorage.setItem(SAVE_USERNAME_KEY, newValue.toString());
                  }}
                >
                  {saveUsername && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>Save Username</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Song Request *</Text>
              <TextInput
                style={[styles.input, styles.trackInput]}
                value={track}
                onChangeText={setTrack}
                placeholder="Artist - Track Name"
                placeholderTextColor={colors.text.muted}
                multiline
                numberOfLines={2}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Ionicons name="musical-notes" size={20} color={colors.text.primary} />
              <Text style={styles.submitButtonText}>
                {loading ? 'Submitting...' : 'Submit Request'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <AboutModal visible={aboutVisible} onClose={() => setAboutVisible(false)} />
    </View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#787878',
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
    marginRight: 4,
  },
  infoButton: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoButtonText: {
    color: colors.accent.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  modeButton: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeButtonText: {
    color: colors.accent.primary,
    fontSize: 12,
    fontWeight: '700',
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  form: {
    padding: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.background.row,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.lg,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
  },
  trackInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent.primary,
    borderRadius: 12,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: '700',
  },
  notConnected: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  notConnectedTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  notConnectedText: {
    fontSize: typography.sizes.md,
    color: colors.text.muted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  signInButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: 8,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  signInButtonText: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  successIcon: {
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  successText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  positionBox: {
    backgroundColor: colors.accent.soft,
    borderWidth: 1,
    borderColor: colors.accent.primary,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  positionLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  positionNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.accent.primary,
  },
  newRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  newRequestButtonText: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
  handleInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.row,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  handlePrefix: {
    paddingLeft: spacing.lg,
    fontSize: typography.sizes.lg,
    color: colors.text.muted,
    fontWeight: '600',
  },
  handleInput: {
    flex: 1,
    padding: spacing.lg,
    paddingLeft: spacing.xs,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  checkmark: {
    color: colors.accent.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
});
