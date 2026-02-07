import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNextStream } from '../../src/hooks/useNextStream';
import { useAuth } from '../../src/context/AuthContext';
import { useLicense } from '../../src/context/LicenseContext';
import { useAppModeContext } from '../../src/context/AppModeContext';
import { RequestCard } from '../../src/components/RequestCard';
import { EditRequestModal } from '../../src/components/EditRequestModal';
import { AboutModal } from '../../src/components/AboutModal';
import {
  updateNextStreamRequest,
  deleteNextStreamRequest,
  moveFromNextStream,
  reorderNextStream,
} from '../../src/services/nextStream';
import { setCurrentLicenseKey } from '../../src/services/requests';
import { colors, typography, spacing } from '../../src/constants/theme';
import { Request } from '../../src/types/request';

export default function NextStreamScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { licenseKey, isValidFormat } = useLicense();
  const { mode, clearMode } = useAppModeContext();

  // Set the license key for the requests service
  useEffect(() => {
    if (licenseKey && isValidFormat) {
      setCurrentLicenseKey(licenseKey);
    }
  }, [licenseKey, isValidFormat]);

  const { requests, loading, count } = useNextStream(licenseKey);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRequest, setEditingRequest] = useState<Request | null>(null);
  const [aboutVisible, setAboutVisible] = useState(false);

  const handleDelete = async (id: number) => {
    try {
      await deleteNextStreamRequest(id);
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
    await updateNextStreamRequest(id, updates);
  };

  const handleUpdateNotes = async (id: number, notes: string) => {
    try {
      await updateNextStreamRequest(id, { notes });
    } catch (error) {
      console.error('Failed to update notes:', error);
    }
  };

  const handleToggleStar = async (id: number, starred: boolean) => {
    try {
      await updateNextStreamRequest(id, { starred });
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  };

  const handleMoveFromNextStream = async (id: number) => {
    try {
      await moveFromNextStream(id);
    } catch (error) {
      console.error('Failed to move from next stream:', error);
    }
  };

  const handleSettings = () => {
    router.push('/(tabs)/settings');
  };

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
            router.replace('/');
          },
        },
      ]
    );
  };

  // Custom header matching desktop style
  const renderHeader = () => (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <Text style={styles.headerBarTitle}>CueControl</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.iconButton, styles.infoButton]}
            onPress={() => setAboutVisible(true)}
          >
            <Text style={styles.infoButtonText}>i</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, styles.modeButton]}
            onPress={async () => {
              await clearMode();
              router.replace('/');
            }}
          >
            <Text style={styles.modeButtonText}>⇄</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.emptyContainer}>
          <Ionicons name="person-circle-outline" size={64} color={colors.text.muted} />
          <Text style={styles.emptyTitle}>Not Signed In</Text>
          <Text style={styles.emptyText}>
            Please sign in to access your saved requests
          </Text>
        </View>
        <AboutModal visible={aboutVisible} onClose={() => setAboutVisible(false)} userEmail={user?.email} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <View style={styles.subHeader}>
        <Text style={styles.subHeaderTitle}>NEXT STREAM</Text>
        <Text style={styles.subHeaderCount}>
          Total<Text style={styles.colon}>:</Text> <Text style={styles.subHeaderCountValue}>{count}</Text>
        </Text>
      </View>

      {/* Column Headers - matching slim dashboard */}
      <View style={styles.headerRow}>
        <View style={[styles.headerCell, styles.requesterHeader]}>
          <Text style={styles.headerText} numberOfLines={1}>Requester:</Text>
        </View>
        <View style={[styles.headerCell, styles.trackHeader]}>
          <Text style={styles.headerText} numberOfLines={1}>Artist - Track:</Text>
        </View>
        <View style={[styles.headerCell, styles.statusHeader]}>
          <Text style={styles.headerText} numberOfLines={1}>Status:</Text>
        </View>
        <View style={[styles.headerCell, styles.optionsHeader]}>
          <Text style={styles.headerText} numberOfLines={1}>Options:</Text>
        </View>
      </View>

      <DraggableFlatList
        data={requests}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, drag, isActive }: RenderItemParams<Request>) => {
          const idx = requests.indexOf(item);
          return (
            <RequestCard
              request={item}
              index={idx}
              onMarkPlayed={() => {}}
              onMarkUnplayed={() => {}}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onUpdateNotes={handleUpdateNotes}
              onToggleStar={handleToggleStar}
              onMoveFromNextStream={handleMoveFromNextStream}
              isNextStream
              drag={drag}
              isActive={isActive}
            />
          );
        }}
        onDragEnd={({ data }) => {
          const ids = data.map(r => r.id);
          reorderNextStream(ids);
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              NO TRACKS SAVED FOR NEXT STREAM
            </Text>
          </View>
        }
        contentContainerStyle={requests.length === 0 ? styles.emptyList : undefined}
      />

      <EditRequestModal
        visible={editModalVisible}
        request={editingRequest}
        onClose={() => {
          setEditModalVisible(false);
          setEditingRequest(null);
        }}
        onSubmit={handleEditSubmit}
      />
      <AboutModal visible={aboutVisible} onClose={() => setAboutVisible(false)} userEmail={user?.email} />
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
    borderTopWidth: 2,
    borderTopColor: colors.border,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  headerBarTitle: {
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
  iconButton: {
    width: 24,
    height: 24,
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
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    height: 35,
    backgroundColor: colors.background.main,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  subHeaderTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.accent.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subHeaderCount: {
    fontSize: typography.sizes.sm,
    color: colors.accent.primary,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  subHeaderCountValue: {
    color: colors.accent.primary,
  },
  colon: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyList: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.muted,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.main,
    height: 35,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  headerCell: {
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRightWidth: 2,
    borderRightColor: colors.border,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.primary,
    textTransform: 'uppercase',
  },
  requesterHeader: {
    width: 105,
  },
  trackHeader: {
    flex: 1,
  },
  statusHeader: {
    width: 80,
    alignItems: 'center',
  },
  optionsHeader: {
    width: 120,
    alignItems: 'center',
    borderRightWidth: 0,
  },
});
