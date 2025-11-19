/**
 * SettingsStore - Persistence layer for app settings
 * 
 * Uses AsyncStorage to persist user preferences.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'mnemo_settings';

export interface Settings {
  enablePassiveContextLogging: boolean;
  useActivityDetection: boolean;
  allowAudioEmotionalCapture: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  enablePassiveContextLogging: true,
  useActivityDetection: false,
  allowAudioEmotionalCapture: true,
};

/**
 * Load settings from AsyncStorage
 */
export async function loadSettings(): Promise<Settings> {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!data) {
      return { ...DEFAULT_SETTINGS };
    }
    const saved = JSON.parse(data) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...saved };
  } catch (error) {
    console.error('Error loading settings:', error);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Save settings to AsyncStorage
 */
export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
}

/**
 * Reset settings to defaults
 */
export async function resetSettingsToDefaults(): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
  } catch (error) {
    console.error('Error resetting settings:', error);
    throw error;
  }
}

// Export all functions as a named export object for compatibility
export const settingsStore = {
  loadSettings,
  saveSettings,
  resetSettingsToDefaults,
};
