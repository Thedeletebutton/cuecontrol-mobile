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
import { registerForPushNotificationsAsync } from '../../src/services/pushNotifications';
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
  const [pushToken, setPushToken] = useState<string | null>(null);

  // Register for push notifications
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      console.log('[PUSH] Viewer push token:', token);
      if (token) setPushToken(token);
    });
  }, []);

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
        ...(pushToken && { pushToken }),
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
    <View style={styles.headerBar}>
      <Text style={styles.headerBarTitle}>CueControl - Request a Track</Text>
      <View style={styles.headerButtons}>
        <TouchableOpacity style={[styles.iconButton, styles.infoButton]} onPress={() => setAboutVisible(true)}>
          <Ionicons name="information" size={16} color={colors.accent.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconButton, styles.settingsButton]} onPress={() => setSettingsVisible(true)}>
          <Ionicons name="settings-sharp" size={14} color={colors.text.grey} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconButton, styles.closeButton]} onPress={handleBack}>
          <Ionicons name="close" size={16} color={colors.status.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
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
      </SafeAreaView>
    );
  }

  if (submitted) {
    return (
      <SafeAreaView style={styles.safeArea}>
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
          <TouchableOpacity style={styles.viewQueueButton} onPress={() => router.push('/viewer/dashboard')}>
            <Ionicons name="list" size={20} color={colors.accent.primary} />
            <Text style={styles.viewQueueButtonText}>View Queue</Text>
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
    borderWidth: 2,
    borderColor: colors.border,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.main,
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
  infoButton: {
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
    fontFamily: 'Helvetica Neue',
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    letterSpacing: 1,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    fontWeight: '800',
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
  },
  hint: {
    fontFamily: 'Helvetica Neue',
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    letterSpacing: 0.5,
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
    fontFamily: 'Helvetica Neue',
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: '800',
    letterSpacing: 1,
  },
  notConnected: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  notConnectedTitle: {
    fontFamily: 'Helvetica Neue',
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  notConnectedText: {
    fontFamily: 'Helvetica Neue',
    fontSize: typography.sizes.md,
    color: colors.text.muted,
    letterSpacing: 0.5,
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
    fontFamily: 'Helvetica Neue',
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: '600',
    letterSpacing: 1,
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
    fontFamily: 'Helvetica Neue',
    fontSize: typography.sizes.xxl,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  successText: {
    fontFamily: 'Helvetica Neue',
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    letterSpacing: 0.5,
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
    fontFamily: 'Helvetica Neue',
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  positionNumber: {
    fontFamily: 'Helvetica Neue',
    fontSize: 48,
    fontWeight: '700',
    color: colors.accent.primary,
    letterSpacing: 1,
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
    fontFamily: 'Helvetica Neue',
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: '600',
    letterSpacing: 1,
  },
  viewQueueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.accent.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  viewQueueButtonText: {
    fontFamily: 'Helvetica Neue',
    color: colors.accent.primary,
    fontSize: typography.sizes.md,
    fontWeight: '600',
    letterSpacing: 1,
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
    fontFamily: 'Helvetica Neue',
    paddingLeft: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text.muted,
    fontWeight: '600',
    letterSpacing: 1,
  },
  handleInput: {
    fontFamily: 'Helvetica Neue',
    flex: 1,
    padding: spacing.md,
    paddingLeft: spacing.xs,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    letterSpacing: 0.5,
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
    fontFamily: 'Helvetica Neue',
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    letterSpacing: 0.5,
  },
});
