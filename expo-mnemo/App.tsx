/**
 * Main App Component - Mnemo Expo App
 * 
 * Sets up navigation with bottom tabs (Capture, Moments, Settings).
 * Wraps app with MemoryProvider and SettingsProvider for global state management.
 */

import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { MemoryProvider, useMemoryContext } from './store/MemoryContext';
import { SettingsProvider, useSettingsContext } from './store/SettingsContext';
import { CaptureStackNavigator } from './navigation/CaptureStackNavigator';
import { MomentsScreen } from './screens/MomentsScreen';
import { MemoriesScreen } from './screens/MemoriesScreen'; // NEW 5th tab
import { VisionScreen } from './screens/VisionScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { locationService } from './services/LocationService';
import { initializeApiConfig } from './config/apiConfig';

const Tab = createBottomTabNavigator();

/**
 * Inner app component that has access to MemoryContext and SettingsContext
 */
const AppContent: React.FC = () => {
  const { addMemory } = useMemoryContext();
  const { settings, isLoading: settingsLoading } = useSettingsContext();
  
  useEffect(() => {
    // Initialize passive context logging if enabled
    const initializePassiveLogging = async () => {
      try {
        if (settings.enablePassiveContextLogging) {
          await locationService.startPassiveLocationUpdates(addMemory);
          // Success - service started (may be foreground-only in Expo Go, which is fine)
        }
      } catch (error) {
        // Silently handle - location service will gracefully fall back to foreground-only
        // This is expected behavior in Expo Go
      }
    };
    
    if (!settingsLoading) {
      initializePassiveLogging();
    }
    
    // Cleanup on unmount
    return () => {
      try {
        locationService.stopPassiveLocationUpdates();
      } catch (error) {
        // Silently handle cleanup errors
      }
    };
  }, [addMemory, settings.enablePassiveContextLogging, settingsLoading]);
  
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#FF6B6B',
          tabBarInactiveTintColor: '#7A7A8A',
          tabBarStyle: {
            paddingBottom: 8,
            paddingTop: 8,
            height: 68,
            backgroundColor: '#1A1A24',
            borderTopWidth: 1,
            borderTopColor: '#2A2A38',
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.5,
            shadowRadius: 8,
            elevation: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tab.Screen
          name="CaptureTab"
          component={CaptureStackNavigator}
          options={{
            tabBarIcon: ({ color }) => <TabIcon label="◆" color={color} />,
            tabBarLabel: 'Home',
          }}
        />
        <Tab.Screen
          name="Moments"
          component={MomentsScreen}
          options={{
            tabBarIcon: ({ color }) => <TabIcon label="●" color={color} />,
            tabBarLabel: 'Moments',
          }}
        />
        <Tab.Screen
          name="Memories"
          component={MemoriesScreen}
          options={{
            tabBarIcon: ({ color }) => <TabIcon label="★" color={color} />,
            tabBarLabel: 'Memories',
          }}
        />
        <Tab.Screen
          name="Vision"
          component={VisionScreen}
          options={{
            tabBarIcon: ({ color }) => <TabIcon label="◉" color={color} />,
            tabBarLabel: 'Vision',
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarIcon: ({ color }) => <TabIcon label="◈" color={color} />,
            tabBarLabel: 'Settings',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  // Initialize API configuration on app startup
  useEffect(() => {
    initializeApiConfig();
  }, []);

  return (
    <SettingsProvider>
      <MemoryProvider>
        <AppContent />
      </MemoryProvider>
    </SettingsProvider>
  );
}

// Geometric symbol-based tab icon component
const TabIcon: React.FC<{ label: string; color: string }> = ({ label, color }) => {
  return (
    <Text style={{ 
      fontSize: 24, 
      fontWeight: '400', 
      color: color,
      letterSpacing: 0,
    }}>
      {label}
    </Text>
  );
};

