import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

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

  const getTextStyle = () => {
    if (isPending) return styles.textPending;
    if (played) return styles.textPlayed;
    return styles.textQueued;
  };

  const getLabel = () => {
    if (isPending) return 'PENDING';
    if (played) return 'PLAYED';
    return 'QUEUED';
  };

  return (
    <TouchableOpacity
      style={[styles.pill, getPillStyle(), disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled || isPending}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, getTextStyle()]}>
        {getLabel()}
      </Text>
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
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  textQueued: {
    color: colors.accent.primary,
  },
  textPlayed: {
    color: colors.status.played,
  },
  textPending: {
    color: '#f7e38a',
  },
});
