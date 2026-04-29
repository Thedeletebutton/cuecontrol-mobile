import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../constants/theme';
import { s, fs } from '../utils/responsive';

interface SettingRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
  isLast?: boolean;
}

export function SettingRow({
  label,
  value,
  min,
  max,
  step,
  suffix = 'px',
  onChange,
  isLast = false,
}: SettingRowProps) {
  return (
    <View style={[styles.row, isLast && styles.rowLast]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => onChange(Math.max(min, value - step))}
        >
          <Ionicons name="remove" size={s(16)} color={colors.accent.primary} />
        </TouchableOpacity>
        <Text style={styles.value}>{value}{suffix}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => onChange(Math.min(max, value + step))}
        >
          <Ionicons name="add" size={s(16)} color={colors.accent.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  label: {
    fontFamily: 'Helvetica Neue',
    fontSize: fs(15),
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 1,
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  button: {
    width: s(25),
    height: s(25),
    borderWidth: s(2),
    borderColor: colors.accent.primary,
    borderRadius: 0,
    backgroundColor: colors.background.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontFamily: 'Helvetica Neue',
    color: colors.text.primary,
    fontSize: fs(15),
    fontWeight: '800',
    letterSpacing: 1,
    minWidth: s(50),
    textAlign: 'center',
  },
});
