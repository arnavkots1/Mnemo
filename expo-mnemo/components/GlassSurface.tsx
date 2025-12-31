/**
 * GlassSurface - Reusable frosted glass container
 */

import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '../constants/NewDesignColors';

type Props = {
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: 'dark' | 'light' | 'default';
  children?: React.ReactNode;
};

export const GlassSurface: React.FC<Props> = ({
  style,
  intensity = 32,
  tint = 'dark',
  children,
}) => {
  return (
    <BlurView intensity={intensity} tint={tint} style={[styles.surface, style]}>
      {children}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  surface: {
    backgroundColor: 'rgba(52, 55, 60, 0.55)',
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
});
