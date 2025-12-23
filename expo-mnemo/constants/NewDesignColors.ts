/**
 * DARK Theme Color Palette
 * Deep, rich colors with high contrast
 */

export const Colors = {
  // Backgrounds
  background: '#0A0A0F',        // Almost black
  backgroundLight: '#12121A',   // Very dark gray
  cardDark: '#1A1A24',          // Dark card
  cardLight: '#232330',         // Lighter card
  
  // Primary colors
  primary: '#FF6B6B',           // Vibrant red
  primaryLight: '#FF8787',      // Light red
  secondary: '#4ECDC4',         // Teal accent
  accent: '#FFE66D',            // Warm yellow
  
  // Text colors
  text: '#FFFFFF',              // Pure white
  textLight: '#E8E8F0',         // Off white
  textSecondary: '#B8B8C8',     // Light gray
  textMuted: '#7A7A8A',         // Muted gray
  textPrimary: '#FFFFFF',       // White
  
  // UI elements
  border: '#2A2A38',            // Dark border
  borderLight: '#3A3A48',       // Lighter border
  
  // Status colors
  success: '#4ECDC4',           // Teal
  warning: '#FFE66D',           // Yellow
  error: '#FF6B6B',             // Red
  
  // Special colors
  white: '#FFFFFF',
  black: '#000000',
  peach: '#FF6B6B',             // Changed to red
  peachLight: '#FF8787',        // Light red
  charcoalDark: '#0A0A0F',      // Almost black
  charcoalLight: '#1A1A24',     // Dark gray
  charcoalBorder: '#2A2A38',    // Border
  cream: '#232330',             // Dark cream
};

export const Shadows = {
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 8,
  },
  button: {
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const BorderRadius = {
  tiny: 4,
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 24,
  round: 999,
};

export const Spacing = {
  tiny: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  extraLarge: 32,
};
