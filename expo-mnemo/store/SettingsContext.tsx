/**
 * SettingsContext - React Context for global settings state management
 * 
 * Provides:
 * - settings state
 * - updateSettings method to update settings
 * - Automatic sync with SettingsStore
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SettingsStoreModule from './SettingsStore';

// Import Settings type
export type Settings = SettingsStoreModule.Settings;

// Try to use direct function imports, fallback to object if needed
const loadSettings = SettingsStoreModule.loadSettings || SettingsStoreModule.settingsStore?.loadSettings;
const saveSettings = SettingsStoreModule.saveSettings || SettingsStoreModule.settingsStore?.saveSettings;
const resetSettingsToDefaults = SettingsStoreModule.resetSettingsToDefaults || SettingsStoreModule.settingsStore?.resetSettingsToDefaults;

// Validate all functions are available
if (!loadSettings || !saveSettings || !resetSettingsToDefaults) {
  console.error('SettingsStore functions not available. Available exports:', Object.keys(SettingsStoreModule));
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/**
 * SettingsProvider - Provides settings context to the app
 */
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>({
    enablePassiveContextLogging: true,
    useActivityDetection: false,
    allowAudioEmotionalCapture: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load settings from store on mount
   */
  useEffect(() => {
    const loadInitialSettings = async () => {
      try {
        setIsLoading(true);
        const loadedSettings = await loadSettings();
        setSettings(loadedSettings);
      } catch (error) {
        console.error('Error loading initial settings:', error);
        // Use defaults on error to prevent app crash
        setSettings({
          enablePassiveContextLogging: true,
          useActivityDetection: false,
          allowAudioEmotionalCapture: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialSettings();
  }, []);

  /**
   * Update settings (partial update)
   */
  const updateSettings = useCallback(async (partial: Partial<Settings>) => {
    try {
      const updatedSettings = { ...settings, ...partial };
      await saveSettings(updatedSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      // Still update local state even if store save fails
      setSettings((prev) => ({ ...prev, ...partial }));
      // Don't throw - gracefully handle error
    }
  }, [settings]);

  /**
   * Reset settings to defaults
   */
  const resetToDefaults = useCallback(async () => {
    try {
      await resetSettingsToDefaults();
      const defaultSettings = await loadSettings();
      setSettings(defaultSettings);
    } catch (error) {
      console.error('Error resetting settings:', error);
      // Still reset local state even if store reset fails
      setSettings({
        enablePassiveContextLogging: true,
        useActivityDetection: false,
        allowAudioEmotionalCapture: true,
      });
      // Don't throw - gracefully handle error
    }
  }, []);

  const value: SettingsContextType = {
    settings,
    updateSettings,
    resetToDefaults,
    isLoading,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * Hook to use SettingsContext
 * 
 * @throws Error if used outside SettingsProvider
 */
export function useSettingsContext(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
}

