import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../constants/theme';
import { StatusPill } from './StatusPill';
import { Request } from '../types/request';

interface RequestCardProps {
  request: Request;
  index: number;
  onMarkPlayed: (id: number) => void;
  onMarkUnplayed: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (request: Request) => void;
  onMoveToNextStream?: (id: number) => void;
  onMoveFromNextStream?: (id: number) => void;
  isNextStream?: boolean;
}

export function RequestCard({
  request,
  index,
  onMarkPlayed,
  onMarkUnplayed,
  onDelete,
  onEdit,
  onMoveToNextStream,
  onMoveFromNextStream,
  isNextStream,
}: RequestCardProps) {
  const handleStatusPress = () => {
    if (request.played) {
      onMarkUnplayed(request.id);
    } else {
      onMarkPlayed(request.id);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Request',
      `Delete "${request.request}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(request.id) },
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

  return (
    <View style={[styles.row, index % 2 === 1 && styles.rowAlt]}>
      {/* Requester Column */}
      <View style={[styles.cell, styles.requesterCell]}>
        <Text style={[styles.username, request.played && styles.usernamePlayed]} numberOfLines={1}>
          {request.username || 'Anonymous'}
        </Text>
      </View>

      {/* Track Column */}
      <View style={[styles.cell, styles.trackCell]}>
        <Text
          style={[styles.track, request.played && styles.trackPlayed]}
          numberOfLines={3}
        >
          {request.request}
        </Text>
      </View>

      {/* Status Column */}
      <View style={[styles.cell, styles.statusCell]}>
        <StatusPill
          played={request.played}
          onPress={handleStatusPress}
          isPending={isNextStream}
        />
      </View>

      {/* Options Column */}
      <View style={[styles.cell, styles.optionsCell]}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => onEdit(request)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.row,
    height: 85,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowAlt: {
    backgroundColor: colors.background.rowAlt,
  },
  cell: {
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  requesterCell: {
    width: 100,
    alignItems: 'flex-start',
  },
  trackCell: {
    flex: 1,
    alignItems: 'flex-start',
  },
  statusCell: {
    width: 75,
    alignItems: 'center',
  },
  optionsCell: {
    width: 95,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 6,
    gap: 6,
    borderRightWidth: 0,
  },
  username: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'left',
  },
  usernamePlayed: {
    color: colors.status.played,
  },
  track: {
    fontSize: 12,
    color: colors.text.primary,
    textAlign: 'left',
  },
  trackPlayed: {
    color: colors.status.played,
  },
  actionButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
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
