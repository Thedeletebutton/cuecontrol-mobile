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
import { ViewerSettingsModal } from '../../src/components/ViewerSettingsModal';
import { sendRequestByHandle } from '../../src/services/requests';
import { colors, typography, spacing } from '../../src/constants/theme';

const DJ_HANDLE_STORAGE = '@cuecontrol_viewer_dj_handle';
const USERNAME_STORAGE_KEY = '@cuecontrol_username';
const SAVE_DJ_HANDLE_KEY = '@cuecontrol_save_dj_handle';
const SAVE_USERNAME_KEY = '@cuecontrol_save_username';
const LABEL_FONT_SIZE_KEY = '@cuecontrol_viewer_label_font_size';
const INPUT_FONT_SIZE_KEY = '@cuecontrol_viewer_input_font_size';

export default function RequestScreen() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const { clearMode } = useAppModeContext();

  const [djHandle, setDjHandle] = useState('');
  const [username, setUsername] = useState('');
  const [track, setTrack] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);
  const [djDisplayName, setDjDisplayName] = useState('');
  const [aboutVisible, setAboutVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [saveDjHandle, setSaveDjHandle] = useState(true);
  const [saveUsername, setSaveUsername] = useState(true);
  const [labelFontSize, setLabelFontSize] = useState(12);
  const [inputFontSize, setInputFontSize] = useState(14);

  // Load saved settings on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedDjHandle = await AsyncStorage.getItem(DJ_HANDLE_STORAGE);
        const savedUsername = await AsyncStorage.getItem(USERNAME_STORAGE_KEY);
        const savedSaveDjHandle = await AsyncStorage.getItem(SAVE_DJ_HANDLE_KEY);
        const savedSaveUsername = await AsyncStorage.getItem(SAVE_USERNAME_KEY);
        const savedLabelFontSize = await AsyncStorage.getItem(LABEL_FONT_SIZE_KEY);
        const savedInputFontSize = await AsyncStorage.getItem(INPUT_FONT_SIZE_KEY);

        if (savedDjHandle) setDjHandle(savedDjHandle);
        if (savedUsername) setUsername(savedUsername);
        if (savedSaveDjHandle !== null) setSaveDjHandle(savedSaveDjHandle === 'true');
        if (savedSaveUsername !== null) setSaveUsername(savedSaveUsername === 'true');
        if (savedLabelFontSize) setLabelFontSize(parseInt(savedLabelFontSize, 10));
        if (savedInputFontSize) setInputFontSize(parseInt(savedInputFontSize, 10));
      } catch (error) {
        console.error('Failed to load saved data:', error);
      }
    };
    loadSavedData();
  }, []);

  const handleSignOut = async () => {
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

  // Format handle as user types (lowercase, no special chars except underscore)
  const handleDjHandleChange = (text: string) => {
    const cleaned = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setDjHandle(cleaned);
  };

  const handleBack = () => {
    // Go back to home/mode selection screen
    router.replace('/');
  };

  const handleSubmit = async () => {
    const handle = djHandle.toLowerCase().trim();

    if (!handle) {
      Alert.alert('Stream ID Required', 'Please enter the Stream ID');
      return;
    }

    if (handle.length < 3) {
      Alert.alert('Invalid Stream ID', 'Stream ID must be at least 3 characters');
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
        Alert.alert('Stream Not Found', 'No stream found with that ID. Please check and try again.');
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
  const renderHeader = () => (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CueControl - Request a Track</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.infoButton} onPress={() => setAboutVisible(true)}>
            <Text style={styles.infoButtonText}>i</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsButton} onPress={() => setSettingsVisible(true)}>
            <Ionicons name="settings-sharp" size={14} color={colors.text.muted} />
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
        {renderHeader()}
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
        <AboutModal visible={aboutVisible} onClose={() => setAboutVisible(false)} userEmail={user?.email} />
        <ViewerSettingsModal
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
          saveDjHandle={saveDjHandle}
          saveUsername={saveUsername}
          onToggleSaveDjHandle={async () => {
            const newValue = !saveDjHandle;
            setSaveDjHandle(newValue);
            await AsyncStorage.setItem(SAVE_DJ_HANDLE_KEY, newValue.toString());
          }}
          onToggleSaveUsername={async () => {
            const newValue = !saveUsername;
            setSaveUsername(newValue);
            await AsyncStorage.setItem(SAVE_USERNAME_KEY, newValue.toString());
          }}
          labelFontSize={labelFontSize}
          inputFontSize={inputFontSize}
          onLabelFontSizeChange={async (size) => {
            setLabelFontSize(size);
            await AsyncStorage.setItem(LABEL_FONT_SIZE_KEY, size.toString());
          }}
          onInputFontSizeChange={async (size) => {
            setInputFontSize(size);
            await AsyncStorage.setItem(INPUT_FONT_SIZE_KEY, size.toString());
          }}
          userEmail={user?.email || null}
          onSignOut={handleSignOut}
        />
      </View>
    );
  }

  if (submitted) {
    return (
      <View style={styles.container}>
        {renderHeader()}
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
        <AboutModal visible={aboutVisible} onClose={() => setAboutVisible(false)} userEmail={user?.email} />
        <ViewerSettingsModal
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
          saveDjHandle={saveDjHandle}
          saveUsername={saveUsername}
          onToggleSaveDjHandle={async () => {
            const newValue = !saveDjHandle;
            setSaveDjHandle(newValue);
            await AsyncStorage.setItem(SAVE_DJ_HANDLE_KEY, newValue.toString());
          }}
          onToggleSaveUsername={async () => {
            const newValue = !saveUsername;
            setSaveUsername(newValue);
            await AsyncStorage.setItem(SAVE_USERNAME_KEY, newValue.toString());
          }}
          labelFontSize={labelFontSize}
          inputFontSize={inputFontSize}
          onLabelFontSizeChange={async (size) => {
            setLabelFontSize(size);
            await AsyncStorage.setItem(LABEL_FONT_SIZE_KEY, size.toString());
          }}
          onInputFontSizeChange={async (size) => {
            setInputFontSize(size);
            await AsyncStorage.setItem(INPUT_FONT_SIZE_KEY, size.toString());
          }}
          userEmail={user?.email || null}
          onSignOut={handleSignOut}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
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
              <Text style={[styles.label, { fontSize: labelFontSize }]}>Stream ID *</Text>
              <View style={styles.handleInputContainer}>
                <Text style={[styles.handlePrefix, { fontSize: inputFontSize }]}>@</Text>
                <TextInput
                  style={[styles.handleInput, { fontSize: inputFontSize }]}
                  value={djHandle}
                  onChangeText={handleDjHandleChange}
                  placeholder="stream_id"
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
                <Text style={styles.checkboxLabel}>Save Stream ID</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { fontSize: labelFontSize }]}>Your Username *</Text>
              <TextInput
                style={[styles.input, { fontSize: inputFontSize }]}
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
              <Text style={[styles.label, { fontSize: labelFontSize }]}>Track Request *</Text>
              <TextInput
                style={[styles.input, { fontSize: inputFontSize }]}
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
      <AboutModal visible={aboutVisible} onClose={() => setAboutVisible(false)} userEmail={user?.email} />
      <ViewerSettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        saveDjHandle={saveDjHandle}
        saveUsername={saveUsername}
        onToggleSaveDjHandle={async () => {
          const newValue = !saveDjHandle;
          setSaveDjHandle(newValue);
          await AsyncStorage.setItem(SAVE_DJ_HANDLE_KEY, newValue.toString());
        }}
        onToggleSaveUsername={async () => {
          const newValue = !saveUsername;
          setSaveUsername(newValue);
          await AsyncStorage.setItem(SAVE_USERNAME_KEY, newValue.toString());
        }}
        labelFontSize={labelFontSize}
        inputFontSize={inputFontSize}
        onLabelFontSizeChange={async (size) => {
          setLabelFontSize(size);
          await AsyncStorage.setItem(LABEL_FONT_SIZE_KEY, size.toString());
        }}
        onInputFontSizeChange={async (size) => {
          setInputFontSize(size);
          await AsyncStorage.setItem(INPUT_FONT_SIZE_KEY, size.toString());
        }}
        userEmail={user?.email || null}
        onSignOut={handleSignOut}
      />
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
  settingsButton: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: colors.text.muted,
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingTop: spacing.md,
  },
  form: {
    padding: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.background.row,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
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
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.md,
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: spacing.xxl,
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
    borderRadius: 8,
  },
  handlePrefix: {
    paddingLeft: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text.muted,
    fontWeight: '600',
  },
  handleInput: {
    flex: 1,
    padding: spacing.md,
    paddingLeft: spacing.xs,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
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
