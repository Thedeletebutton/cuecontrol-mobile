import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../constants/theme';
import { StatusPill } from './StatusPill';
import { Request } from '../types/request';
import { s, fs } from '../utils/responsive';

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
  columnWidth?: number;
  contentPaddingLeft?: number;
  contentPaddingRight?: number;
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
  columnWidth,
  contentPaddingLeft,
  contentPaddingRight,
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
    <View testID={`request-card-${request.id}`} style={[styles.row, index % 2 === 1 && styles.rowAlt, isViewer && request.starred && styles.rowStarred, isActive && styles.rowActive]}>
      {/* Content column: Requester + Track — long press to drag (DJ only) */}
      <TouchableOpacity
        accessibilityLabel={`${capitalizedUsername}, ${request.request}`}
        style={[styles.cell, styles.contentCell, contentPaddingLeft != null && { paddingLeft: s(contentPaddingLeft) }, contentPaddingRight != null && { paddingRight: s(contentPaddingRight) }]}
        onLongPress={!isViewer ? drag : undefined}
        delayLongPress={150}
        disabled={isViewer || !drag}
        activeOpacity={isViewer ? 1 : 0.7}
      >
        {isViewer && request.starred && (
          <View style={styles.starIndicator}>
            <Ionicons name="star" size={s(18)} color="#ffc107" />
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
        </View>
      </TouchableOpacity>

      {/* Notes indicator — DJ only, positioned between content and star */}
      {!isViewer && request.notes ? (
        <TouchableOpacity onPress={() => onEdit?.(request)} style={styles.notesIndicator}>
          <Ionicons name="document-text" size={s(16)} color={colors.text.grey} />
        </TouchableOpacity>
      ) : null}

      {/* Star button — DJ only, positioned between content and right column */}
      {!isViewer && (
        <TouchableOpacity testID={`request-star-${request.id}`} style={styles.starButton} onPress={handleStarPress}>
          <Ionicons
            name={request.starred ? 'star' : 'star-outline'}
            size={s(18)}
            color={request.starred ? '#ffc107' : colors.text.muted}
            style={!request.starred ? { opacity: 0.4 } : undefined}
          />
        </TouchableOpacity>
      )}

      {/* Right column */}
      {isViewer ? (
        <View style={[styles.cell, styles.statusCellLast, columnWidth != null && { width: s(columnWidth) }]}>
          <StatusPill
            played={request.played}
            onPress={handleStatusPress}
            disabled={isViewer}
            isPending={isNextStream}
          />
        </View>
      ) : (
        <View style={[styles.cell, styles.rightColumn, columnWidth != null && { width: s(columnWidth) }]}>
          <View style={styles.statusRow}>
            <StatusPill
              played={request.played}
              onPress={handleStatusPress}
              isPending={isNextStream}
            />
          </View>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              testID={`request-edit-${request.id}`}
              accessibilityLabel="Edit request"
              style={[styles.actionButton, styles.editButton]}
              onPress={() => onEdit?.(request)}
            >
              <Ionicons name="pencil" size={s(16)} color={colors.accent.primary} />
            </TouchableOpacity>

            {(onMoveToNextStream || onMoveFromNextStream) && (
              <TouchableOpacity testID={`request-move-${request.id}`} style={[styles.actionButton, styles.moveButton]} onPress={handleMove}>
                <Ionicons
                  name={isNextStream ? 'arrow-up' : 'arrow-down'}
                  size={s(16)}
                  color={colors.text.muted}
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity testID={`request-delete-${request.id}`} style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
              <Ionicons name="close" size={s(16)} color={colors.status.error} />
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
    height: s(70),
    borderTopWidth: s(2),
    borderTopColor: colors.border,
    borderBottomWidth: s(2),
    borderBottomColor: colors.border,
    marginTop: s(-2),
  },
  rowAlt: {
    backgroundColor: colors.background.rowAlt,
  },
  rowStarred: {
    borderLeftWidth: s(3),
    borderLeftColor: '#ffc107',
  },
  rowActive: {
    backgroundColor: colors.accent.soft,
    opacity: 0.8,
  },
  cell: {
    height: '100%',
    justifyContent: 'center',
    paddingLeft: s(5),
    paddingRight: s(8),
    borderRightWidth: s(2),
    borderRightColor: colors.border,
  },
  contentCell: {
    flex: 1,
    paddingVertical: s(4),
    borderRightWidth: 0,
  },
  statusCellLast: {
    width: s(96),
    alignItems: 'center',
    paddingLeft: 0,
    paddingRight: 0,
    borderRightWidth: 0,
    borderLeftWidth: s(2),
    borderLeftColor: colors.border,
  },
  rightColumn: {
    width: s(98),
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
    gap: s(6),
    borderTopWidth: s(2),
    borderTopColor: colors.border,
    paddingTop: s(3),
    paddingBottom: s(3),
    paddingHorizontal: s(4),
    width: '100%',
  },
  statusRow: {
    paddingTop: s(3),
    paddingBottom: s(3),
  },
  starIndicator: {
    position: 'absolute',
    right: s(5),
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  starButton: {
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: s(5),
    borderRightWidth: s(2),
    borderRightColor: colors.border,
  },
  username: {
    fontFamily: 'Helvetica Neue',
    fontSize: fs(15),
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.text.primary,
    textAlign: 'left',
  },
  track: {
    fontFamily: 'Helvetica Neue',
    fontSize: fs(15),
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
    gap: s(4),
  },
  notesIndicator: {
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: s(4),
  },
  actionButton: {
    width: s(25),
    height: s(25),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: s(2),
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
