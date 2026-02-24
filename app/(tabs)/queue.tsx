import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  SafeAreaView,
} from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRequests } from '../../src/hooks/useRequests';
import { useNextStream } from '../../src/hooks/useNextStream';
import { useAuth } from '../../src/context/AuthContext';
import { useLicense } from '../../src/context/LicenseContext';
import { useAppModeContext } from '../../src/context/AppModeContext';
import { RequestCard } from '../../src/components/RequestCard';
import { ManualEntryModal } from '../../src/components/ManualEntryModal';
import { EditRequestModal } from '../../src/components/EditRequestModal';
import { AboutModal } from '../../src/components/AboutModal';
import {
  addRequest,
  updateRequestStatus,
  updateRequest,
  deleteRequest,
  deleteAllRequests,
  moveToNextStream,
  reorderRequests,
  setCurrentLicenseKey,
  getDJHandle,
  subscribeToCurrentRequester,
  setCurrentRequester,
  clearCurrentRequester,
} from '../../src/services/requests';
import {
  updateNextStreamRequest,
  deleteNextStreamRequest,
  moveFromNextStream,
} from '../../src/services/nextStream';
import { sendPushNotification } from '../../src/services/pushNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, typography, spacing } from '../../src/constants/theme';
import { Request } from '../../src/types/request';
import { s, fs } from '../../src/utils/responsive';

const DJ_COLUMN_WIDTH_KEY = '@cuecontrol_dj_column_width';
const DJ_CONTENT_PADDING_LEFT_KEY = '@cuecontrol_dj_content_padding_left';
const DJ_CONTENT_PADDING_RIGHT_KEY = '@cuecontrol_dj_content_padding_right';

export default function QueueScreen() {
  const router = useRouter();
  const { isAuthenticated, logout, user } = useAuth();
  const { licenseKey, isValidFormat } = useLicense();
  const { mode, clearMode } = useAppModeContext();

  const handleSignOut = () => {
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
            router.replace('/');
          },
        },
      ]
    );
  };

  // Set the license key for the requests service
  useEffect(() => {
    if (licenseKey && isValidFormat) {
      setCurrentLicenseKey(licenseKey);
    }
  }, [licenseKey, isValidFormat]);

  const { requests, loading, totalCount, unplayedCount, playedCount } = useRequests(licenseKey);
  const { requests: nextStreamRequests, count: nextStreamCount } = useNextStream(licenseKey);

  const unplayedRequests = useMemo(() => requests.filter(r => !r.played), [requests]);
  const playedRequests = useMemo(() => requests.filter(r => r.played), [requests]);

  const [refreshing, setRefreshing] = useState(false);
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRequest, setEditingRequest] = useState<Request | null>(null);
  const [editingNextStreamRequest, setEditingNextStreamRequest] = useState<Request | null>(null);
  const [aboutVisible, setAboutVisible] = useState(false);
  const [djHandle, setDjHandle] = useState<string | null>(null);
  const [currentRequester, setCurrentRequesterState] = useState<{ username: string; requestId: number; timestamp: number } | null>(null);
  const [columnWidth, setColumnWidth] = useState(98);
  const [contentPaddingLeft, setContentPaddingLeft] = useState(5);
  const [contentPaddingRight, setContentPaddingRight] = useState(8);

  // Load layout settings
  useEffect(() => {
    const loadLayoutSettings = async () => {
      try {
        const savedWidth = await AsyncStorage.getItem(DJ_COLUMN_WIDTH_KEY);
        const savedPadLeft = await AsyncStorage.getItem(DJ_CONTENT_PADDING_LEFT_KEY);
        const savedPadRight = await AsyncStorage.getItem(DJ_CONTENT_PADDING_RIGHT_KEY);
        if (savedWidth) setColumnWidth(parseInt(savedWidth, 10));
        if (savedPadLeft) setContentPaddingLeft(parseInt(savedPadLeft, 10));
        if (savedPadRight) setContentPaddingRight(parseInt(savedPadRight, 10));
      } catch (error) {
        console.error('Failed to load layout settings:', error);
      }
    };
    loadLayoutSettings();
  }, []);

  // Subscribe to current requester
  useEffect(() => {
    if (licenseKey && isValidFormat) {
      const unsubscribe = subscribeToCurrentRequester((requester) => {
        setCurrentRequesterState(requester);
      }, licenseKey);
      return unsubscribe;
    }
  }, [licenseKey, isValidFormat]);

  // Load DJ handle for branding
  useEffect(() => {
    if (licenseKey && isValidFormat) {
      getDJHandle(licenseKey).then(handle => {
        setDjHandle(handle);
      });
    }
  }, [licenseKey, isValidFormat]);

  const handleSettings = () => {
    router.push('/(tabs)/settings');
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handleMarkPlayed = async (id: number) => {
    try {
      // Find request before updating status (state may change after update)
      const request = requests.find(r => r.id === id);
      await updateRequestStatus(id, true);
      // Set current requester
      if (request?.username) {
        try {
          await setCurrentRequester(request.username, id);
        } catch (e) {
          console.error('Failed to set current requester:', e);
        }
      }
      // Send push notification to viewer if they have a push token
      console.log('[PUSH] Mark played - request pushToken:', request?.pushToken || 'NONE');
      if (request?.pushToken) {
        sendPushNotification(
          request.pushToken,
          'CueControl',
          `Your track "${request.request}" is now playing!`
        );
      }
    } catch (error) {
      console.error('Failed to mark as played:', error);
    }
  };

  const handleMarkUnplayed = async (id: number) => {
    try {
      await updateRequestStatus(id, false);
      // Clear requester if this was the current one
      if (currentRequester?.requestId === id) {
        await clearCurrentRequester();
      }
    } catch (error) {
      console.error('Failed to mark as unplayed:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteRequest(id);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleEdit = (request: Request) => {
    setEditingRequest(request);
    setEditModalVisible(true);
  };

  const handleEditSubmit = async (
    id: number,
    updates: { request?: string; notes?: string }
  ) => {
    await updateRequest(id, updates);
  };

  const handleUpdateNotes = async (id: number, notes: string) => {
    try {
      await updateRequest(id, { notes });
    } catch (error) {
      console.error('Failed to update notes:', error);
    }
  };

  const handleNextStreamUpdateNotes = async (id: number, notes: string) => {
    try {
      await updateNextStreamRequest(id, { notes });
    } catch (error) {
      console.error('Failed to update notes:', error);
    }
  };

  const handleToggleStar = async (id: number, starred: boolean) => {
    try {
      const request = requests.find(r => r.id === id);
      await updateRequest(id, { starred });
      // Send push notification when starring (not un-starring) if viewer has a push token
      if (starred && request?.pushToken) {
        sendPushNotification(
          request.pushToken,
          'CueControl',
          `Your request "${request.request}" is coming up soon!`
        );
      }
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  };

  const handleNextStreamToggleStar = async (id: number, starred: boolean) => {
    try {
      await updateNextStreamRequest(id, { starred });
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  };

  const handleMoveToNextStream = async (id: number) => {
    try {
      await moveToNextStream(id);
    } catch (error) {
      console.error('Failed to move to next stream:', error);
    }
  };

  const handleManualSubmit = async (username: string, track: string) => {
    await addRequest({
      username,
      request: track,
      played: false,
      platform: 'mobile',
    });
  };

  const handleClearAll = () => {
    if (requests.length === 0) return;
    Alert.alert(
      'Clear All Requests',
      'Are you sure you want to delete all requests?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllRequests();
            } catch (error) {
              console.error('Failed to clear all:', error);
            }
          },
        },
      ]
    );
  };

  // Next Stream handlers
  const handleNextStreamDelete = async (id: number) => {
    try {
      await deleteNextStreamRequest(id);
    } catch (error) {
      console.error('Failed to delete from next stream:', error);
    }
  };

  const handleNextStreamEdit = (request: Request) => {
    setEditingNextStreamRequest(request);
    setEditModalVisible(true);
  };

  const handleNextStreamEditSubmit = async (
    id: number,
    updates: { request?: string; notes?: string }
  ) => {
    await updateNextStreamRequest(id, updates);
  };

  const handleMoveFromNextStream = async (id: number) => {
    try {
      await moveFromNextStream(id);
    } catch (error) {
      console.error('Failed to move from next stream:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="person-circle-outline" size={s(64)} color={colors.text.muted} />
        <Text style={styles.emptyTitle}>Not Signed In</Text>
        <Text style={styles.emptyText}>
          Please sign in to manage your request queue
        </Text>
      </View>
    );
  }

  // Custom header matching desktop style
  const renderHeader = () => (
      <View style={styles.headerBar}>
        <Text style={styles.headerBarTitle}>
          {djHandle && <Text style={styles.channelName}>{djHandle.charAt(0).toUpperCase() + djHandle.slice(1)}'s </Text>}
          CueControl
        </Text>
        <View style={[styles.headerButtons, { width: s(columnWidth) }]}>
          <TouchableOpacity
            style={[styles.iconButton, styles.infoButton]}
            onPress={() => setAboutVisible(true)}
          >
            <Ionicons name="information" size={s(16)} color={colors.accent.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, styles.reloadButton]}
            onPress={onRefresh}
          >
            <Ionicons name="reload" size={s(14)} color={colors.text.grey} />
          </TouchableOpacity>
          <TouchableOpacity
            testID="switch-mode-button"
            style={[styles.iconButton, styles.closeButton]}
            onPress={async () => {
              await clearMode();
              router.replace('/');
            }}
          >
            <Ionicons name="close" size={s(16)} color={colors.status.error} />
          </TouchableOpacity>
        </View>
      </View>
  );

  if (!licenseKey || !isValidFormat) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {renderHeader()}
          <View style={styles.emptyContainer}>
            <Ionicons name="key-outline" size={s(64)} color={colors.text.muted} />
            <Text style={styles.emptyTitle}>License Key Required</Text>
            <Text style={styles.emptyText}>
              Enter your CueControl license key to start receiving requests
            </Text>
            <TouchableOpacity
              testID="go-to-settings-button"
              style={styles.goToSettingsButton}
              onPress={handleSettings}
            >
              <Ionicons name="settings-sharp" size={s(18)} color={colors.text.primary} />
              <Text style={styles.goToSettingsText}>Go to Settings</Text>
            </TouchableOpacity>
          </View>
          <AboutModal visible={aboutVisible} onClose={() => setAboutVisible(false)} userEmail={user?.email} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      {renderHeader()}

      {/* Top bar with title and actions */}
      <View style={styles.topBar}>
        <Text style={styles.sectionTitle}>TRACK REQUESTS:</Text>
        <View style={[styles.actionButtons, { width: s(columnWidth) }]}>
          <TouchableOpacity
            testID="queue-add-button"
            style={[styles.iconButton, styles.addButton]}
            onPress={() => setManualModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="queue-settings-button"
            style={[styles.iconButton, styles.settingsButton]}
            onPress={handleSettings}
          >
            <Ionicons name="settings-sharp" size={s(14)} color={colors.text.grey} />
          </TouchableOpacity>
          <TouchableOpacity
            testID="queue-clear-button"
            style={styles.clearButton}
            onPress={handleClearAll}
          >
            <Ionicons name="close" size={s(16)} color={colors.status.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Counts row */}
      <View style={styles.countsRow}>
        <Text style={styles.summaryText}>
          Total<Text style={styles.colon}>:</Text> <Text testID="queue-total-count" style={styles.summaryValue}>{totalCount}</Text>
        </Text>
        <Text style={styles.summaryText}>
          Unplayed<Text style={styles.colon}>:</Text> <Text style={styles.summaryValue}>{unplayedCount}</Text>
        </Text>
        <Text style={styles.summaryText}>
          Played<Text style={styles.colon}>:</Text> <Text style={styles.summaryValue}>{playedCount}</Text>
        </Text>
      </View>

      {/* Column Headers */}
      <View style={styles.headerRow}>
        <View style={[styles.headerCell, styles.contentHeader, { paddingLeft: s(contentPaddingLeft), paddingRight: s(contentPaddingRight) }]}>
          <Text style={styles.headerText} numberOfLines={1}>REQUESTED BY:</Text>
          <Text style={styles.headerSubText} numberOfLines={1}>ARTIST - TRACK:</Text>
        </View>
        <View style={[styles.headerCell, styles.rightHeader, { width: s(columnWidth) }]}>
          <Text style={styles.headerText} numberOfLines={1}>STATUS:</Text>
          <Text style={styles.headerSubText} numberOfLines={1}>OPTIONS:</Text>
        </View>
      </View>

      <DraggableFlatList
        containerStyle={{ flex: 1 }}
        data={unplayedRequests}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, drag, isActive }: RenderItemParams<Request>) => {
          const idx = unplayedRequests.indexOf(item);
          return (
            <RequestCard
              request={item}
              index={idx}
              onMarkPlayed={handleMarkPlayed}
              onMarkUnplayed={handleMarkUnplayed}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onUpdateNotes={handleUpdateNotes}
              onToggleStar={handleToggleStar}
              onMoveToNextStream={handleMoveToNextStream}
              drag={drag}
              isActive={isActive}
              columnWidth={columnWidth}
              contentPaddingLeft={contentPaddingLeft}
              contentPaddingRight={contentPaddingRight}
            />
          );
        }}
        onDragEnd={({ data }) => {
          const ids = data.map(r => r.id);
          reorderRequests(ids);
        }}
        ListEmptyComponent={
          playedRequests.length === 0 ? (
            <View style={styles.emptyListContainer}>
              <Text style={styles.emptyListTitle}>NO REQUESTS YET</Text>
              <Text style={styles.emptyListText}>
                SEND YOUR REQUESTS IN CHAT USING
              </Text>
              <Text style={styles.emptyListCommand}>!request - Artist/Track</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          <>
            {/* Played Requests */}
            {playedRequests.map((item, index) => (
              <RequestCard
                key={item.id.toString()}
                request={item}
                index={unplayedRequests.length + index}
                onMarkPlayed={handleMarkPlayed}
                onMarkUnplayed={handleMarkUnplayed}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onUpdateNotes={handleUpdateNotes}
                onToggleStar={handleToggleStar}
                onMoveToNextStream={handleMoveToNextStream}
                columnWidth={columnWidth}
                contentPaddingLeft={contentPaddingLeft}
                contentPaddingRight={contentPaddingRight}
              />
            ))}

            {/* Next Stream Section */}
            <View style={styles.sectionBorder} />
            <View style={styles.sectionBorder} />
            <View style={styles.nextStreamHeader}>
              <Text style={styles.nextStreamTitle}>NEXT STREAM:</Text>
            </View>
            <View style={styles.sectionBorder} />
            <View style={styles.nextStreamCountsRow}>
              <Text style={styles.nextStreamCount}>
                Total<Text style={styles.colon}>:</Text> <Text style={styles.nextStreamCountValue}>{nextStreamCount}</Text>
              </Text>
            </View>

            {/* Next Stream Column Headers */}
            <View style={styles.headerRow}>
              <View style={[styles.headerCell, styles.contentHeader, { paddingLeft: s(contentPaddingLeft), paddingRight: s(contentPaddingRight) }]}>
                <Text style={styles.headerText} numberOfLines={1}>REQUESTED BY:</Text>
                <Text style={styles.headerSubText} numberOfLines={1}>ARTIST - TRACK:</Text>
              </View>
              <View style={[styles.headerCell, styles.rightHeader, { width: s(columnWidth) }]}>
                <Text style={styles.headerText} numberOfLines={1}>STATUS:</Text>
                <Text style={styles.headerSubText} numberOfLines={1}>OPTIONS:</Text>
              </View>
            </View>

            {/* Next Stream Requests */}
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
                  onMarkPlayed={() => {}}
                  onMarkUnplayed={() => {}}
                  onDelete={handleNextStreamDelete}
                  onEdit={handleNextStreamEdit}
                  onUpdateNotes={handleNextStreamUpdateNotes}
                  onToggleStar={handleNextStreamToggleStar}
                  onMoveFromNextStream={handleMoveFromNextStream}
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
              <Text style={[styles.requesterName, !currentRequester && { color: colors.text.primary }]}>{currentRequester ? currentRequester.username : '—'}</Text>
              {currentRequester && (
                <TouchableOpacity
                  style={styles.requesterClearButton}
                  onPress={() => clearCurrentRequester()}
                >
                  <Text style={styles.requesterClearText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.sectionBorder} />
            <View style={{ height: s(80) }} />
          </>
        }
        contentContainerStyle={unplayedRequests.length === 0 ? styles.emptyList : undefined}
      />

      <ManualEntryModal
        visible={manualModalVisible}
        onClose={() => setManualModalVisible(false)}
        onSubmit={handleManualSubmit}
      />

      <EditRequestModal
        visible={editModalVisible}
        request={editingRequest || editingNextStreamRequest}
        onClose={() => {
          setEditModalVisible(false);
          setEditingRequest(null);
          setEditingNextStreamRequest(null);
        }}
        onSubmit={editingNextStreamRequest ? handleNextStreamEditSubmit : handleEditSubmit}
      />

      <AboutModal visible={aboutVisible} onClose={() => setAboutVisible(false)} userEmail={user?.email} />
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
    width: s(101),
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
    color: colors.accent.primary,
    fontSize: fs(15),
    fontWeight: '800',
    fontFamily: 'Helvetica Neue',
    letterSpacing: 1,
  },
  settingsButton: {
    borderColor: colors.text.grey,
  },
  reloadButton: {
    borderColor: colors.text.grey,
  },
  modeButton: {
    borderColor: colors.status.error,
  },
  modeButtonText: {
    color: colors.status.error,
    fontSize: fs(15),
    fontWeight: '800',
    fontFamily: 'Helvetica Neue',
    letterSpacing: 1,
  },
  closeButton: {
    borderColor: colors.status.error,
  },
  closeButtonText: {
    color: colors.status.error,
    fontSize: fs(15),
    fontWeight: '800',
    fontFamily: 'Helvetica Neue',
    letterSpacing: 1,
  },
  addButton: {
    borderColor: colors.accent.primary,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: s(38),
    backgroundColor: colors.background.main,
    borderTopWidth: s(2),
    borderTopColor: colors.border,
    borderBottomWidth: s(2),
    borderBottomColor: colors.border,
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
  sectionTitle: {
    flex: 1,
    fontSize: fs(18),
    fontWeight: '800',
    color: colors.accent.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingLeft: s(5),
    fontFamily: 'Helvetica Neue',
  },
  summaryText: {
    fontSize: fs(15),
    color: colors.text.secondary,
    textTransform: 'uppercase',
    fontWeight: '800',
    fontFamily: 'Helvetica Neue',
    letterSpacing: 1,
  },
  summaryValue: {
    color: colors.text.primary,
    fontFamily: 'Helvetica Neue',
    fontSize: fs(15),
    fontWeight: '800',
    letterSpacing: 1,
  },
  colon: {
    fontSize: fs(15),
    fontWeight: '800',
    fontFamily: 'Helvetica Neue',
    letterSpacing: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(6),
    width: s(101),
    borderLeftWidth: s(2),
    borderLeftColor: colors.border,
    paddingHorizontal: 1,
    height: '100%',
  },
  addButtonText: {
    fontSize: fs(15),
    color: colors.accent.primary,
    fontWeight: '800',
    fontFamily: 'Helvetica Neue',
    letterSpacing: 1,
  },
  clearButton: {
    width: s(25),
    height: s(25),
    borderWidth: s(2),
    borderColor: colors.status.error,
    borderRadius: 0,
    backgroundColor: colors.background.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: colors.status.error,
    fontSize: fs(15),
    fontWeight: '800',
    fontFamily: 'Helvetica Neue',
    letterSpacing: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background.main,
  },
  emptyListContainer: {
    padding: s(12),
    alignItems: 'center',
  },
  emptyList: {
    flexGrow: 0,
  },
  emptyListTitle: {
    fontSize: fs(15),
    fontWeight: '800',
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontFamily: 'Helvetica Neue',
    letterSpacing: 1,
  },
  emptyListText: {
    fontSize: fs(15),
    fontWeight: '800',
    color: colors.text.secondary,
    textAlign: 'center',
    fontFamily: 'Helvetica Neue',
    letterSpacing: 1,
  },
  emptyListCommand: {
    fontSize: fs(28),
    fontWeight: '800',
    color: colors.status.error,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontFamily: 'Helvetica Neue',
    letterSpacing: 1,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontFamily: 'Helvetica Neue',
    letterSpacing: 1,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.text.muted,
    textAlign: 'center',
    fontWeight: '800',
    fontFamily: 'Helvetica Neue',
    letterSpacing: 1,
  },
  goToSettingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  goToSettingsText: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: '800',
    fontFamily: 'Helvetica Neue',
    letterSpacing: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.background.main,
    minHeight: s(70),
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
    fontSize: fs(15),
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 1,
    textAlign: 'left',
    fontFamily: 'Helvetica Neue',
  },
  headerSubText: {
    fontSize: fs(15),
    fontWeight: '800',
    color: colors.text.secondary,
    letterSpacing: 1,
    textAlign: 'left',
    fontFamily: 'Helvetica Neue',
  },
  contentHeader: {
    flex: 1,
    alignItems: 'flex-start',
    paddingVertical: s(2),
  },
  rightHeader: {
    width: s(98),
    alignItems: 'center',
    borderRightWidth: 0,
    paddingLeft: 0,
    paddingRight: 0,
    paddingVertical: s(2),
  },
  nextStreamHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingLeft: s(5),
    paddingRight: spacing.sm,
    height: s(38),
    backgroundColor: colors.background.main,
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
  nextStreamTitle: {
    fontSize: fs(18),
    fontWeight: '800',
    color: colors.accent.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'Helvetica Neue',
  },
  nextStreamCount: {
    fontSize: fs(15),
    color: colors.text.secondary,
    textTransform: 'uppercase',
    fontWeight: '800',
    fontFamily: 'Helvetica Neue',
    letterSpacing: 1,
  },
  nextStreamCountValue: {
    color: colors.text.primary,
    fontFamily: 'Helvetica Neue',
    fontSize: fs(15),
    fontWeight: '800',
    letterSpacing: 1,
  },
  nextStreamEmptyContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  nextStreamEmptyText: {
    fontSize: fs(15),
    fontWeight: '800',
    color: colors.text.muted,
    textAlign: 'center',
    fontFamily: 'Helvetica Neue',
    letterSpacing: 1,
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
  sectionBorder: {
    height: s(2),
    backgroundColor: colors.border,
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
  requesterClearButton: {
    paddingHorizontal: s(12),
    paddingVertical: s(4),
    borderWidth: s(2),
    borderColor: colors.status.error,
    borderRadius: 0,
    backgroundColor: colors.background.main,
  },
  requesterClearText: {
    fontSize: fs(15),
    fontWeight: '800',
    color: colors.status.error,
    textTransform: 'uppercase',
    fontFamily: 'Helvetica Neue',
    letterSpacing: 1,
  },
});
