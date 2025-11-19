/**
 * TodayStackNavigator - Stack navigator for Today tab
 * 
 * Contains:
 * - TodayScreen (main screen)
 * - EmotionalSessionScreen (emotional capture session)
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TodayScreen } from '../screens/TodayScreen';
import { EmotionalSessionScreen } from '../screens/EmotionalSessionScreen';

export type TodayStackParamList = {
  Today: undefined;
  EmotionalSession: undefined;
};

const Stack = createNativeStackNavigator<TodayStackParamList>();

export const TodayStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTintColor: '#333',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="Today"
        component={TodayScreen}
        options={{
          title: 'Today',
          headerShown: false, // TodayScreen has its own header
        }}
      />
      <Stack.Screen
        name="EmotionalSession"
        component={EmotionalSessionScreen}
        options={{
          title: 'Emotional Capture Session',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};

