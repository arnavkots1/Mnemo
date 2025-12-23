/**
 * SettingsScreen - App settings and privacy controls
 * Soft pastel design
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useMemoryContext } from '../store/MemoryContext';
import { useSettingsContext } from '../store/SettingsContext';
import { locationService } from '../services/LocationService';
import { Colors, Shadows, BorderRadius, Spacing } from '../constants/NewDesignColors';

export const SettingsScreen: React.FC = () => {
  const { deleteAllMemories, addMemory } = useMemoryContext();
  const { settings, updateSettings, resetToDefaults } = useSettingsContext();
  
  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    try {
      await updateSettings({ [key]: value });
      
      if (key === 'enablePassiveContextLogging') {
        if (value) {
          try {
            await locationService.startPassiveLocationUpdates(addMemory);
            console.log('Passive context logging started');
          } catch (error) {
            console.error('Failed to start passive context logging:', error);
            Alert.alert(
              'Error',
              'Failed to start passive context logging. Please check location permissions in Settings.'
            );
            await updateSettings({ [key]: false });
          }
        } else {
          locationService.stopPassiveLocationUpdates();
          console.log('Passive context logging stopped');
        }
      }
      
      if (key === 'useActivityDetection') {
        console.log('Activity detection setting changed:', value);
      }
      
      if (key === 'allowAudioEmotionalCapture') {
        console.log('Audio emotional capture setting changed:', value);
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      Alert.alert('Error', 'Failed to update setting.');
    }
  };
  
  const handleDeleteAllData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your memories and reset settings to defaults. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllMemories();
              await resetToDefaults();
              Alert.alert('Success', 'All data has been deleted and settings reset.');
            } catch (error) {
              console.error('Error deleting all data:', error);
              Alert.alert('Error', 'Failed to delete all data.');
            }
          },
        },
      ]
    );
  };
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Privacy & preferences</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Privacy Description */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Privacy & Data</Text>
          <Text style={styles.infoText}>
            Your memories stay on your device. We don't collect, store, or share your personal data with anyone.
          </Text>
        </View>
        
        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Settings</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <View style={styles.settingIconBadge}>
                <Text style={styles.settingIcon}>🎙️</Text>
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Audio Recording</Text>
                <Text style={styles.settingDescription}>
                  Allow voice notes and emotion capture
                </Text>
              </View>
              <Switch
                value={settings.allowAudioEmotionalCapture}
                onValueChange={(value) => handleToggle('allowAudioEmotionalCapture', value)}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.cardLight}
              />
            </View>
          </View>

          {/* Photo Analysis removed - not in Settings type */}

          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <View style={styles.settingIconBadge}>
                <Text style={styles.settingIcon}>📍</Text>
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Location Tracking</Text>
                <Text style={styles.settingDescription}>
                  Log places you visit automatically
                </Text>
              </View>
              <Switch
                value={settings.enablePassiveContextLogging}
                onValueChange={(value) => handleToggle('enablePassiveContextLogging', value)}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.cardLight}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <View style={styles.settingIconBadge}>
                <Text style={styles.settingIcon}>🚶</Text>
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Motion Detection</Text>
                <Text style={styles.settingDescription}>
                  Detect when you're moving
                </Text>
              </View>
              <Switch
                value={settings.useActivityDetection}
                onValueChange={(value) => handleToggle('useActivityDetection', value)}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.cardLight}
              />
            </View>
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIconBadge}>
              <Text style={styles.actionIcon}>📤</Text>
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Export Data</Text>
              <Text style={styles.actionDescription}>Download all your memories</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIconBadge}>
              <Text style={styles.actionIcon}>📥</Text>
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Import Data</Text>
              <Text style={styles.actionDescription}>Restore from backup</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          
          <View style={styles.dangerCard}>
            <View style={styles.dangerHeader}>
              <View style={styles.dangerIconBadge}>
                <Text style={styles.dangerIcon}>⚠️</Text>
              </View>
              <View>
                <Text style={styles.dangerTitle}>Delete All Data</Text>
                <Text style={styles.dangerDescription}>
                  This will permanently delete all your memories and settings
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.dangerButton}
              onPress={handleDeleteAllData}
            >
              <Text style={styles.dangerButtonText}>Delete Everything</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.infoCard}>
          <Text style={styles.appName}>Mnemo</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appDescription}>
            Your personal memory companion. Private, secure, and always with you.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.cardLight,
    borderBottomLeftRadius: BorderRadius.large,
    borderBottomRightRadius: BorderRadius.large,
    ...Shadows.small,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  infoCard: {
    backgroundColor: Colors.secondary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.large,
    marginBottom: Spacing.lg,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.xs,
  },
  settingCard: {
    backgroundColor: Colors.cardLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.large,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  settingIconBadge: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.small,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingIcon: {
    fontSize: 20,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionCard: {
    backgroundColor: Colors.cardLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.large,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.small,
  },
  actionIconBadge: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.small,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 20,
  },
  actionInfo: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  actionDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionArrow: {
    fontSize: 20,
    color: Colors.textMuted,
    fontWeight: '700',
  },
  dangerCard: {
    backgroundColor: Colors.error,
    padding: Spacing.lg,
    borderRadius: BorderRadius.large,
    ...Shadows.small,
  },
  dangerHeader: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  dangerIconBadge: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.small,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerIcon: {
    fontSize: 20,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dangerDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  dangerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.small,
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  appVersion: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  appDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
});

