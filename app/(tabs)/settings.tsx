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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../../src/context/AuthContext';
import { useAppModeContext } from '../../src/context/AppModeContext';
import { useLicense } from '../../src/context/LicenseContext';
import { AboutModal } from '../../src/components/AboutModal';
import { setCurrentLicenseKey, registerDJHandle, getDJHandle } from '../../src/services/requests';
import { colors, typography, spacing } from '../../src/constants/theme';

type SettingsTab = 'license' | 'account';

export default function SettingsScreen() {
  const router = useRouter();
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
      Alert.alert('Saved!', 'Your license key has been saved. Share this with viewers so they can send you requests.');
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
      Alert.alert('License Key Required', 'Please save your license key first before setting a DJ handle.');
      return;
    }

    const handle = handleInput.toLowerCase().trim();

    if (!handle || handle.length < 3) {
      Alert.alert('Invalid Handle', 'Handle must be at least 3 characters.');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(handle)) {
      Alert.alert('Invalid Handle', 'Handle can only contain letters, numbers, and underscores.');
      return;
    }

    setSavingHandle(true);
    try {
      await registerDJHandle(handle, licenseKey, user?.email?.split('@')[0]);
      setDjHandle(handle);
      Alert.alert('Saved!', `Your DJ handle "@${handle}" has been saved. Share this with viewers so they can send you requests!`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save handle');
    } finally {
      setSavingHandle(false);
    }
  };

  const handleCopyHandle = async () => {
    if (djHandle) {
      await Clipboard.setStringAsync(djHandle);
      Alert.alert('Copied!', `Your handle "@${djHandle}" has been copied. Share it with viewers!`);
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
            await logout();
            await clearMode();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  const handleSwitchMode = async () => {
    await clearMode();
    router.replace('/');
  };

  const handleBack = () => {
    router.back();
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
      {/* Custom header with back and info buttons */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Settings</Text>
          </View>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setAboutVisible(true)}
          >
            <Ionicons name="information-circle-outline" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'license' && styles.tabActive]}
          onPress={() => setActiveTab('license')}
        >
          <Text style={[styles.tabText, activeTab === 'license' && styles.tabTextActive]}>
            License & Handle
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
              Enter your CueControl license key from the desktop app:
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
            />

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.buttonDisabled]}
              onPress={handleSaveLicense}
              disabled={saving}
            >
              <Ionicons name="save-outline" size={18} color={colors.text.primary} />
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Save License Key'}
              </Text>
            </TouchableOpacity>

            {licenseKey && isValidFormat && (
              <>
                <View style={styles.divider} />
                <Text style={styles.shareLabel}>Share with viewers:</Text>
                <TouchableOpacity style={styles.copyButton} onPress={handleCopyLicenseKey}>
                  <Ionicons name="copy-outline" size={18} color={colors.accent.primary} />
                  <Text style={styles.copyButtonText}>{licenseKey}</Text>
                </TouchableOpacity>
              </>
            )}

            {!licenseKey && (
              <>
                <View style={styles.divider} />
                <Text style={styles.requestLabel}>Don't have a license key?</Text>
                <TouchableOpacity style={styles.requestButton} onPress={handleRequestLicenseKey}>
                  <Ionicons name="mail-outline" size={18} color={colors.text.primary} />
                  <Text style={styles.requestButtonText}>Request a License Key</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {licenseKey && isValidFormat && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your DJ Handle</Text>
            </View>

            <View style={styles.licenseContainer}>
              <Text style={styles.licenseLabel}>
                Set a handle that viewers can use to find you (instead of sharing your license key):
              </Text>

              <View style={styles.handleInputContainer}>
                <Text style={styles.handlePrefix}>@</Text>
                <TextInput
                  style={styles.handleInput}
                  value={handleInput}
                  onChangeText={(text) => setHandleInput(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="your_dj_name"
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
                  {savingHandle ? 'Saving...' : 'Save Handle'}
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
                    Viewers enter this handle in the app to send you requests
                  </Text>
                </>
              )}
            </View>
          </View>
        )}
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

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>App Mode</Text>
              </View>

              <TouchableOpacity style={styles.switchButton} onPress={handleSwitchMode}>
                <Ionicons name="swap-horizontal" size={20} color={colors.accent.primary} />
                <Text style={styles.switchButtonText}>Switch to Request Mode</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

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
    backgroundColor: colors.background.panel,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.panel,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.xs,
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    color: colors.text.primary,
  },
  iconButton: {
    padding: spacing.sm,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background.panel,
    borderBottomWidth: 1,
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
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.text.muted,
    textTransform: 'uppercase',
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
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.text.muted,
    textTransform: 'uppercase',
  },
  licenseContainer: {
    padding: spacing.lg,
    backgroundColor: colors.background.row,
  },
  licenseLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
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
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  shareLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
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
    fontSize: typography.sizes.md,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
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
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.text.primary,
  },
  accountStatus: {
    fontSize: typography.sizes.sm,
    color: colors.status.success,
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
    color: colors.status.error,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background.row,
    gap: spacing.sm,
  },
  switchButtonText: {
    fontSize: typography.sizes.md,
    color: colors.accent.primary,
  },
  requestLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
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
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: '600',
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
    paddingLeft: spacing.md,
    fontSize: typography.sizes.lg,
    color: colors.text.muted,
    fontWeight: '600',
  },
  handleInput: {
    flex: 1,
    padding: spacing.md,
    paddingLeft: spacing.xs,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
  },
  handleHint: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
