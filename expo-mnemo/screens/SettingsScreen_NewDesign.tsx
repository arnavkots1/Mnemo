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
import { useNavigation } from '@react-navigation/native';
import { useMemoryContext } from '../store/MemoryContext';
import { useSettingsContext } from '../store/SettingsContext';
import { locationService } from '../services/LocationService';
import { Colors, Shadows, BorderRadius, Spacing } from '../constants/NewDesignColors';
import { GlassSurface } from '../components/GlassSurface';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
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
      <GlassSurface style={styles.header} intensity={26}>
        <Text style={[styles.title, { fontSize: titleSize }]}>Settings</Text>
        <Text style={[styles.subtitle, { fontSize: subtitleSize }]}>Privacy & preferences</Text>
      </GlassSurface>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Privacy Description */}
        <GlassSurface style={styles.infoCard} intensity={24}>
          <Text style={[styles.infoTitle, { fontSize: labelSize + 1 }]}>Privacy & Data</Text>
          <Text style={[styles.infoText, { fontSize: descSize + 1 }]}>
            Your memories stay on your device. We don't collect or share your data.
          </Text>
        </GlassSurface>
        
        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: sectionTitleSize }]}>Privacy Settings</Text>
          
          <GlassSurface style={styles.settingCard} intensity={22}>
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
          </GlassSurface>

          {/* Photo Analysis removed - not in Settings type */}

          <GlassSurface style={styles.settingCard} intensity={22}>
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
          </GlassSurface>

          <GlassSurface style={styles.settingCard} intensity={22}>
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
          </GlassSurface>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: sectionTitleSize }]}>Danger Zone</Text>
          
          <GlassSurface style={styles.dangerCard} intensity={24}>
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
          </GlassSurface>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: sectionTitleSize }]}>Legal</Text>
          <TouchableOpacity
            onPress={() => {
              // @ts-ignore - navigation type
              navigation.navigate('Legal');
            }}
          >
            <GlassSurface style={styles.settingCard} intensity={22}>
              <View style={styles.settingHeader}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { fontSize: labelSize }]}>
                    Privacy Policy & Terms
                  </Text>
                  <Text style={[styles.settingDescription, { fontSize: descSize }]}>
                    View our privacy policy and terms of service
                  </Text>
                </View>
                <Text style={[styles.chevron, { fontSize: iconSize }]}>›</Text>
              </View>
            </GlassSurface>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <GlassSurface style={styles.infoCard} intensity={24}>
          <Text style={[styles.appName, { fontSize: titleSize - 6 }]}>Mnemo</Text>
          <Text style={[styles.appVersion, { fontSize: descSize }]}>Version 1.0.0</Text>
          <Text style={[styles.appDescription, { fontSize: descSize + 1 }]}>
            Your personal memory companion. Private, secure, always with you.
          </Text>
        </GlassSurface>

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
    backgroundColor: Colors.cardDark,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontWeight: '800',
    color: Colors.textPrimary,
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
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  infoCard: {
    backgroundColor: 'rgba(52, 55, 60, 0.75)',
    borderRadius: BorderRadius.extraLarge,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoTitle: {
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  infoText: {
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  settingCard: {
    backgroundColor: 'rgba(52, 55, 60, 0.75)',
    borderRadius: BorderRadius.extraLarge,
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
    backgroundColor: Colors.cardDark,
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  settingInfo: {
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  settingDescription: {
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  dangerCard: {
    backgroundColor: 'rgba(242, 139, 130, 0.2)',
    borderRadius: BorderRadius.extraLarge,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.error,
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
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  dangerDescription: {
    color: Colors.textSecondary,
    lineHeight: 18,
    flexShrink: 1,
    width: '100%',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  dangerButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.extraLarge,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  appName: {
    fontWeight: '800',
    color: Colors.textPrimary,
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
  chevron: {
    color: Colors.textMuted,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
});
