import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../constants/theme';
import { StatusPill } from './StatusPill';
import { Request } from '../types/request';

interface RequestCardProps {
  request: Request;
  index: number;
  onMarkPlayed?: (id: number) => void;
  onMarkUnplayed?: (id: number) => void;
  onDelete?: (id: number) => void;
  onEdit?: (request: Request) => void;
  onUpdateNotes?: (id: number, notes: string) => void;
  onToggleStar?: (id: number, starred: boolean) => void;
  onMoveToNextStream?: (id: number) => void;
  onMoveFromNextStream?: (id: number) => void;
  isNextStream?: boolean;
  drag?: () => void;
  isActive?: boolean;
  mode?: 'dj' | 'viewer';
}

export function RequestCard({
  request,
  index,
  onMarkPlayed,
  onMarkUnplayed,
  onDelete,
  onEdit,
  onUpdateNotes,
  onToggleStar,
  onMoveToNextStream,
  onMoveFromNextStream,
  isNextStream,
  drag,
  isActive,
  mode = 'dj',
}: RequestCardProps) {
  const isViewer = mode === 'viewer';

  const handleStatusPress = () => {
    if (request.played) {
      onMarkUnplayed?.(request.id);
    } else {
      onMarkPlayed?.(request.id);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Request',
      `Delete "${request.request}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete?.(request.id) },
      ]
    );
  };

  const handleMove = () => {
    if (isNextStream && onMoveFromNextStream) {
      onMoveFromNextStream(request.id);
    } else if (!isNextStream && onMoveToNextStream) {
      onMoveToNextStream(request.id);
    }
  };

  const handleStarPress = () => {
    onToggleStar?.(request.id, !request.starred);
  };

  const capitalizedUsername = request.username
    ? request.username.charAt(0).toUpperCase() + request.username.slice(1)
    : 'Anonymous';

  return (
    <View style={[styles.row, index % 2 === 1 && styles.rowAlt, isViewer && request.starred && styles.rowStarred, isActive && styles.rowActive]}>
      {/* Content column: Requester + Track — long press to drag (DJ only) */}
      <TouchableOpacity
        style={[styles.cell, styles.contentCell]}
        onLongPress={!isViewer ? drag : undefined}
        delayLongPress={150}
        disabled={isViewer || !drag}
        activeOpacity={isViewer ? 1 : 0.7}
      >
        {isViewer && request.starred && (
          <View style={styles.starIndicator}>
            <Ionicons name="star" size={18} color="#ffc107" />
          </View>
        )}
        <Text style={[styles.username, request.played && styles.textPlayed]} numberOfLines={1}>
          {capitalizedUsername}
        </Text>
        <View style={styles.trackRow}>
          <Text
            style={[styles.track, request.played && styles.textPlayed]}
            numberOfLines={1}
          >
            {request.request}
          </Text>
          {!isViewer && request.notes ? (
            <TouchableOpacity onPress={() => onEdit?.(request)} style={styles.notesIndicator}>
              <Ionicons name="document-text" size={12} color={colors.text.grey} />
            </TouchableOpacity>
          ) : null}
        </View>
      </TouchableOpacity>

      {/* Star button — DJ only, positioned between content and right column */}
      {!isViewer && (
        <TouchableOpacity style={styles.starButton} onPress={handleStarPress}>
          <Ionicons
            name={request.starred ? 'star' : 'star-outline'}
            size={18}
            color={request.starred ? '#ffc107' : colors.text.muted}
            style={!request.starred ? { opacity: 0.4 } : undefined}
          />
        </TouchableOpacity>
      )}

      {/* Right column */}
      {isViewer ? (
        <View style={[styles.cell, styles.statusCellLast]}>
          <StatusPill
            played={request.played}
            onPress={handleStatusPress}
            disabled={isViewer}
            isPending={isNextStream}
          />
        </View>
      ) : (
        <View style={[styles.cell, styles.rightColumn]}>
          <View style={styles.statusRow}>
            <StatusPill
              played={request.played}
              onPress={handleStatusPress}
              isPending={isNextStream}
            />
          </View>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => onEdit?.(request)}
            >
              <Ionicons name="pencil" size={16} color={colors.accent.primary} />
            </TouchableOpacity>

            {(onMoveToNextStream || onMoveFromNextStream) && (
              <TouchableOpacity style={[styles.actionButton, styles.moveButton]} onPress={handleMove}>
                <Ionicons
                  name={isNextStream ? 'arrow-up' : 'arrow-down'}
                  size={16}
                  color={colors.text.muted}
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
              <Ionicons name="close" size={16} color={colors.status.error} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.row,
    height: 70,
    borderTopWidth: 2,
    borderTopColor: colors.border,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    marginTop: -2,
  },
  rowAlt: {
    backgroundColor: colors.background.rowAlt,
  },
  rowStarred: {
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
  },
  rowActive: {
    backgroundColor: colors.accent.soft,
    opacity: 0.8,
  },
  cell: {
    height: '100%',
    justifyContent: 'center',
    paddingLeft: 5,
    paddingRight: 8,
    borderRightWidth: 2,
    borderRightColor: colors.border,
  },
  contentCell: {
    flex: 1,
    paddingVertical: 4,
    borderRightWidth: 0,
  },
  statusCellLast: {
    width: 98,
    alignItems: 'center',
    paddingLeft: 0,
    paddingRight: 0,
    borderRightWidth: 0,
  },
  rightColumn: {
    width: 98,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderTopWidth: 2,
    borderTopColor: colors.border,
    paddingTop: 3,
    paddingBottom: 3,
    paddingHorizontal: 4,
    width: '100%',
  },
  statusRow: {
    paddingTop: 3,
    paddingBottom: 3,
  },
  starIndicator: {
    position: 'absolute',
    right: 5,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  starButton: {
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderRightWidth: 2,
    borderRightColor: colors.border,
  },
  username: {
    fontFamily: 'Helvetica Neue',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.text.primary,
    textAlign: 'left',
  },
  track: {
    fontFamily: 'Helvetica Neue',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.text.secondary,
    textAlign: 'left',
    flex: 1,
  },
  textPlayed: {
    color: colors.status.played,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notesIndicator: {
    padding: 2,
  },
  actionButton: {
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 0,
    backgroundColor: colors.background.main,
  },
  editButton: {
    borderColor: colors.accent.primary,
  },
  moveButton: {
    borderColor: colors.text.muted,
  },
  deleteButton: {
    borderColor: colors.status.error,
  },
});
