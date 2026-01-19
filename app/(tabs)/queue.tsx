import React, { useState, useCallback, useEffect } from 'react';
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
  setCurrentLicenseKey,
  getDJHandle,
} from '../../src/services/requests';
import {
  updateNextStreamRequest,
  deleteNextStreamRequest,
  moveFromNextStream,
} from '../../src/services/nextStream';
import { colors, typography, spacing } from '../../src/constants/theme';
import { Request } from '../../src/types/request';

export default function QueueScreen() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();
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
  const [refreshing, setRefreshing] = useState(false);
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRequest, setEditingRequest] = useState<Request | null>(null);
  const [editingNextStreamRequest, setEditingNextStreamRequest] = useState<Request | null>(null);
  const [aboutVisible, setAboutVisible] = useState(false);
  const [djHandle, setDjHandle] = useState<string | null>(null);

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
      await updateRequestStatus(id, true);
    } catch (error) {
      console.error('Failed to mark as played:', error);
    }
  };

  const handleMarkUnplayed = async (id: number) => {
    try {
      await updateRequestStatus(id, false);
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
        <Ionicons name="person-circle-outline" size={64} color={colors.text.muted} />
        <Text style={styles.emptyTitle}>Not Signed In</Text>
        <Text style={styles.emptyText}>
          Please sign in to manage your request queue
        </Text>
      </View>
    );
  }

  // Custom header matching desktop style
  const renderHeader = () => (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <Text style={styles.headerBarTitle}>
          {djHandle && <Text style={styles.channelName}>{djHandle.charAt(0).toUpperCase() + djHandle.slice(1).toLowerCase()}'s </Text>}
          CueControl
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.iconButton, styles.infoButton]}
            onPress={() => setAboutVisible(true)}
          >
            <Text style={styles.infoButtonText}>i</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, styles.reloadButton]}
            onPress={onRefresh}
          >
            <Ionicons name="reload" size={14} color={colors.text.grey} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, styles.closeButton]}
            onPress={async () => {
              await clearMode();
              router.replace('/');
            }}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );

  if (!licenseKey || !isValidFormat) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.emptyContainer}>
          <Ionicons name="key-outline" size={64} color={colors.text.muted} />
          <Text style={styles.emptyTitle}>License Key Required</Text>
          <Text style={styles.emptyText}>
            Enter your CueControl license key to start receiving requests
          </Text>
          <TouchableOpacity
            style={styles.goToSettingsButton}
            onPress={handleSettings}
          >
            <Ionicons name="settings-sharp" size={18} color={colors.text.primary} />
            <Text style={styles.goToSettingsText}>Go to Settings</Text>
          </TouchableOpacity>
        </View>
        <AboutModal visible={aboutVisible} onClose={() => setAboutVisible(false)} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      {/* Top bar with title and actions */}
      <View style={styles.topBar}>
        <Text style={styles.sectionTitle}>REQUESTS:</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.iconButton, styles.addButton]}
            onPress={() => setManualModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, styles.settingsButton]}
            onPress={handleSettings}
          >
            <Ionicons name="settings-sharp" size={14} color={colors.text.grey} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearAll}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Counts row */}
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

      {/* Column Headers - matching slim dashboard */}
      <View style={styles.headerRow}>
        <View style={[styles.headerCell, styles.requesterHeader]}>
          <Text style={styles.headerText} numberOfLines={1}>REQUESTER:</Text>
        </View>
        <View style={[styles.headerCell, styles.trackHeader]}>
          <Text style={styles.headerText} numberOfLines={1}>ARTIST - TRACK:</Text>
        </View>
        <View style={[styles.headerCell, styles.statusHeader]}>
          <Text style={styles.headerText} numberOfLines={1}>STATUS:</Text>
        </View>
        <View style={[styles.headerCell, styles.optionsHeader]}>
          <Text style={styles.headerText}>OPTIONS:</Text>
        </View>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <RequestCard
            request={item}
            index={index}
            onMarkPlayed={handleMarkPlayed}
            onMarkUnplayed={handleMarkUnplayed}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onMoveToNextStream={handleMoveToNextStream}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyListContainer}>
            <Text style={styles.emptyListTitle}>NO REQUESTS YET</Text>
            <Text style={styles.emptyListText}>
              SEND YOUR REQUESTS IN CHAT USING
            </Text>
            <Text style={styles.emptyListCommand}>!request - Artist/Track</Text>
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
            <View style={styles.headerRow}>
              <View style={[styles.headerCell, styles.requesterHeader]}>
                <Text style={styles.headerText} numberOfLines={1}>REQUESTER:</Text>
              </View>
              <View style={[styles.headerCell, styles.trackHeader]}>
                <Text style={styles.headerText} numberOfLines={1}>ARTIST - TRACK:</Text>
              </View>
              <View style={[styles.headerCell, styles.statusHeader]}>
                <Text style={styles.headerText} numberOfLines={1}>STATUS:</Text>
              </View>
              <View style={[styles.headerCell, styles.optionsHeader]}>
                <Text style={styles.headerText}>OPTIONS:</Text>
              </View>
            </View>

            {/* Next Stream Requests */}
            {nextStreamRequests.length === 0 ? (
              <View style={styles.nextStreamEmptyContainer}>
                <Text style={styles.nextStreamEmptyText}>
                  No requests saved for next stream
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
                  onMoveFromNextStream={handleMoveFromNextStream}
                  isNextStream
                />
              ))
            )}
          </>
        }
        contentContainerStyle={requests.length === 0 ? styles.emptyList : undefined}
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
  headerBar: {
    height: 35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background.main,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBarTitle: {
    fontFamily: 'Helvetica Neue',
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: 1,
  },
  channelName: {
    color: colors.accent.primary,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: -4,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingLeft: 8,
    height: '100%',
  },
  iconButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 0,
    backgroundColor: colors.background.main,
  },
  infoButton: {
    borderColor: colors.accent.primary,
  },
  infoButtonText: {
    color: colors.accent.primary,
    fontSize: 12,
    fontWeight: '700',
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
    fontSize: 12,
    fontWeight: '700',
  },
  closeButton: {
    borderColor: colors.status.error,
  },
  closeButtonText: {
    color: colors.status.error,
    fontSize: 12,
    fontWeight: '700',
  },
  addButton: {
    borderColor: colors.accent.primary,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    height: 35,
    backgroundColor: colors.background.main,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  countsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    height: 28,
    backgroundColor: colors.background.main,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryText: {
    fontSize: 14,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  summaryValue: {
    color: colors.text.primary,
  },
  colon: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginRight: -4,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingLeft: 8,
    height: '100%',
  },
  addButtonText: {
    fontSize: 14,
    color: colors.accent.primary,
    fontWeight: '700',
  },
  clearButton: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: colors.status.error,
    borderRadius: 0,
    backgroundColor: colors.background.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: colors.status.error,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background.main,
  },
  emptyListContainer: {
    padding: 12,
    alignItems: 'center',
  },
  emptyList: {
    flexGrow: 0,
  },
  emptyListTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emptyListText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  emptyListCommand: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.status.error,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.text.muted,
    textAlign: 'center',
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
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.main,
    height: 35,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCell: {
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  requesterHeader: {
    width: 100,
    alignItems: 'center',
  },
  trackHeader: {
    flex: 1,
    alignItems: 'center',
  },
  statusHeader: {
    width: 75,
    alignItems: 'center',
  },
  optionsHeader: {
    width: 95,
    alignItems: 'center',
    borderRightWidth: 0,
  },
  nextStreamHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    height: 35,
    backgroundColor: colors.background.main,
    borderTopWidth: 2,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  nextStreamCountsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    height: 28,
    backgroundColor: colors.background.main,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  nextStreamTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextStreamCount: {
    fontSize: 14,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  nextStreamCountValue: {
    color: colors.text.primary,
  },
  nextStreamEmptyContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  nextStreamEmptyText: {
    fontSize: 17,
    color: colors.text.muted,
    textAlign: 'center',
  },
});
