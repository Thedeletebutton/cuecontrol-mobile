import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../src/context/AuthContext';
import { useAppModeContext } from '../../src/context/AppModeContext';
import { AboutModal } from '../../src/components/AboutModal';
import { ViewerSettingsModal } from '../../src/components/ViewerSettingsModal';
import { RequestCard } from '../../src/components/RequestCard';
import { useViewerRequests, useViewerNextStream } from '../../src/hooks/useViewerRequests';
import { lookupDJByHandle, subscribeToCurrentRequester, setCurrentLicenseKey } from '../../src/services/requests';
import { getFirebaseDatabase, initializeFirebase } from '../../src/services/firebase';
import { FIREBASE_CONFIG, IS_CONFIGURED } from '../../src/config/firebase.config';
import { colors, typography, spacing } from '../../src/constants/theme';
import { Request } from '../../src/types/request';
import { s, fs } from '../../src/utils/responsive';

const DJ_HANDLE_STORAGE = '@cuecontrol_viewer_dj_handle';
const RECENT_HANDLES_STORAGE = '@cuecontrol_recent_handles';
const SAVE_DJ_HANDLE_KEY = '@cuecontrol_save_dj_handle';
const SAVE_USERNAME_KEY = '@cuecontrol_save_username';
const LABEL_FONT_SIZE_KEY = '@cuecontrol_viewer_label_font_size';
const INPUT_FONT_SIZE_KEY = '@cuecontrol_viewer_input_font_size';
const DJ_COLUMN_WIDTH_KEY = '@cuecontrol_dj_column_width';
const DJ_CONTENT_PADDING_LEFT_KEY = '@cuecontrol_dj_content_padding_left';
const DJ_CONTENT_PADDING_RIGHT_KEY = '@cuecontrol_dj_content_padding_right';
const MAX_RECENT_HANDLES = 5;

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function ViewerDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { clearMode } = useAppModeContext();

  const [djHandle, setDjHandle] = useState('');
  const [djDisplayName, setDjDisplayName] = useState('');
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [aboutVisible, setAboutVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [saveDjHandle, setSaveDjHandle] = useState(true);
  const [saveUsername, setSaveUsername] = useState(true);
  const [labelFontSize, setLabelFontSize] = useState(15);
  const [inputFontSize, setInputFontSize] = useState(15);
  const [recentHandles, setRecentHandles] = useState<string[]>([]);
  const [columnWidth, setColumnWidth] = useState(98);
  const [contentPaddingLeft, setContentPaddingLeft] = useState(5);
  const [contentPaddingRight, setContentPaddingRight] = useState(8);

  const { requests, loading, totalCount, unplayedCount, playedCount } = useViewerRequests(licenseKey);
  const { requests: nextStreamRequests, count: nextStreamCount } = useViewerNextStream(licenseKey);
  const [currentRequester, setCurrentRequester] = useState<{ username: string; requestId: number; timestamp: number } | null>(null);

  // Subscribe to current requester when connected
  useEffect(() => {
    if (licenseKey) {
      setCurrentLicenseKey(licenseKey);
      const unsubscribe = subscribeToCurrentRequester((requester) => {
        setCurrentRequester(requester);
      }, licenseKey);
      return unsubscribe;
    } else {
      setCurrentRequester(null);
    }
  }, [licenseKey]);

  // Load saved settings on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedDjHandle = await AsyncStorage.getItem(DJ_HANDLE_STORAGE);
        const savedSaveDjHandle = await AsyncStorage.getItem(SAVE_DJ_HANDLE_KEY);
        const savedSaveUsername = await AsyncStorage.getItem(SAVE_USERNAME_KEY);
        const savedLabelFontSize = await AsyncStorage.getItem(LABEL_FONT_SIZE_KEY);
        const savedInputFontSize = await AsyncStorage.getItem(INPUT_FONT_SIZE_KEY);

        const savedRecentHandles = await AsyncStorage.getItem(RECENT_HANDLES_STORAGE);
        const savedColumnWidth = await AsyncStorage.getItem(DJ_COLUMN_WIDTH_KEY);
        const savedPaddingLeft = await AsyncStorage.getItem(DJ_CONTENT_PADDING_LEFT_KEY);
        const savedPaddingRight = await AsyncStorage.getItem(DJ_CONTENT_PADDING_RIGHT_KEY);

        if (savedSaveDjHandle !== null) setSaveDjHandle(savedSaveDjHandle === 'true');
        if (savedSaveUsername !== null) setSaveUsername(savedSaveUsername === 'true');
        if (savedLabelFontSize) setLabelFontSize(parseInt(savedLabelFontSize, 10));
        if (savedInputFontSize) setInputFontSize(parseInt(savedInputFontSize, 10));
        if (savedRecentHandles) setRecentHandles(JSON.parse(savedRecentHandles));
        if (savedColumnWidth) setColumnWidth(parseInt(savedColumnWidth, 10));
        if (savedPaddingLeft) setContentPaddingLeft(parseInt(savedPaddingLeft, 10));
        if (savedPaddingRight) setContentPaddingRight(parseInt(savedPaddingRight, 10));

        if (savedDjHandle) {
          setDjHandle(savedDjHandle);
          connectToStream(savedDjHandle);
        }
      } catch (error) {
        console.error('Failed to load saved data:', error);
      }
    };
    loadSavedData();
  }, []);

  const connectToStream = async (handle: string) => {
    const normalized = handle.toLowerCase().trim();
    if (!normalized || normalized.length < 3) {
      setLookupError('Stream ID must be at least 3 characters');
      return;
    }

    setLookupLoading(true);
    setLookupError('');

    try {
      // Ensure Firebase is initialized
      if (!getFirebaseDatabase() && IS_CONFIGURED) {
        initializeFirebase(FIREBASE_CONFIG);
      }

      const result = await lookupDJByHandle(normalized);
      if (!result) {
        setLookupError('Stream not found. Please check the ID and try again.');
        setLicenseKey(null);
        return;
      }

      setDjDisplayName(result.displayName);
      setLicenseKey(result.licenseKey);

      if (saveDjHandle) {
        await AsyncStorage.setItem(DJ_HANDLE_STORAGE, normalized);
      }

      // Save to recent handles
      const updated = [normalized, ...recentHandles.filter(h => h !== normalized)].slice(0, MAX_RECENT_HANDLES);
      setRecentHandles(updated);
      await AsyncStorage.setItem(RECENT_HANDLES_STORAGE, JSON.stringify(updated));
    } catch (error: any) {
      setLookupError(error.message || 'Failed to connect. Please try again.');
      setLicenseKey(null);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleDjHandleChange = (text: string) => {
    const cleaned = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setDjHandle(cleaned);
    setLookupError('');
  };

  const handleConnect = () => {
    connectToStream(djHandle);
  };

  const handleDisconnect = async () => {
    setLicenseKey(null);
    setDjDisplayName('');
    setDjHandle('');
    setLookupError('');
    await AsyncStorage.removeItem(DJ_HANDLE_STORAGE);
  };

  const handleBack = async () => {
    await clearMode();
    router.replace('/');
  };

  const handleSignOut = async () => {
    await AsyncStorage.multiRemove([
      'cuecontrol_saved_credentials',
      'cuecontrol_stay_signed_in',
    ]);
    await logout();
    await clearMode();
    router.replace('/auth/login');
  };

  const renderHeader = () => (
    <View style={styles.headerBar}>
      {licenseKey && (
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={[styles.iconButton, styles.backButtonHeader]}
            onPress={handleDisconnect}
          >
            <Ionicons name="arrow-back" size={s(14)} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      )}
      <Text style={styles.headerBarTitle}>
        {djDisplayName ? (
          <>
            <Text style={styles.channelName}>{capitalize(djDisplayName)}'s </Text>
            CueControl
          </>
        ) : (
          'CueControl'
        )}
      </Text>
      <View style={[styles.headerButtons, { width: s(columnWidth) }]}>
        <TouchableOpacity
          style={[styles.iconButton, styles.infoButton]}
          onPress={() => setAboutVisible(true)}
        >
          <Ionicons name="information" size={s(16)} color={colors.accent.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, styles.settingsButtonIcon]}
          onPress={() => setSettingsVisible(true)}
        >
          <Ionicons name="settings-sharp" size={s(14)} color={colors.text.grey} />
        </TouchableOpacity>
        <TouchableOpacity
          testID="switch-mode-button"
          style={[styles.iconButton, styles.closeButton]}
          onPress={handleBack}
        >
          <Ionicons name="close" size={s(16)} color={colors.status.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStreamBar = () => {
    if (licenseKey) {
      // Connected: full-width submit request button
      return (
        <TouchableOpacity
          testID="viewer-submit-request-button"
          style={styles.submitRequestRow}
          onPress={() => router.push('/viewer/request')}
        >
          <View style={styles.submitRequestInner}>
            <Text style={styles.submitRequestRowText}>SUBMIT REQUEST</Text>
            <Ionicons name="chevron-forward" size={s(18)} color={colors.text.primary} />
          </View>
        </TouchableOpacity>
      );
    }

    // Not connected: stream ID input
    return (
      <View style={styles.streamBar}>
        <View style={styles.handleInputContainer}>
          <Text style={styles.handlePrefix}>@</Text>
          <TextInput
            testID="viewer-dashboard-handle-input"
            style={styles.handleInput}
            value={djHandle}
            onChangeText={handleDjHandleChange}
            placeholder="stream_id"
            placeholderTextColor={colors.text.muted}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
            onSubmitEditing={handleConnect}
            returnKeyType="go"
          />
        </View>
        <TouchableOpacity
          testID="viewer-dashboard-connect-button"
          style={[styles.connectButton, lookupLoading && styles.connectButtonDisabled]}
          onPress={handleConnect}
          disabled={lookupLoading}
        >
          {lookupLoading ? (
            <ActivityIndicator size="small" color={colors.text.primary} />
          ) : (
            <Text style={styles.connectButtonText}>View Queue</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderCounts = () => (
    <View style={styles.countsRow}>
      <Text style={styles.summaryText}>
        Total<Text style={styles.colon}>:</Text> <Text style={styles.summaryValue}>{totalCount}</Text>
      </Text>
      <Text style={styles.summaryText}>
        Unplayed<Text style={styles.colon}>:</Text> <Text style={styles.summaryValue}>{unplayedCount}</Text>
      </Text>
      <Text style={styles.summaryText}>
        Played<Text style={styles.colon}>:</Text> <Text style={styles.summaryValue}>{playedCount}</Text>
      </Text>
    </View>
  );

  const renderColumnHeaders = () => (
    <View style={styles.headerRow}>
      <View style={[styles.headerCell, styles.contentHeader, { paddingLeft: s(contentPaddingLeft), paddingRight: s(contentPaddingRight) }]}>
        <Text style={styles.headerText} numberOfLines={1}>REQUESTED BY:</Text>
        <Text style={styles.headerSubText} numberOfLines={1}>ARTIST - TRACK:</Text>
      </View>
      <View style={[styles.headerCell, styles.statusHeaderLast, { width: s(columnWidth) }]}>
        <Text style={styles.headerText} numberOfLines={1}>STATUS:</Text>
      </View>
    </View>
  );

  // Not connected state
  if (!licenseKey) {
    return (
      <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {renderHeader()}
        {renderStreamBar()}
        {lookupError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{lookupError}</Text>
          </View>
        ) : null}
        <View style={styles.emptyContainer}>
          <Ionicons name="radio-outline" size={s(64)} color={colors.text.muted} />
          <Text style={styles.emptyTitle}>Enter a Stream ID</Text>
          <Text style={styles.emptyText}>
            Enter a DJ's stream ID above to view their live request queue
          </Text>
          {recentHandles.length > 0 && (
            <View style={styles.recentSection}>
              <Text style={styles.recentTitle}>RECENT:</Text>
              {recentHandles.map((handle) => (
                <TouchableOpacity
                  key={handle}
                  style={styles.recentItem}
                  onPress={() => {
                    setDjHandle(handle);
                    connectToStream(handle);
                  }}
                >
                  <Text style={styles.recentAt}>@</Text>
                  <Text style={styles.recentHandle}>{capitalize(handle)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
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

  // Connected — show live dashboard
  return (
    <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      {renderHeader()}
      {renderStreamBar()}

      {/* Section Title */}
      <View style={styles.topBar}>
        <Text style={styles.sectionTitle}>TRACK REQUESTS:</Text>
      </View>

      {renderCounts()}
      {renderColumnHeaders()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <RequestCard
              request={item}
              index={index}
              mode="viewer"
              columnWidth={columnWidth}
              contentPaddingLeft={contentPaddingLeft}
              contentPaddingRight={contentPaddingRight}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              <Text style={styles.emptyListTitle}>NO REQUESTS YET</Text>
              <Text style={styles.emptyListText}>
                Be the first to submit a request!
              </Text>
            </View>
          }
          ListFooterComponent={
            <>
              {/* Next Stream Section */}
              <View style={styles.nextStreamHeader}>
                <Text style={styles.nextStreamTitle}>NEXT STREAM:</Text>
              </View>
              <View style={styles.nextStreamCountsRow}>
                <Text style={styles.nextStreamCount}>
                  Total<Text style={styles.colon}>:</Text> <Text style={styles.nextStreamCountValue}>{nextStreamCount}</Text>
                </Text>
              </View>

              {/* Next Stream Column Headers */}
              {renderColumnHeaders()}

              {nextStreamRequests.length === 0 ? (
                <View style={styles.nextStreamEmptyContainer}>
                  <Text style={styles.nextStreamEmptyText}>
                    NO TRACKS SAVED FOR NEXT STREAM
                  </Text>
                </View>
              ) : (
                nextStreamRequests.map((item, index) => (
                  <RequestCard
                    key={item.id.toString()}
                    request={item}
                    index={index}
                    mode="viewer"
                    isNextStream
                    columnWidth={columnWidth}
                    contentPaddingLeft={contentPaddingLeft}
                    contentPaddingRight={contentPaddingRight}
                  />
                ))
              )}

              {/* Requested By Section */}
              <View style={styles.sectionBorder} />
              <View style={styles.requesterSection}>
                <Text style={styles.requesterLabel}>REQUESTED BY:</Text>
                <Text style={[styles.requesterName, !currentRequester && { color: colors.text.primary }]}>
                  {currentRequester ? currentRequester.username : '—'}
                </Text>
              </View>
              <View style={styles.sectionBorder} />
              <View style={{ height: s(80) }} />
            </>
          }
        />
      )}

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
    height: s(35),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.main,
    borderBottomWidth: s(2),
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: s(35),
    borderRightWidth: s(2),
    borderRightColor: colors.border,
    height: '100%',
  },
  backButtonHeader: {
    borderColor: colors.border,
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
  channelName: {
    color: colors.accent.primary,
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
  infoButton: {
    borderColor: colors.accent.primary,
  },
  infoButtonText: {
    fontFamily: 'Helvetica Neue',
    color: colors.accent.primary,
    fontSize: fs(15),
    fontWeight: '800',
    letterSpacing: 1,
  },
  settingsButtonIcon: {
    borderColor: colors.text.grey,
  },
  closeButton: {
    borderColor: colors.status.error,
  },
  closeButtonText: {
    fontFamily: 'Helvetica Neue',
    color: colors.status.error,
    fontSize: fs(15),
    fontWeight: '800',
    letterSpacing: 1,
  },
  streamBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.sm,
    paddingRight: s(2),
    height: s(40),
    backgroundColor: colors.background.main,
    borderBottomWidth: s(2),
    borderBottomColor: colors.border,
    gap: s(8),
  },
  handleInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.row,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    height: s(30),
  },
  handlePrefix: {
    fontFamily: 'Helvetica Neue',
    paddingLeft: s(8),
    fontSize: fs(15),
    color: colors.text.muted,
    fontWeight: '800',
    letterSpacing: 1,
  },
  handleInput: {
    fontFamily: 'Helvetica Neue',
    flex: 1,
    paddingHorizontal: s(4),
    fontSize: fs(15),
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 1,
    height: '100%',
  },
  connectButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: s(12),
    height: s(30),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  connectButtonDisabled: {
    opacity: 0.5,
  },
  connectButtonText: {
    fontFamily: 'Helvetica Neue',
    color: colors.text.primary,
    fontSize: fs(15),
    fontWeight: '800',
    letterSpacing: 1,
  },
  submitRequestRow: {
    height: s(40),
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: s(2),
    paddingRight: spacing.sm - 2,
    borderWidth: s(2),
    borderColor: colors.accent.primary,
    borderBottomColor: colors.border,
  },
  submitRequestInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  submitRequestRowText: {
    fontFamily: 'Helvetica Neue',
    color: colors.text.primary,
    fontSize: fs(18),
    fontWeight: '800',
    letterSpacing: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingLeft: s(5),
    paddingRight: spacing.sm,
    height: s(38),
    backgroundColor: colors.background.main,
    borderBottomWidth: s(2),
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontFamily: 'Helvetica Neue',
    fontSize: fs(18),
    fontWeight: '800',
    color: colors.accent.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  countsRow: {
    flexDirection: 'row',
    gap: s(12),
    alignItems: 'center',
    paddingLeft: s(5),
    paddingRight: spacing.sm,
    height: s(30),
    backgroundColor: colors.background.main,
    borderBottomWidth: s(2),
    borderBottomColor: colors.border,
  },
  summaryText: {
    fontFamily: 'Helvetica Neue',
    fontSize: fs(15),
    color: colors.text.secondary,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 1,
  },
  summaryValue: {
    fontFamily: 'Helvetica Neue',
    fontSize: fs(15),
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.text.primary,
  },
  colon: {
    fontFamily: 'Helvetica Neue',
    fontSize: fs(15),
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.background.main,
    minHeight: s(40),
    borderBottomWidth: s(2),
    borderBottomColor: colors.border,
  },
  headerCell: {
    justifyContent: 'center',
    paddingLeft: s(5),
    paddingRight: s(8),
    borderRightWidth: s(2),
    borderRightColor: colors.border,
  },
  headerText: {
    fontFamily: 'Helvetica Neue',
    fontSize: fs(15),
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 1,
    textAlign: 'left',
  },
  headerSubText: {
    fontFamily: 'Helvetica Neue',
    fontSize: fs(15),
    fontWeight: '800',
    color: colors.text.secondary,
    letterSpacing: 1,
    textAlign: 'left',
  },
  contentHeader: {
    flex: 1,
    alignItems: 'flex-start',
    paddingVertical: s(2),
  },
  statusHeaderLast: {
    width: s(96),
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(255, 59, 59, 0.1)',
  },
  errorText: {
    fontFamily: 'Helvetica Neue',
    color: colors.status.error,
    fontSize: fs(15),
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontFamily: 'Helvetica Neue',
    fontSize: fs(15),
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: 'Helvetica Neue',
    fontSize: fs(15),
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.text.muted,
    textAlign: 'center',
  },
  recentSection: {
    marginTop: spacing.xl,
    width: '100%',
  },
  recentTitle: {
    fontFamily: 'Helvetica Neue',
    fontSize: fs(15),
    fontWeight: '800',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.row,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  recentAt: {
    fontFamily: 'Helvetica Neue',
    fontSize: fs(15),
    color: colors.text.muted,
    fontWeight: '800',
  },
  recentHandle: {
    fontFamily: 'Helvetica Neue',
    fontSize: fs(15),
    color: colors.accent.primary,
    fontWeight: '800',
  },
  emptyListContainer: {
    padding: s(12),
    alignItems: 'center',
  },
  emptyListTitle: {
    fontFamily: 'Helvetica Neue',
    fontSize: fs(15),
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emptyListText: {
    fontFamily: 'Helvetica Neue',
    fontSize: fs(15),
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  nextStreamHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingLeft: s(5),
    paddingRight: spacing.sm,
    height: s(38),
    backgroundColor: colors.background.main,
    borderBottomWidth: s(2),
    borderBottomColor: colors.border,
  },
  nextStreamTitle: {
    fontFamily: 'Helvetica Neue',
    fontSize: fs(18),
    fontWeight: '800',
    color: colors.accent.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nextStreamCountsRow: {
    flexDirection: 'row',
    gap: s(12),
    alignItems: 'center',
    paddingLeft: s(5),
    paddingRight: spacing.sm,
    height: s(30),
    backgroundColor: colors.background.main,
    borderBottomWidth: s(2),
    borderBottomColor: colors.border,
  },
  nextStreamCount: {
    fontFamily: 'Helvetica Neue',
    fontSize: fs(15),
    color: colors.text.secondary,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 1,
  },
  nextStreamCountValue: {
    fontFamily: 'Helvetica Neue',
    fontSize: fs(15),
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.text.primary,
  },
  nextStreamEmptyContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  nextStreamEmptyText: {
    fontFamily: 'Helvetica Neue',
    fontSize: fs(15),
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.text.muted,
    textAlign: 'center',
  },
  sectionBorder: {
    height: s(2),
    backgroundColor: colors.border,
  },
  requesterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: s(5),
    paddingRight: spacing.sm,
    height: s(38),
    backgroundColor: colors.background.main,
    gap: s(8),
  },
  requesterLabel: {
    fontSize: fs(15),
    fontWeight: '800',
    color: colors.text.primary,
    fontFamily: 'Helvetica Neue',
    letterSpacing: 1,
  },
  requesterName: {
    fontSize: fs(15),
    fontWeight: '800',
    color: colors.requester.name,
    flex: 1,
    fontFamily: 'Helvetica Neue',
    letterSpacing: 1,
  },
});
