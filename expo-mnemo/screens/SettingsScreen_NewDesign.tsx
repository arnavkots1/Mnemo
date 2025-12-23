/**
 * SettingsScreen - Fully responsive app settings and privacy controls
 * Adapts to any phone screen size
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
  useWindowDimensions,
} from 'react-native';
import { useMemoryContext } from '../store/MemoryContext';
import { useSettingsContext } from '../store/SettingsContext';
import { locationService } from '../services/LocationService';
import { Colors, Shadows, BorderRadius, Spacing } from '../constants/NewDesignColors';

export const SettingsScreen: React.FC = () => {
  const { deleteAllMemories, addMemory } = useMemoryContext();
  const { settings, updateSettings, resetToDefaults } = useSettingsContext();
  const dimensions = useWindowDimensions();
  
  // Responsive sizing based on screen width
  const isSmallScreen = dimensions.width < 380;
  const isTinyScreen = dimensions.width < 350;
  
  const titleSize = isTinyScreen ? 24 : isSmallScreen ? 28 : 32;
  const subtitleSize = isTinyScreen ? 12 : isSmallScreen ? 13 : 14;
  const sectionTitleSize = isTinyScreen ? 14 : isSmallScreen ? 16 : 18;
  const labelSize = isTinyScreen ? 13 : isSmallScreen ? 14 : 15;
  const descSize = isTinyScreen ? 10 : isSmallScreen ? 11 : 12;
  const iconSize = isTinyScreen ? 18 : isSmallScreen ? 20 : 24;
  const buttonTextSize = isTinyScreen ? 14 : isSmallScreen ? 15 : 16;
  
  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    try {
      await updateSettings({ [key]: value });
      
      if (key === 'enablePassiveContextLogging') {
        if (value) {
          try {
            await locationService.startPassiveLocationUpdates(addMemory);
            console.log('Location tracking started');
          } catch (error) {
            console.error('Failed to start location tracking:', error);
            Alert.alert(
              'Error',
              'Failed to start location tracking. Check location permissions in Settings.'
            );
            await updateSettings({ [key]: false });
          }
        } else {
          locationService.stopPassiveLocationUpdates();
          console.log('Location tracking stopped');
        }
      }
      
      if (key === 'useActivityDetection') {
        console.log('Activity detection changed:', value);
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      Alert.alert('Error', 'Failed to update setting.');
    }
  };
  
  const handleDeleteAllData = () => {
    Alert.alert(
      'Delete Everything?',
      'This will permanently delete ALL your memories and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllMemories();
              await resetToDefaults();
              Alert.alert('Success', 'All data has been deleted.');
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
        <Text style={[styles.title, { fontSize: titleSize }]}>Settings</Text>
        <Text style={[styles.subtitle, { fontSize: subtitleSize }]}>Privacy & preferences</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Privacy Description */}
        <View style={styles.infoCard}>
          <Text style={[styles.infoTitle, { fontSize: labelSize + 1 }]}>Privacy & Data</Text>
          <Text style={[styles.infoText, { fontSize: descSize + 1 }]}>
            Your memories stay on your device. We don't collect or share your data.
          </Text>
        </View>
        
        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: sectionTitleSize }]}>Privacy Settings</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <View style={[styles.settingIconBadge, { width: iconSize + 16, height: iconSize + 16 }]}>
                <Text style={{ fontSize: iconSize }}>🎙️</Text>
              </View>
              <View style={[styles.settingInfo, { flex: 1, marginRight: Spacing.sm }]}>
                <Text style={[styles.settingLabel, { fontSize: labelSize }]} numberOfLines={1}>
                  Voice Recording
                </Text>
                <Text style={[styles.settingDescription, { fontSize: descSize }]} numberOfLines={2}>
                  Allow voice notes
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
              <View style={[styles.settingIconBadge, { width: iconSize + 16, height: iconSize + 16 }]}>
                <Text style={{ fontSize: iconSize }}>📍</Text>
              </View>
              <View style={[styles.settingInfo, { flex: 1, marginRight: Spacing.sm }]}>
                <Text style={[styles.settingLabel, { fontSize: labelSize }]} numberOfLines={1}>
                  Location Tracking
                </Text>
                <Text style={[styles.settingDescription, { fontSize: descSize }]} numberOfLines={2}>
                  Log places you visit
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
              <View style={[styles.settingIconBadge, { width: iconSize + 16, height: iconSize + 16 }]}>
                <Text style={{ fontSize: iconSize }}>🚶</Text>
              </View>
              <View style={[styles.settingInfo, { flex: 1, marginRight: Spacing.sm }]}>
                <Text style={[styles.settingLabel, { fontSize: labelSize }]} numberOfLines={1}>
                  Motion Detection
                </Text>
                <Text style={[styles.settingDescription, { fontSize: descSize }]} numberOfLines={2}>
                  Detect movement
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

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: sectionTitleSize }]}>Danger Zone</Text>
          
          <View style={styles.dangerCard}>
            <View style={styles.dangerHeader}>
              <View style={[styles.dangerIconBadge, { width: iconSize + 20, height: iconSize + 20 }]}>
                <Text style={{ fontSize: iconSize + 4 }}>⚠️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dangerTitle, { fontSize: labelSize }]} numberOfLines={1}>
                  Delete All Data
                </Text>
                <Text style={[styles.dangerDescription, { fontSize: descSize }]} numberOfLines={3}>
                  Permanently delete all memories and settings
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.dangerButton}
              onPress={handleDeleteAllData}
            >
              <Text style={[styles.dangerButtonText, { fontSize: buttonTextSize }]}>Delete Everything</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.infoCard}>
          <Text style={[styles.appName, { fontSize: titleSize - 6 }]}>Mnemo</Text>
          <Text style={[styles.appVersion, { fontSize: descSize }]}>Version 1.0.0</Text>
          <Text style={[styles.appDescription, { fontSize: descSize + 1 }]}>
            Your personal memory companion. Private, secure, always with you.
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
    paddingTop: Spacing.extraLarge + 20,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.cardLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.tiny,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontWeight: '500',
    flexShrink: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  infoCard: {
    backgroundColor: Colors.cardLight,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoTitle: {
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  infoText: {
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  settingCard: {
    backgroundColor: Colors.cardLight,
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIconBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  settingInfo: {
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  dangerCard: {
    backgroundColor: '#FFF0F0',
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#FFCCCC',
    width: '100%',
    overflow: 'hidden',
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  dangerIconBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  dangerTitle: {
    fontWeight: '700',
    color: '#D32F2F',
    marginBottom: 4,
  },
  dangerDescription: {
    color: '#B71C1C',
    lineHeight: 18,
    flexShrink: 1,
    width: '100%',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  dangerButton: {
    backgroundColor: '#D32F2F',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.small,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: Colors.white,
    fontWeight: '700',
  },
  appName: {
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.tiny,
  },
  appVersion: {
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  appDescription: {
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
