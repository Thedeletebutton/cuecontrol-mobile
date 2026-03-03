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
import { SettingRow } from '../../src/components/SettingRow';
import { setCurrentLicenseKey, registerDJHandle, getDJHandle } from '../../src/services/requests';
import { colors, typography, spacing } from '../../src/constants/theme';
import { s, fs } from '../../src/utils/responsive';

type SettingsTab = 'license' | 'admin' | 'account';

// DJ Dashboard AsyncStorage keys
const DJ_HEADER_FONT_SIZE_KEY = '@cuecontrol_dj_header_font_size';
const DJ_REQUESTER_FONT_SIZE_KEY = '@cuecontrol_dj_requester_font_size';
const DJ_TRACK_FONT_SIZE_KEY = '@cuecontrol_dj_track_font_size';
const DJ_COLUMN_WIDTH_KEY = '@cuecontrol_dj_column_width';
const DJ_CONTENT_PADDING_LEFT_KEY = '@cuecontrol_dj_content_padding_left';
const DJ_CONTENT_PADDING_RIGHT_KEY = '@cuecontrol_dj_content_padding_right';
const DJ_TITLEBAR_RIGHT_WIDTH_KEY = '@cuecontrol_dj_titlebar_right_width';
const DJ_TOPBAR_RIGHT_WIDTH_KEY = '@cuecontrol_dj_topbar_right_width';
const DJ_HEADER_ROW_HEIGHT_KEY = '@cuecontrol_dj_header_row_height';
const DJ_TOPBAR_HEIGHT_KEY = '@cuecontrol_dj_topbar_height';
const DJ_COUNTS_ROW_HEIGHT_KEY = '@cuecontrol_dj_counts_row_height';
const DJ_ROW_HEIGHT_KEY = '@cuecontrol_dj_row_height';
const DJ_REQUESTER_SECTION_HEIGHT_KEY = '@cuecontrol_dj_requester_section_height';
const DJ_NEXT_STREAM_HEADER_HEIGHT_KEY = '@cuecontrol_dj_next_stream_header_height';

// Viewer Dashboard AsyncStorage keys
const VIEWER_HEADER_FONT_SIZE_KEY = '@cuecontrol_viewer_header_font_size';
const VIEWER_REQUESTER_FONT_SIZE_KEY = '@cuecontrol_viewer_requester_font_size';
const VIEWER_TRACK_FONT_SIZE_KEY = '@cuecontrol_viewer_track_font_size';
const VIEWER_COLUMN_WIDTH_KEY = '@cuecontrol_viewer_column_width';
const VIEWER_CONTENT_PADDING_LEFT_KEY = '@cuecontrol_viewer_content_padding_left';
const VIEWER_CONTENT_PADDING_RIGHT_KEY = '@cuecontrol_viewer_content_padding_right';
const VIEWER_HEADER_ROW_HEIGHT_KEY = '@cuecontrol_viewer_header_row_height';
const VIEWER_TOPBAR_HEIGHT_KEY = '@cuecontrol_viewer_topbar_height';
const VIEWER_COUNTS_ROW_HEIGHT_KEY = '@cuecontrol_viewer_counts_row_height';
const VIEWER_ROW_HEIGHT_KEY = '@cuecontrol_viewer_row_height';
const VIEWER_REQUESTER_SECTION_HEIGHT_KEY = '@cuecontrol_viewer_requester_section_height';
const VIEWER_NEXT_STREAM_HEADER_HEIGHT_KEY = '@cuecontrol_viewer_next_stream_header_height';

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

  // Collapsible section state
  const [djExpanded, setDjExpanded] = useState(true);
  const [viewerExpanded, setViewerExpanded] = useState(false);

  // DJ Dashboard settings
  const [djHeaderFontSize, setDjHeaderFontSize] = useState(11);
  const [djRequesterFontSize, setDjRequesterFontSize] = useState(12);
  const [djTrackFontSize, setDjTrackFontSize] = useState(12);
  const [djColumnWidth, setDjColumnWidth] = useState(98);
  const [djContentPaddingLeft, setDjContentPaddingLeft] = useState(5);
  const [djContentPaddingRight, setDjContentPaddingRight] = useState(8);
  const [djTitleBarRightWidth, setDjTitleBarRightWidth] = useState(98);
  const [djTopBarRightWidth, setDjTopBarRightWidth] = useState(98);
  const [djHeaderRowHeight, setDjHeaderRowHeight] = useState(70);
  const [djTopBarHeight, setDjTopBarHeight] = useState(38);
  const [djCountsRowHeight, setDjCountsRowHeight] = useState(30);
  const [djRowHeight, setDjRowHeight] = useState(70);
  const [djRequesterSectionHeight, setDjRequesterSectionHeight] = useState(38);
  const [djNextStreamHeaderHeight, setDjNextStreamHeaderHeight] = useState(38);

  // Viewer Dashboard settings
  const [viewerHeaderFontSize, setViewerHeaderFontSize] = useState(15);
  const [viewerRequesterFontSize, setViewerRequesterFontSize] = useState(15);
  const [viewerTrackFontSize, setViewerTrackFontSize] = useState(15);
  const [viewerColumnWidth, setViewerColumnWidth] = useState(98);
  const [viewerContentPaddingLeft, setViewerContentPaddingLeft] = useState(5);
  const [viewerContentPaddingRight, setViewerContentPaddingRight] = useState(8);
  const [viewerHeaderRowHeight, setViewerHeaderRowHeight] = useState(40);
  const [viewerTopBarHeight, setViewerTopBarHeight] = useState(38);
  const [viewerCountsRowHeight, setViewerCountsRowHeight] = useState(30);
  const [viewerRowHeight, setViewerRowHeight] = useState(70);
  const [viewerRequesterSectionHeight, setViewerRequesterSectionHeight] = useState(38);
  const [viewerNextStreamHeaderHeight, setViewerNextStreamHeaderHeight] = useState(38);

  // Load all settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const keys = [
          DJ_HEADER_FONT_SIZE_KEY, DJ_REQUESTER_FONT_SIZE_KEY, DJ_TRACK_FONT_SIZE_KEY,
          DJ_COLUMN_WIDTH_KEY, DJ_CONTENT_PADDING_LEFT_KEY, DJ_CONTENT_PADDING_RIGHT_KEY,
          DJ_TITLEBAR_RIGHT_WIDTH_KEY, DJ_TOPBAR_RIGHT_WIDTH_KEY, DJ_HEADER_ROW_HEIGHT_KEY,
          DJ_TOPBAR_HEIGHT_KEY, DJ_COUNTS_ROW_HEIGHT_KEY, DJ_ROW_HEIGHT_KEY,
          DJ_REQUESTER_SECTION_HEIGHT_KEY, DJ_NEXT_STREAM_HEADER_HEIGHT_KEY,
          VIEWER_HEADER_FONT_SIZE_KEY, VIEWER_REQUESTER_FONT_SIZE_KEY, VIEWER_TRACK_FONT_SIZE_KEY,
          VIEWER_COLUMN_WIDTH_KEY, VIEWER_CONTENT_PADDING_LEFT_KEY, VIEWER_CONTENT_PADDING_RIGHT_KEY,
          VIEWER_HEADER_ROW_HEIGHT_KEY, VIEWER_TOPBAR_HEIGHT_KEY, VIEWER_COUNTS_ROW_HEIGHT_KEY,
          VIEWER_ROW_HEIGHT_KEY, VIEWER_REQUESTER_SECTION_HEIGHT_KEY, VIEWER_NEXT_STREAM_HEADER_HEIGHT_KEY,
        ];
        const values = await AsyncStorage.multiGet(keys);
        const map = new Map(values);

        const p = (key: string) => { const v = map.get(key); return v ? parseInt(v, 10) : null; };

        // DJ settings
        const v1 = p(DJ_HEADER_FONT_SIZE_KEY); if (v1 != null) setDjHeaderFontSize(v1);
        const v2 = p(DJ_REQUESTER_FONT_SIZE_KEY); if (v2 != null) setDjRequesterFontSize(v2);
        const v3 = p(DJ_TRACK_FONT_SIZE_KEY); if (v3 != null) setDjTrackFontSize(v3);
        const v4 = p(DJ_COLUMN_WIDTH_KEY); if (v4 != null) setDjColumnWidth(v4);
        const v5 = p(DJ_CONTENT_PADDING_LEFT_KEY); if (v5 != null) setDjContentPaddingLeft(v5);
        const v6 = p(DJ_CONTENT_PADDING_RIGHT_KEY); if (v6 != null) setDjContentPaddingRight(v6);
        const v7 = p(DJ_TITLEBAR_RIGHT_WIDTH_KEY); if (v7 != null) setDjTitleBarRightWidth(v7);
        const v8 = p(DJ_TOPBAR_RIGHT_WIDTH_KEY); if (v8 != null) setDjTopBarRightWidth(v8);
        const v9 = p(DJ_HEADER_ROW_HEIGHT_KEY); if (v9 != null) setDjHeaderRowHeight(v9);
        const v10 = p(DJ_TOPBAR_HEIGHT_KEY); if (v10 != null) setDjTopBarHeight(v10);
        const v11 = p(DJ_COUNTS_ROW_HEIGHT_KEY); if (v11 != null) setDjCountsRowHeight(v11);
        const v12 = p(DJ_ROW_HEIGHT_KEY); if (v12 != null) setDjRowHeight(v12);
        const v13 = p(DJ_REQUESTER_SECTION_HEIGHT_KEY); if (v13 != null) setDjRequesterSectionHeight(v13);
        const v14 = p(DJ_NEXT_STREAM_HEADER_HEIGHT_KEY); if (v14 != null) setDjNextStreamHeaderHeight(v14);

        // Viewer settings
        const v15 = p(VIEWER_HEADER_FONT_SIZE_KEY); if (v15 != null) setViewerHeaderFontSize(v15);
        const v16 = p(VIEWER_REQUESTER_FONT_SIZE_KEY); if (v16 != null) setViewerRequesterFontSize(v16);
        const v17 = p(VIEWER_TRACK_FONT_SIZE_KEY); if (v17 != null) setViewerTrackFontSize(v17);
        const v18 = p(VIEWER_COLUMN_WIDTH_KEY); if (v18 != null) setViewerColumnWidth(v18);
        const v19 = p(VIEWER_CONTENT_PADDING_LEFT_KEY); if (v19 != null) setViewerContentPaddingLeft(v19);
        const v20 = p(VIEWER_CONTENT_PADDING_RIGHT_KEY); if (v20 != null) setViewerContentPaddingRight(v20);
        const v21 = p(VIEWER_HEADER_ROW_HEIGHT_KEY); if (v21 != null) setViewerHeaderRowHeight(v21);
        const v22 = p(VIEWER_TOPBAR_HEIGHT_KEY); if (v22 != null) setViewerTopBarHeight(v22);
        const v23 = p(VIEWER_COUNTS_ROW_HEIGHT_KEY); if (v23 != null) setViewerCountsRowHeight(v23);
        const v24 = p(VIEWER_ROW_HEIGHT_KEY); if (v24 != null) setViewerRowHeight(v24);
        const v25 = p(VIEWER_REQUESTER_SECTION_HEIGHT_KEY); if (v25 != null) setViewerRequesterSectionHeight(v25);
        const v26 = p(VIEWER_NEXT_STREAM_HEADER_HEIGHT_KEY); if (v26 != null) setViewerNextStreamHeaderHeight(v26);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (licenseKey) {
      setLicenseInput(licenseKey);
      setCurrentLicenseKey(licenseKey);
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
      Alert.alert(
        'Request Sent',
        'Please check your email for your license key. It may take up to 24 hours to receive your key.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Unable to open email client. Please email Admin@cuecontrolapp.com directly.');
    }
  };

  // Helper to save a setting
  const saveSetting = async (key: string, value: number) => {
    await AsyncStorage.setItem(key, value.toString());
  };

  return (
    <View style={styles.container}>
      {/* Custom header matching desktop style */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>CueControl - Settings</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.headerButton, styles.infoButton]}
              onPress={() => setAboutVisible(true)}
            >
              <Ionicons name="information" size={s(16)} color={colors.accent.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              testID="settings-close-button"
              style={[styles.headerButton, styles.closeButton]}
              onPress={handleBack}
            >
              <Ionicons name="close" size={s(16)} color={colors.status.error} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          testID="settings-tab-license"
          style={[styles.tab, activeTab === 'license' && styles.tabActive]}
          onPress={() => setActiveTab('license')}
        >
          <Text style={[styles.tabText, activeTab === 'license' && styles.tabTextActive]}>
            License
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="settings-tab-admin"
          style={[styles.tab, activeTab === 'admin' && styles.tabActive]}
          onPress={() => setActiveTab('admin')}
        >
          <Text style={[styles.tabText, activeTab === 'admin' && styles.tabTextActive]}>
            Admin
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="settings-tab-account"
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
                  testID="settings-license-input"
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
                    testID="settings-validate-button"
                    style={styles.validateButton}
                    onPress={handleValidateLicense}
                  >
                    <Text style={styles.validateButtonText}>Validate</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    testID="settings-save-license-button"
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
                  <Ionicons name="mail-outline" size={s(18)} color={colors.text.primary} />
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
                      testID="settings-handle-input"
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
                    testID="settings-save-handle-button"
                    style={[styles.saveButton, savingHandle && styles.buttonDisabled]}
                    onPress={handleSaveHandle}
                    disabled={savingHandle}
                  >
                    <Ionicons name="save-outline" size={s(18)} color={colors.text.primary} />
                    <Text style={styles.saveButtonText}>
                      {savingHandle ? 'Saving...' : 'Save Stream ID'}
                    </Text>
                  </TouchableOpacity>

                  {djHandle && (
                    <>
                      <View style={styles.divider} />
                      <Text style={styles.shareLabel}>Share with viewers:</Text>
                      <TouchableOpacity style={styles.copyButton} onPress={handleCopyHandle}>
                        <Ionicons name="copy-outline" size={s(18)} color={colors.accent.primary} />
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

        {activeTab === 'admin' && (
          <>
            {/* DJ Dashboard collapsible section */}
            <TouchableOpacity
              testID="settings-dj-dashboard-header"
              style={styles.collapsibleHeader}
              onPress={() => setDjExpanded(!djExpanded)}
            >
              <Text style={styles.collapsibleTitle}>DJ Dashboard</Text>
              <Ionicons
                name={djExpanded ? 'chevron-up' : 'chevron-down'}
                size={s(18)}
                color={colors.accent.primary}
              />
            </TouchableOpacity>

            {djExpanded && (
              <>
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Font Sizes</Text>
                  </View>
                  <View style={styles.displayContainer}>
                    <SettingRow testID="dj-header-font-size" label="Header Font Size" value={djHeaderFontSize} min={8} max={20} step={1}
                      onChange={(v) => { setDjHeaderFontSize(v); saveSetting(DJ_HEADER_FONT_SIZE_KEY, v); }} />
                    <SettingRow testID="dj-requester-font-size" label="Requester Font Size" value={djRequesterFontSize} min={10} max={20} step={1}
                      onChange={(v) => { setDjRequesterFontSize(v); saveSetting(DJ_REQUESTER_FONT_SIZE_KEY, v); }} />
                    <SettingRow testID="dj-track-font-size" label="Track Font Size" value={djTrackFontSize} min={10} max={20} step={1} isLast
                      onChange={(v) => { setDjTrackFontSize(v); saveSetting(DJ_TRACK_FONT_SIZE_KEY, v); }} />
                  </View>
                </View>

                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Column & Padding</Text>
                  </View>
                  <View style={styles.displayContainer}>
                    <SettingRow label="Column Width" value={djColumnWidth} min={70} max={140} step={2}
                      onChange={(v) => { setDjColumnWidth(v); saveSetting(DJ_COLUMN_WIDTH_KEY, v); }} />
                    <SettingRow label="Content Padding Left" value={djContentPaddingLeft} min={0} max={20} step={1}
                      onChange={(v) => { setDjContentPaddingLeft(v); saveSetting(DJ_CONTENT_PADDING_LEFT_KEY, v); }} />
                    <SettingRow label="Content Padding Right" value={djContentPaddingRight} min={0} max={20} step={1}
                      onChange={(v) => { setDjContentPaddingRight(v); saveSetting(DJ_CONTENT_PADDING_RIGHT_KEY, v); }} />
                    <SettingRow label="Title Bar Right Width" value={djTitleBarRightWidth} min={70} max={140} step={2}
                      onChange={(v) => { setDjTitleBarRightWidth(v); saveSetting(DJ_TITLEBAR_RIGHT_WIDTH_KEY, v); }} />
                    <SettingRow label="Top Bar Right Width" value={djTopBarRightWidth} min={70} max={140} step={2} isLast
                      onChange={(v) => { setDjTopBarRightWidth(v); saveSetting(DJ_TOPBAR_RIGHT_WIDTH_KEY, v); }} />
                  </View>
                </View>

                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Heights</Text>
                  </View>
                  <View style={styles.displayContainer}>
                    <SettingRow testID="dj-header-row-height" label="Header Row Height" value={djHeaderRowHeight} min={40} max={120} step={2}
                      onChange={(v) => { setDjHeaderRowHeight(v); saveSetting(DJ_HEADER_ROW_HEIGHT_KEY, v); }} />
                    <SettingRow label="Top Bar Height" value={djTopBarHeight} min={25} max={60} step={2}
                      onChange={(v) => { setDjTopBarHeight(v); saveSetting(DJ_TOPBAR_HEIGHT_KEY, v); }} />
                    <SettingRow label="Counts Row Height" value={djCountsRowHeight} min={20} max={50} step={2}
                      onChange={(v) => { setDjCountsRowHeight(v); saveSetting(DJ_COUNTS_ROW_HEIGHT_KEY, v); }} />
                    <SettingRow label="Row Height" value={djRowHeight} min={40} max={120} step={2}
                      onChange={(v) => { setDjRowHeight(v); saveSetting(DJ_ROW_HEIGHT_KEY, v); }} />
                    <SettingRow label="Requester Section Height" value={djRequesterSectionHeight} min={25} max={60} step={2}
                      onChange={(v) => { setDjRequesterSectionHeight(v); saveSetting(DJ_REQUESTER_SECTION_HEIGHT_KEY, v); }} />
                    <SettingRow label="Next Stream Header Height" value={djNextStreamHeaderHeight} min={25} max={60} step={2} isLast
                      onChange={(v) => { setDjNextStreamHeaderHeight(v); saveSetting(DJ_NEXT_STREAM_HEADER_HEIGHT_KEY, v); }} />
                  </View>
                </View>
              </>
            )}

            {/* Viewer Dashboard collapsible section */}
            <TouchableOpacity
              testID="settings-viewer-dashboard-header"
              style={styles.collapsibleHeader}
              onPress={() => setViewerExpanded(!viewerExpanded)}
            >
              <Text style={styles.collapsibleTitle}>Viewer Dashboard</Text>
              <Ionicons
                name={viewerExpanded ? 'chevron-up' : 'chevron-down'}
                size={s(18)}
                color={colors.accent.primary}
              />
            </TouchableOpacity>

            {viewerExpanded && (
              <>
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Font Sizes</Text>
                  </View>
                  <View style={styles.displayContainer}>
                    <SettingRow label="Header Font Size" value={viewerHeaderFontSize} min={8} max={20} step={1}
                      onChange={(v) => { setViewerHeaderFontSize(v); saveSetting(VIEWER_HEADER_FONT_SIZE_KEY, v); }} />
                    <SettingRow label="Requester Font Size" value={viewerRequesterFontSize} min={10} max={20} step={1}
                      onChange={(v) => { setViewerRequesterFontSize(v); saveSetting(VIEWER_REQUESTER_FONT_SIZE_KEY, v); }} />
                    <SettingRow label="Track Font Size" value={viewerTrackFontSize} min={10} max={20} step={1} isLast
                      onChange={(v) => { setViewerTrackFontSize(v); saveSetting(VIEWER_TRACK_FONT_SIZE_KEY, v); }} />
                  </View>
                </View>

                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Column & Padding</Text>
                  </View>
                  <View style={styles.displayContainer}>
                    <SettingRow label="Column Width" value={viewerColumnWidth} min={70} max={140} step={2}
                      onChange={(v) => { setViewerColumnWidth(v); saveSetting(VIEWER_COLUMN_WIDTH_KEY, v); }} />
                    <SettingRow label="Content Padding Left" value={viewerContentPaddingLeft} min={0} max={20} step={1}
                      onChange={(v) => { setViewerContentPaddingLeft(v); saveSetting(VIEWER_CONTENT_PADDING_LEFT_KEY, v); }} />
                    <SettingRow label="Content Padding Right" value={viewerContentPaddingRight} min={0} max={20} step={1} isLast
                      onChange={(v) => { setViewerContentPaddingRight(v); saveSetting(VIEWER_CONTENT_PADDING_RIGHT_KEY, v); }} />
                  </View>
                </View>

                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Heights</Text>
                  </View>
                  <View style={styles.displayContainer}>
                    <SettingRow label="Header Row Height" value={viewerHeaderRowHeight} min={30} max={100} step={2}
                      onChange={(v) => { setViewerHeaderRowHeight(v); saveSetting(VIEWER_HEADER_ROW_HEIGHT_KEY, v); }} />
                    <SettingRow label="Top Bar Height" value={viewerTopBarHeight} min={25} max={60} step={2}
                      onChange={(v) => { setViewerTopBarHeight(v); saveSetting(VIEWER_TOPBAR_HEIGHT_KEY, v); }} />
                    <SettingRow label="Counts Row Height" value={viewerCountsRowHeight} min={20} max={50} step={2}
                      onChange={(v) => { setViewerCountsRowHeight(v); saveSetting(VIEWER_COUNTS_ROW_HEIGHT_KEY, v); }} />
                    <SettingRow label="Row Height" value={viewerRowHeight} min={40} max={120} step={2}
                      onChange={(v) => { setViewerRowHeight(v); saveSetting(VIEWER_ROW_HEIGHT_KEY, v); }} />
                    <SettingRow label="Requester Section Height" value={viewerRequesterSectionHeight} min={25} max={60} step={2}
                      onChange={(v) => { setViewerRequesterSectionHeight(v); saveSetting(VIEWER_REQUESTER_SECTION_HEIGHT_KEY, v); }} />
                    <SettingRow label="Next Stream Header Height" value={viewerNextStreamHeaderHeight} min={25} max={60} step={2} isLast
                      onChange={(v) => { setViewerNextStreamHeaderHeight(v); saveSetting(VIEWER_NEXT_STREAM_HEADER_HEIGHT_KEY, v); }} />
                  </View>
                </View>
              </>
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
                  <Ionicons name="person-circle" size={s(48)} color={colors.accent.primary} />
                  <View style={styles.accountDetails}>
                    <Text testID="settings-account-email" style={styles.accountEmail}>{user?.email || 'Not signed in'}</Text>
                    <Text style={styles.accountStatus}>Signed in</Text>
                  </View>
                </View>

                <TouchableOpacity
                  testID="settings-signout-button"
                  style={styles.logoutButton}
                  onPress={handleLogout}
                  disabled={isLoading}
                >
                  <Ionicons name="log-out-outline" size={s(20)} color={colors.status.error} />
                  <Text style={styles.logoutButtonText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </View>

          </>
        )}

        {/* Save Settings Button */}
        <View style={styles.saveSettingsContainer}>
          <TouchableOpacity testID="settings-save-button" style={styles.saveSettingsButton} onPress={handleBack}>
            <Ionicons name="checkmark" size={s(20)} color={colors.text.primary} />
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
  headerButton: {
    width: s(25),
    height: s(25),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: s(2),
    borderRadius: 0,
    backgroundColor: colors.background.main,
  },
  infoButton: {
    borderColor: colors.accent.primary,
  },
  closeButton: {
    borderColor: colors.status.error,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background.panel,
    borderBottomWidth: s(2),
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: s(2),
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
    paddingBottom: s(100),
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
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.main,
    borderBottomWidth: s(2),
    borderBottomColor: colors.border,
    borderTopWidth: s(2),
    borderTopColor: colors.border,
  },
  collapsibleTitle: {
    fontFamily: 'Helvetica Neue',
    fontSize: fs(18),
    fontWeight: '800',
    color: colors.accent.primary,
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
    fontSize: fs(18),
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
    fontSize: fs(18),
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
    fontSize: fs(15),
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
    fontSize: fs(15),
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
    fontSize: fs(15),
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 1,
  },
  accountStatus: {
    fontFamily: 'Helvetica Neue',
    fontSize: fs(15),
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
    fontSize: fs(18),
    fontWeight: '800',
    letterSpacing: 1,
  },
  requestLabel: {
    fontFamily: 'Helvetica Neue',
    fontSize: fs(15),
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
    fontSize: fs(18),
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
    fontSize: fs(15),
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
    fontSize: fs(18),
    fontWeight: '800',
    letterSpacing: 1,
  },
});
