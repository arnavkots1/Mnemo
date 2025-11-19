/**
 * SettingsScreen - App settings and privacy controls
 * 
 * Uses SettingsContext for state management and integrates with services.
 */

import React, { useEffect } from 'react';
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

export const SettingsScreen: React.FC = () => {
  const { deleteAllMemories, addMemory } = useMemoryContext();
  const { settings, updateSettings, resetToDefaults } = useSettingsContext();
  
  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    try {
      await updateSettings({ [key]: value });
      
      // Handle passive context logging toggle
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
            // Revert toggle
            await updateSettings({ [key]: false });
          }
        } else {
          locationService.stopPassiveLocationUpdates();
          console.log('Passive context logging stopped');
        }
      }
      
      // Use Activity Detection - just stored for now, can be hooked later
      if (key === 'useActivityDetection') {
        console.log('Activity detection setting changed:', value);
        // TODO: Hook to motion/accelerometer service when implemented
      }
      
      // Allow Audio-based Emotional Capture - setting is stored
      // EmotionalSessionScreen will check this setting
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>
      
      {/* Privacy Description */}
      <View style={styles.privacySection}>
        <Text style={styles.privacyTitle}>Privacy & Data</Text>
        <Text style={styles.privacyText}>
          All data is stored locally on your device using AsyncStorage. No data is sent to external servers.
        </Text>
        <Text style={styles.privacyText}>
          Location logging and audio capture are opt-in features that you can enable or disable at any time.
        </Text>
        <Text style={styles.privacyText}>
          Emotional capture sessions are foreground-only—the microphone is never used secretly or in the background.
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Passive Context Logging</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Enable Passive Context Logging</Text>
            <Text style={styles.settingDescription}>
              Automatically log your location to create contextual memories. Works in foreground and optionally in background.
            </Text>
          </View>
          <Switch
            value={settings.enablePassiveContextLogging}
            onValueChange={(value) => handleToggle('enablePassiveContextLogging', value)}
          />
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Use Activity Detection</Text>
            <Text style={styles.settingDescription}>
              Detect if you're walking, running, or in a vehicle (experimental). Requires passive context logging to be enabled.
            </Text>
          </View>
          <Switch
            value={settings.useActivityDetection}
            onValueChange={(value) => handleToggle('useActivityDetection', value)}
            disabled={!settings.enablePassiveContextLogging}
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emotional Capture</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Allow Audio-based Emotional Capture</Text>
            <Text style={styles.settingDescription}>
              Enable microphone access for emotional capture sessions. If disabled, emotional sessions cannot be started.
            </Text>
          </View>
          <Switch
            value={settings.allowAudioEmotionalCapture}
            onValueChange={(value) => handleToggle('allowAudioEmotionalCapture', value)}
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteAllData}
        >
          <Text style={styles.deleteButtonText}>Delete All Data</Text>
        </TouchableOpacity>
        
        <Text style={styles.deleteWarning}>
          This will permanently delete all memories and reset settings to defaults. This action cannot be undone.
        </Text>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Mnemo v1.0.0</Text>
        <Text style={styles.footerText}>All data stored locally on your device</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  privacySection: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    margin: 20,
    marginTop: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  privacyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 12,
  },
  privacyText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
    marginBottom: 8,
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    padding: 16,
    margin: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteWarning: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
});
