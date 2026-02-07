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
    <View style={[styles.row, index % 2 === 1 && styles.rowAlt, request.starred && styles.rowStarred, isActive && styles.rowActive]}>
      {/* Drag Handle - DJ only */}
      {!isViewer && (
        <TouchableOpacity
          style={styles.dragHandle}
          onLongPress={drag}
          delayLongPress={150}
          disabled={!drag}
        >
          <Ionicons name="reorder-three" size={20} color={colors.text.muted} style={{ opacity: 0.4 }} />
        </TouchableOpacity>
      )}

      {/* Requester + Track stacked column */}
      <View style={[styles.cell, styles.contentCell]}>
        {request.starred && (
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
              <Ionicons name="document-text" size={12} color={colors.text.muted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Status Column */}
      <View style={[styles.cell, styles.statusCell, isViewer && styles.statusCellLast]}>
        <StatusPill
          played={request.played}
          onPress={handleStatusPress}
          disabled={isViewer}
          isPending={isNextStream}
        />
      </View>

      {/* Options Column - DJ only */}
      {!isViewer && (
        <View style={[styles.cell, styles.optionsCell]}>
          <TouchableOpacity
            style={[styles.actionButton, request.starred ? styles.starButtonActive : styles.starButton]}
            onPress={handleStarPress}
          >
            <Ionicons
              name={request.starred ? 'star' : 'star-outline'}
              size={14}
              color={request.starred ? '#ffc107' : colors.text.muted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => onEdit?.(request)}
          >
            <Ionicons name="pencil" size={14} color={colors.accent.primary} />
          </TouchableOpacity>

          {(onMoveToNextStream || onMoveFromNextStream) && (
            <TouchableOpacity style={[styles.actionButton, styles.moveButton]} onPress={handleMove}>
              <Ionicons
                name={isNextStream ? 'arrow-up' : 'arrow-down'}
                size={14}
                color={colors.text.muted}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
            <Ionicons name="close" size={14} color={colors.status.error} />
          </TouchableOpacity>
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
    height: 48,
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
  starIndicator: {
    position: 'absolute',
    right: 5,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  dragHandle: {
    width: 24,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  statusCell: {
    width: 95,
    alignItems: 'center',
    paddingLeft: 0,
    paddingRight: 0,
  },
  statusCellLast: {
    borderRightWidth: 0,
  },
  optionsCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
    borderRightWidth: 0,
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
    opacity: 0.6,
  },
  actionButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 0,
    backgroundColor: colors.background.main,
  },
  starButton: {
    borderColor: colors.text.muted,
    opacity: 0.5,
  },
  starButtonActive: {
    borderColor: '#ffc107',
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
