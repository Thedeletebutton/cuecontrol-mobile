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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header bar */}
          <View style={styles.headerBar}>
            <Text style={styles.headerBarTitle}>CueControl - Viewer Settings</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity style={[styles.iconButton, styles.closeButton]} onPress={onClose}>
                <Ionicons name="close" size={16} color={colors.status.error} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Account Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Account</Text>
              </View>
              <View style={styles.sectionContent}>
                <View style={styles.accountRow}>
                  <Ionicons name="person-circle" size={48} color={colors.accent.primary} />
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountEmail}>{userEmail ? userEmail.charAt(0).toUpperCase() + userEmail.slice(1) : 'Not signed in'}</Text>
                    <Text style={styles.accountStatus}>Signed In</Text>
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
                      <Ionicons name="remove" size={16} color={colors.accent.primary} />
                    </TouchableOpacity>
                    <Text style={styles.fontSizeValue}>{labelFontSize}px</Text>
                    <TouchableOpacity
                      style={styles.fontSizeButton}
                      onPress={() => onLabelFontSizeChange(Math.min(20, labelFontSize + 1))}
                    >
                      <Ionicons name="add" size={16} color={colors.accent.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={[styles.fontSizeRow, styles.fontSizeRowLast]}>
                  <Text style={styles.fontSizeLabel}>Input Font Size</Text>
                  <View style={styles.fontSizeControls}>
                    <TouchableOpacity
                      style={styles.fontSizeButton}
                      onPress={() => onInputFontSizeChange(Math.max(12, inputFontSize - 1))}
                    >
                      <Ionicons name="remove" size={16} color={colors.accent.primary} />
                    </TouchableOpacity>
                    <Text style={styles.fontSizeValue}>{inputFontSize}px</Text>
                    <TouchableOpacity
                      style={styles.fontSizeButton}
                      onPress={() => onInputFontSizeChange(Math.min(24, inputFontSize + 1))}
                    >
                      <Ionicons name="add" size={16} color={colors.accent.primary} />
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
                  <View style={[styles.checkbox, saveDjHandle && styles.checkboxChecked]}>
                    {saveDjHandle && <Ionicons name="checkmark" size={14} color={colors.text.primary} />}
                  </View>
                  <Text style={styles.checkboxLabel}>Remember Stream ID</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.checkboxRow} onPress={onToggleSaveUsername}>
                  <View style={[styles.checkbox, saveUsername && styles.checkboxChecked]}>
                    {saveUsername && <Ionicons name="checkmark" size={14} color={colors.text.primary} />}
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
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
    borderWidth: 2,
    borderColor: colors.border,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  headerBar: {
    height: 35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.main,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  headerBarTitle: {
    flex: 1,
    fontFamily: 'Helvetica Neue',
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 1,
    paddingLeft: 5,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 35,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    height: '100%',
  },
  iconButton: {
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 0,
    backgroundColor: colors.background.main,
  },
  closeButton: {
    borderColor: colors.status.error,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingLeft: 5,
    paddingRight: spacing.sm,
    height: 38,
    backgroundColor: colors.background.main,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontFamily: 'Helvetica Neue',
    fontSize: 18,
    fontWeight: '800',
    color: colors.accent.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionContent: {
    padding: spacing.lg,
    backgroundColor: colors.background.row,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
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
    fontFamily: 'Helvetica Neue',
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 1,
  },
  accountStatus: {
    fontFamily: 'Helvetica Neue',
    fontSize: 15,
    fontWeight: '800',
    color: colors.status.success,
    letterSpacing: 1,
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
    fontFamily: 'Helvetica Neue',
    color: colors.status.error,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  fontSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fontSizeRowLast: {
    borderBottomWidth: 0,
  },
  fontSizeLabel: {
    fontFamily: 'Helvetica Neue',
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 1,
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fontSizeButton: {
    width: 25,
    height: 25,
    borderWidth: 2,
    borderColor: colors.accent.primary,
    borderRadius: 0,
    backgroundColor: colors.background.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontSizeValue: {
    fontFamily: 'Helvetica Neue',
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
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
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background.panel,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  checkboxChecked: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  checkboxLabel: {
    fontFamily: 'Helvetica Neue',
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 1,
  },
  saveButtonContainer: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
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
    fontFamily: 'Helvetica Neue',
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
