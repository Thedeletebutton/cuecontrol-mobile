import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../constants/theme';

interface ViewerSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  saveDjHandle: boolean;
  saveUsername: boolean;
  onToggleSaveDjHandle: () => void;
  onToggleSaveUsername: () => void;
  // Font size settings
  labelFontSize: number;
  inputFontSize: number;
  onLabelFontSizeChange: (size: number) => void;
  onInputFontSizeChange: (size: number) => void;
  // Account
  userEmail: string | null;
  onSignOut: () => void;
}

export function ViewerSettingsModal({
  visible,
  onClose,
  saveDjHandle,
  saveUsername,
  onToggleSaveDjHandle,
  onToggleSaveUsername,
  labelFontSize,
  inputFontSize,
  onLabelFontSizeChange,
  onInputFontSizeChange,
  userEmail,
  onSignOut,
}: ViewerSettingsModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header bar */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>CueControl Settings</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        <ScrollView style={styles.scrollView}>
          {/* Account Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Account</Text>
            </View>
            <View style={styles.sectionContent}>
              <View style={styles.accountRow}>
                <Ionicons name="person-circle" size={48} color={colors.accent.primary} />
                <View style={styles.accountInfo}>
                  <Text style={styles.accountEmail}>{userEmail || 'Not signed in'}</Text>
                  <Text style={styles.accountStatus}>Signed in</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.signOutButton} onPress={onSignOut}>
                <Ionicons name="log-out-outline" size={20} color={colors.status.error} />
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Display Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Display</Text>
            </View>
            <View style={styles.sectionContent}>
              <View style={styles.fontSizeRow}>
                <Text style={styles.fontSizeLabel}>Label Font Size</Text>
                <View style={styles.fontSizeControls}>
                  <TouchableOpacity
                    style={styles.fontSizeButton}
                    onPress={() => onLabelFontSizeChange(Math.max(10, labelFontSize - 1))}
                  >
                    <Text style={styles.fontSizeButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.fontSizeValue}>{labelFontSize}px</Text>
                  <TouchableOpacity
                    style={styles.fontSizeButton}
                    onPress={() => onLabelFontSizeChange(Math.min(20, labelFontSize + 1))}
                  >
                    <Text style={styles.fontSizeButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fontSizeRow}>
                <Text style={styles.fontSizeLabel}>Input Font Size</Text>
                <View style={styles.fontSizeControls}>
                  <TouchableOpacity
                    style={styles.fontSizeButton}
                    onPress={() => onInputFontSizeChange(Math.max(12, inputFontSize - 1))}
                  >
                    <Text style={styles.fontSizeButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.fontSizeValue}>{inputFontSize}px</Text>
                  <TouchableOpacity
                    style={styles.fontSizeButton}
                    onPress={() => onInputFontSizeChange(Math.min(24, inputFontSize + 1))}
                  >
                    <Text style={styles.fontSizeButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Save Preferences Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Save Preferences</Text>
            </View>
            <View style={styles.sectionContent}>
              <TouchableOpacity style={styles.checkboxRow} onPress={onToggleSaveDjHandle}>
                <View style={styles.checkbox}>
                  {saveDjHandle && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Remember Stream ID</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.checkboxRow} onPress={onToggleSaveUsername}>
                <View style={styles.checkbox}>
                  {saveUsername && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Remember Username</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Save Button */}
          <View style={styles.saveButtonContainer}>
            <TouchableOpacity style={styles.saveButton} onPress={onClose}>
              <Ionicons name="checkmark" size={20} color={colors.text.primary} />
              <Text style={styles.saveButtonText}>Save Settings</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
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
  header: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background.main,
    borderTopWidth: 1,
    borderTopColor: '#787878',
    borderBottomWidth: 1,
    borderBottomColor: '#787878',
  },
  headerTitle: {
    fontFamily: 'Helvetica Neue',
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderLeftWidth: 1,
    borderLeftColor: '#787878',
    paddingLeft: 8,
    height: '100%',
  },
  closeButton: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: colors.status.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.status.error,
    fontSize: 12,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 0,
  },
  sectionHeader: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.panel,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.text.muted,
    textTransform: 'uppercase',
  },
  sectionContent: {
    padding: spacing.md,
    backgroundColor: colors.background.row,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  accountInfo: {
    marginLeft: spacing.md,
  },
  accountEmail: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.text.primary,
  },
  accountStatus: {
    fontSize: typography.sizes.sm,
    color: colors.status.success,
    marginTop: spacing.xs,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.status.error,
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.sm,
  },
  signOutText: {
    color: colors.status.error,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
  fontSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fontSizeLabel: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fontSizeButton: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontSizeButtonText: {
    color: colors.accent.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  fontSizeValue: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    minWidth: 50,
    textAlign: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  checkmark: {
    color: colors.accent.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  saveButtonContainer: {
    padding: spacing.md,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent.primary,
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.sm,
  },
  saveButtonText: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
});
