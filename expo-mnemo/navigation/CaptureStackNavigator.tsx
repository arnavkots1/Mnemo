/**
 * CaptureStackNavigator - Stack navigator for Capture tab
 * 
 * Contains:
 * - CaptureScreen (main screen)
 * - EmotionalSessionScreen (full-screen capture session)
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CaptureScreen } from '../screens/CaptureScreen';
import { EmotionalSessionScreen } from '../screens/EmotionalSessionScreen';

export type CaptureStackParamList = {
  Capture: undefined;
  EmotionalSession: undefined;
};

const Stack = createNativeStackNavigator<CaptureStackParamList>();

export const CaptureStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Capture" component={CaptureScreen} />
      <Stack.Screen name="EmotionalSession" component={EmotionalSessionScreen} />
    </Stack.Navigator>
  );
};

