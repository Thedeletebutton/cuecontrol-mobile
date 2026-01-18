import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../constants/theme';

interface QueueSummaryProps {
  total: number;
  unplayed: number;
  played: number;
}

export function QueueSummary({ total, unplayed, played }: QueueSummaryProps) {
  return (
    <View style={styles.container}>
      <View style={styles.stat}>
        <Text style={styles.label}>Total</Text>
        <Text style={styles.value}>{total}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Text style={styles.label}>Queued</Text>
        <Text style={[styles.value, styles.queuedValue]}>{unplayed}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Text style={styles.label}>Played</Text>
        <Text style={[styles.value, styles.playedValue]}>{played}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background.panel,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
  },
  label: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    color: colors.text.primary,
  },
  queuedValue: {
    color: colors.accent.primary,
  },
  playedValue: {
    color: colors.status.played,
  },
});
