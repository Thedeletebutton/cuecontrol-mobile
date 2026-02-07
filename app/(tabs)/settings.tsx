import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  SafeAreaView,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../src/context/AuthContext';
import { useAppModeContext } from '../../src/context/AppModeContext';
import { useLicense } from '../../src/context/LicenseContext';
import { AboutModal } from '../../src/components/AboutModal';
import { setCurrentLicenseKey, registerDJHandle, getDJHandle } from '../../src/services/requests';
import { colors, typography, spacing } from '../../src/constants/theme';

type SettingsTab = 'license' | 'display' | 'account';

const DJ_HEADER_FONT_SIZE_KEY = '@cuecontrol_dj_header_font_size';
const DJ_REQUESTER_FONT_SIZE_KEY = '@cuecontrol_dj_requester_font_size';
const DJ_TRACK_FONT_SIZE_KEY = '@cuecontrol_dj_track_font_size';

export default function SettingsScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { user, logout, isLoading } = useAuth();
  const { clearMode } = useAppModeContext();
  const { licenseKey, isValidFormat, setLicenseKey, formatLicenseKey } = useLicense();

  const [activeTab, setActiveTab] = useState<SettingsTab>('license');
  const [licenseInput, setLicenseInput] = useState(licenseKey || '');
  const [saving, setSaving] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);
  const [djHandle, setDjHandle] = useState('');
  const [handleInput, setHandleInput] = useState('');
  const [savingHandle, setSavingHandle] = useState(false);

  // Display settings
  const [headerFontSize, setHeaderFontSize] = useState(11);
  const [requesterFontSize, setRequesterFontSize] = useState(12);
  const [trackFontSize, setTrackFontSize] = useState(12);

  // Load display settings
  useEffect(() => {
    const loadDisplaySettings = async () => {
      try {
        const savedHeaderSize = await AsyncStorage.getItem(DJ_HEADER_FONT_SIZE_KEY);
        const savedRequesterSize = await AsyncStorage.getItem(DJ_REQUESTER_FONT_SIZE_KEY);
        const savedTrackSize = await AsyncStorage.getItem(DJ_TRACK_FONT_SIZE_KEY);

        if (savedHeaderSize) setHeaderFontSize(parseInt(savedHeaderSize, 10));
        if (savedRequesterSize) setRequesterFontSize(parseInt(savedRequesterSize, 10));
        if (savedTrackSize) setTrackFontSize(parseInt(savedTrackSize, 10));
      } catch (error) {
        console.error('Failed to load display settings:', error);
      }
    };
    loadDisplaySettings();
  }, []);

  useEffect(() => {
    if (licenseKey) {
      setLicenseInput(licenseKey);
      setCurrentLicenseKey(licenseKey);
      // Load existing handle
      loadDJHandle(licenseKey);
    }
  }, [licenseKey]);

  const loadDJHandle = async (key: string) => {
    try {
      const handle = await getDJHandle(key);
      if (handle) {
        setDjHandle(handle);
        setHandleInput(handle);
      }
    } catch (error) {
      console.error('Failed to load DJ handle:', error);
    }
  };

  const handleLicenseInputChange = (text: string) => {
    const formatted = formatLicenseKey(text);
    setLicenseInput(formatted);
  };

  const handleValidateLicense = async () => {
    const formatted = licenseInput.toUpperCase().trim();
    const regex = /^DJRQ-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

    if (!regex.test(formatted)) {
      Alert.alert('Invalid Format', 'Please enter a valid license key in the format DJRQ-XXXX-XXXX-XXXX');
      return;
    }

    Alert.alert('Valid Format', 'License key format is valid. Click Save to activate.');
  };

  const handleSaveLicense = async () => {
    const formatted = licenseInput.toUpperCase().trim();
    const regex = /^DJRQ-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

    if (!regex.test(formatted)) {
      Alert.alert('Invalid License Key', 'Please enter a valid license key in the format DJRQ-XXXX-XXXX-XXXX');
      return;
    }

    setSaving(true);
    try {
      await setLicenseKey(formatted);
      setCurrentLicenseKey(formatted);
      Alert.alert('Saved!', 'Your license key has been saved.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save license key');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLicenseKey = async () => {
    if (licenseKey && isValidFormat) {
      await Clipboard.setStringAsync(licenseKey);
      Alert.alert('Copied!', 'Your license key has been copied. Share it with viewers so they can send you requests.');
    }
  };

  const handleSaveHandle = async () => {
    if (!licenseKey || !isValidFormat) {
      Alert.alert('License Key Required', 'Please save your license key first before setting a Stream ID.');
      return;
    }

    const handle = handleInput.toLowerCase().trim();

    if (!handle || handle.length < 3) {
      Alert.alert('Invalid Stream ID', 'Stream ID must be at least 3 characters.');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(handle)) {
      Alert.alert('Invalid Stream ID', 'Stream ID can only contain letters, numbers, and underscores.');
      return;
    }

    setSavingHandle(true);
    try {
      await registerDJHandle(handle, licenseKey, user?.email?.split('@')[0]);
      setDjHandle(handle);
      Alert.alert('Saved!', `Your Stream ID "@${handle}" has been saved. Share this with viewers so they can send you requests!`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save Stream ID');
    } finally {
      setSavingHandle(false);
    }
  };

  const handleCopyHandle = async () => {
    if (djHandle) {
      await Clipboard.setStringAsync(djHandle);
      Alert.alert('Copied!', `Your Stream ID "@${djHandle}" has been copied. Share it with viewers!`);
    }
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

  const handleBack = () => {
    if (from === 'mode') {
      router.replace('/');
    } else {
      router.back();
    }
  };

  const handleRequestLicenseKey = async () => {
    const subject = encodeURIComponent('CueControl License Key Request');
    const body = encodeURIComponent(
      `Hello,\n\nI would like to request a CueControl license key.\n\nName: ${user?.email?.split('@')[0] || 'User'}\nEmail: ${user?.email || 'N/A'}\n\nThank you!`
    );
    const mailtoUrl = `mailto:Admin@cuecontrolapp.com?subject=${subject}&body=${body}`;

    try {
      await Linking.openURL(mailtoUrl);
      // Show confirmation popup
      Alert.alert(
        'Request Sent',
        'Please check your email for your license key. It may take up to 24 hours to receive your key.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Unable to open email client. Please email Admin@cuecontrolapp.com directly.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Custom header matching desktop style */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>CueControl Settings</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.headerButton, styles.infoButton]}
              onPress={() => setAboutVisible(true)}
            >
              <Ionicons name="information" size={16} color={colors.accent.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerButton, styles.closeButton]}
              onPress={handleBack}
            >
              <Ionicons name="close" size={16} color={colors.status.error} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'license' && styles.tabActive]}
          onPress={() => setActiveTab('license')}
        >
          <Text style={[styles.tabText, activeTab === 'license' && styles.tabTextActive]}>
            License
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'display' && styles.tabActive]}
          onPress={() => setActiveTab('display')}
        >
          <Text style={[styles.tabText, activeTab === 'display' && styles.tabTextActive]}>
            Display
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'account' && styles.tabActive]}
          onPress={() => setActiveTab('account')}
        >
          <Text style={[styles.tabText, activeTab === 'account' && styles.tabTextActive]}>
            Account
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'license' && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Your License Key</Text>
              </View>

              <View style={styles.licenseContainer}>
            <Text style={styles.licenseLabel}>
              Enter your CueControl license key:
            </Text>

            <TextInput
              style={styles.licenseInput}
              value={licenseInput}
              onChangeText={handleLicenseInputChange}
              placeholder="DJRQ-XXXX-XXXX-XXXX"
              placeholderTextColor={colors.text.muted}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={19}
              editable={true}
              selectTextOnFocus={true}
            />

            <View style={styles.licenseButtonRow}>
              <TouchableOpacity
                style={styles.validateButton}
                onPress={handleValidateLicense}
              >
                <Text style={styles.validateButtonText}>Validate</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.licenseRowSaveButton, saving && styles.buttonDisabled]}
                onPress={handleSaveLicense}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />
            <Text style={styles.requestLabel}>Don't have a license key?</Text>
            <TouchableOpacity style={styles.requestButton} onPress={handleRequestLicenseKey}>
              <Ionicons name="mail-outline" size={18} color={colors.text.primary} />
              <Text style={styles.requestButtonText}>Request a License Key</Text>
            </TouchableOpacity>
          </View>
        </View>

        {licenseKey && isValidFormat && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Stream ID</Text>
            </View>

            <View style={styles.licenseContainer}>
              <Text style={styles.licenseLabel}>
                Set a Stream ID that viewers can use to find you (instead of sharing your license key):
              </Text>

              <View style={styles.handleInputContainer}>
                <Text style={styles.handlePrefix}>@</Text>
                <TextInput
                  style={styles.handleInput}
                  value={handleInput}
                  onChangeText={(text) => setHandleInput(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="your_stream_id"
                  placeholderTextColor={colors.text.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveButton, savingHandle && styles.buttonDisabled]}
                onPress={handleSaveHandle}
                disabled={savingHandle}
              >
                <Ionicons name="save-outline" size={18} color={colors.text.primary} />
                <Text style={styles.saveButtonText}>
                  {savingHandle ? 'Saving...' : 'Save Stream ID'}
                </Text>
              </TouchableOpacity>

              {djHandle && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.shareLabel}>Share with viewers:</Text>
                  <TouchableOpacity style={styles.copyButton} onPress={handleCopyHandle}>
                    <Ionicons name="copy-outline" size={18} color={colors.accent.primary} />
                    <Text style={styles.copyButtonText}>@{djHandle}</Text>
                  </TouchableOpacity>
                  <Text style={styles.handleHint}>
                    Viewers enter this Stream ID in the app to send you requests
                  </Text>
                </>
              )}
            </View>
          </View>
        )}
          </>
        )}

        {activeTab === 'display' && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Font Sizes</Text>
              </View>

              <View style={styles.displayContainer}>
                <View style={styles.fontSizeRow}>
                  <Text style={styles.fontSizeLabel}>Header Font Size</Text>
                  <View style={styles.fontSizeControls}>
                    <TouchableOpacity
                      style={styles.fontSizeButton}
                      onPress={async () => {
                        const newSize = Math.max(8, headerFontSize - 1);
                        setHeaderFontSize(newSize);
                        await AsyncStorage.setItem(DJ_HEADER_FONT_SIZE_KEY, newSize.toString());
                      }}
                    >
                      <Ionicons name="remove" size={16} color={colors.accent.primary} />
                    </TouchableOpacity>
                    <Text style={styles.fontSizeValue}>{headerFontSize}px</Text>
                    <TouchableOpacity
                      style={styles.fontSizeButton}
                      onPress={async () => {
                        const newSize = Math.min(18, headerFontSize + 1);
                        setHeaderFontSize(newSize);
                        await AsyncStorage.setItem(DJ_HEADER_FONT_SIZE_KEY, newSize.toString());
                      }}
                    >
                      <Ionicons name="add" size={16} color={colors.accent.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.fontSizeRow}>
                  <Text style={styles.fontSizeLabel}>Requester Font Size</Text>
                  <View style={styles.fontSizeControls}>
                    <TouchableOpacity
                      style={styles.fontSizeButton}
                      onPress={async () => {
                        const newSize = Math.max(10, requesterFontSize - 1);
                        setRequesterFontSize(newSize);
                        await AsyncStorage.setItem(DJ_REQUESTER_FONT_SIZE_KEY, newSize.toString());
                      }}
                    >
                      <Ionicons name="remove" size={16} color={colors.accent.primary} />
                    </TouchableOpacity>
                    <Text style={styles.fontSizeValue}>{requesterFontSize}px</Text>
                    <TouchableOpacity
                      style={styles.fontSizeButton}
                      onPress={async () => {
                        const newSize = Math.min(20, requesterFontSize + 1);
                        setRequesterFontSize(newSize);
                        await AsyncStorage.setItem(DJ_REQUESTER_FONT_SIZE_KEY, newSize.toString());
                      }}
                    >
                      <Ionicons name="add" size={16} color={colors.accent.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.fontSizeRow}>
                  <Text style={styles.fontSizeLabel}>Track Font Size</Text>
                  <View style={styles.fontSizeControls}>
                    <TouchableOpacity
                      style={styles.fontSizeButton}
                      onPress={async () => {
                        const newSize = Math.max(10, trackFontSize - 1);
                        setTrackFontSize(newSize);
                        await AsyncStorage.setItem(DJ_TRACK_FONT_SIZE_KEY, newSize.toString());
                      }}
                    >
                      <Ionicons name="remove" size={16} color={colors.accent.primary} />
                    </TouchableOpacity>
                    <Text style={styles.fontSizeValue}>{trackFontSize}px</Text>
                    <TouchableOpacity
                      style={styles.fontSizeButton}
                      onPress={async () => {
                        const newSize = Math.min(20, trackFontSize + 1);
                        setTrackFontSize(newSize);
                        await AsyncStorage.setItem(DJ_TRACK_FONT_SIZE_KEY, newSize.toString());
                      }}
                    >
                      <Ionicons name="add" size={16} color={colors.accent.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        {activeTab === 'account' && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Account</Text>
              </View>

              <View style={styles.accountContainer}>
                <View style={styles.accountInfo}>
                  <Ionicons name="person-circle" size={48} color={colors.accent.primary} />
                  <View style={styles.accountDetails}>
                    <Text style={styles.accountEmail}>{user?.email || 'Not signed in'}</Text>
                    <Text style={styles.accountStatus}>Signed in</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={handleLogout}
                  disabled={isLoading}
                >
                  <Ionicons name="log-out-outline" size={20} color={colors.status.error} />
                  <Text style={styles.logoutButtonText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </View>

          </>
        )}

        {/* Save Settings Button */}
        <View style={styles.saveSettingsContainer}>
          <TouchableOpacity style={styles.saveSettingsButton} onPress={handleBack}>
            <Ionicons name="checkmark" size={20} color={colors.text.primary} />
            <Text style={styles.saveSettingsButtonText}>Save Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AboutModal visible={aboutVisible} onClose={() => setAboutVisible(false)} userEmail={user?.email} />
    </View>
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
    backgroundColor: colors.background.main,
  },
  header: {
    height: 35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.main,
    borderTopWidth: 2,
    borderTopColor: colors.border,
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
  headerButton: {
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
  infoButtonText: {
    fontFamily: 'Helvetica Neue',
    color: colors.accent.primary,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  closeButton: {
    borderColor: colors.status.error,
  },
  closeButtonText: {
    fontFamily: 'Helvetica Neue',
    color: colors.status.error,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background.panel,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.accent.primary,
  },
  tabText: {
    fontFamily: 'Helvetica Neue',
    fontSize: typography.sizes.sm,
    fontWeight: '800',
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tabTextActive: {
    color: colors.accent.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    padding: spacing.lg,
    backgroundColor: colors.background.panel,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontFamily: 'Helvetica Neue',
    fontSize: typography.sizes.sm,
    fontWeight: '800',
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  licenseContainer: {
    padding: spacing.lg,
    backgroundColor: colors.background.row,
  },
  licenseLabel: {
    fontFamily: 'Helvetica Neue',
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  licenseInput: {
    backgroundColor: colors.background.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: typography.sizes.lg,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  licenseButtonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  validateButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent.primary,
    borderRadius: 8,
    padding: spacing.md,
  },
  validateButtonText: {
    fontFamily: 'Helvetica Neue',
    color: colors.accent.primary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  licenseRowSaveButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent.primary,
    borderRadius: 8,
    padding: spacing.md,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent.primary,
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontFamily: 'Helvetica Neue',
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  shareLabel: {
    fontFamily: 'Helvetica Neue',
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.secondary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.panel,
    borderWidth: 1,
    borderColor: colors.accent.primary,
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.sm,
  },
  copyButtonText: {
    color: colors.accent.primary,
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '800',
    letterSpacing: 1,
  },
  accountContainer: {
    padding: spacing.lg,
    backgroundColor: colors.background.row,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  accountDetails: {
    marginLeft: spacing.md,
  },
  accountEmail: {
    fontFamily: 'Helvetica Neue',
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 1,
  },
  accountStatus: {
    fontFamily: 'Helvetica Neue',
    fontSize: 15,
    fontWeight: '800',
    color: colors.status.success,
    letterSpacing: 1,
    marginTop: spacing.xs,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.status.error,
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.sm,
  },
  logoutButtonText: {
    fontFamily: 'Helvetica Neue',
    color: colors.status.error,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  requestLabel: {
    fontFamily: 'Helvetica Neue',
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.secondary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent.primary,
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.sm,
  },
  requestButtonText: {
    fontFamily: 'Helvetica Neue',
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  handleInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  handlePrefix: {
    fontFamily: 'Helvetica Neue',
    paddingLeft: spacing.md,
    fontSize: typography.sizes.lg,
    color: colors.text.muted,
    fontWeight: '800',
    letterSpacing: 1,
  },
  handleInput: {
    fontFamily: 'Helvetica Neue',
    flex: 1,
    padding: spacing.md,
    paddingLeft: spacing.xs,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  handleHint: {
    fontFamily: 'Helvetica Neue',
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.muted,
    letterSpacing: 1,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  displayContainer: {
    padding: spacing.lg,
    backgroundColor: colors.background.row,
  },
  fontSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fontSizeLabel: {
    fontFamily: 'Helvetica Neue',
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 1,
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fontSizeButton: {
    width: 25,
    height: 25,
    borderWidth: 2,
    borderColor: colors.accent.primary,
    borderRadius: 0,
    backgroundColor: colors.background.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontSizeValue: {
    fontFamily: 'Helvetica Neue',
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
    minWidth: 50,
    textAlign: 'center',
  },
  saveSettingsContainer: {
    padding: spacing.md,
  },
  saveSettingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent.primary,
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.sm,
  },
  saveSettingsButtonText: {
    fontFamily: 'Helvetica Neue',
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
