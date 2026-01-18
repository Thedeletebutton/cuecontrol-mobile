import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { colors, typography, spacing } from '../constants/theme';

interface StatusPillProps {
  played: boolean;
  onPress: () => void;
  disabled?: boolean;
  isPending?: boolean;
}

export function StatusPill({ played, onPress, disabled, isPending }: StatusPillProps) {
  const getPillStyle = () => {
    if (isPending) return styles.pillPending;
    if (played) return styles.pillPlayed;
    return styles.pillQueued;
  };

  const getPillTextStyle = () => {
    if (isPending) return styles.pillTextPending;
    if (played) return styles.pillTextPlayed;
    return styles.pillTextQueued;
  };

  const getIcon = () => {
    if (isPending) return null;
    if (played) return '✓';
    return '‖';
  };

  const getLabel = () => {
    if (isPending) return 'Pending';
    if (played) return 'Played';
    return 'Queued';
  };

  return (
    <TouchableOpacity
      style={[
        styles.pill,
        getPillStyle(),
        disabled && styles.pillDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || isPending}
      activeOpacity={0.7}
    >
      <View style={styles.pillContent}>
        {getIcon() && (
          <Text style={[styles.pillIcon, getPillTextStyle()]}>{getIcon()}</Text>
        )}
        <Text style={[styles.pillText, getPillTextStyle()]}>
          {getLabel()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    width: 65,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  pillIcon: {
    fontSize: 8,
    fontWeight: '700',
  },
  pillQueued: {
    backgroundColor: colors.accent.soft,
    borderColor: colors.accent.primary,
  },
  pillPlayed: {
    backgroundColor: 'transparent',
    borderColor: colors.status.played,
  },
  pillPending: {
    backgroundColor: 'rgba(247, 227, 138, 0.15)',
    borderColor: '#f7e38a',
  },
  pillDisabled: {
    opacity: 0.5,
  },
  pillText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  pillTextQueued: {
    color: colors.accent.primary,
  },
  pillTextPlayed: {
    color: colors.status.played,
  },
  pillTextPending: {
    color: '#f7e38a',
  },
});
