/**
 * Dark Glass Theme Color Palette
 * Deep graphite surfaces with warm orange accents
 */

export const Colors = {
  // Backgrounds
  background: '#1F2125',        // Graphite
  backgroundLight: '#2A2D31',   // Lighter graphite
  cardDark: '#25282C',          // Deep card
  cardLight: '#34373C',         // Glassy card

  // Primary colors
  primary: '#E36C2C',           // Warm orange
  primaryLight: '#F09A5A',      // Light orange
  secondary: '#4C5057',         // Slate
  accent: '#F2A15A',            // Amber

  // Text colors
  text: '#F2F2F2',              // Off white
  textLight: '#FFFFFF',         // White
  textSecondary: '#B8BCC4',     // Soft gray
  textMuted: '#8B9098',         // Muted gray
  textPrimary: '#F2F2F2',       // Off white

  // UI elements
  border: '#3E4249',            // Dark border
  borderLight: '#4A4F57',       // Lighter border

  // Status colors
  success: '#76D39B',           // Soft green
  warning: '#F2C07B',           // Warm amber
  error: '#F28B82',             // Warm red
  info: '#7AB7F5',              // Cool blue

  // Special colors
  white: '#FFFFFF',
  black: '#000000',
  peach: '#E36C2C',
  peachLight: '#F09A5A',
  charcoalDark: '#1B1D21',
  charcoalLight: '#2C2F34',
  charcoalBorder: '#3E4249',
  cream: '#1F2125',
};

export const Shadows = {
  small: {
    shadowColor: 'rgba(0, 0, 0, 0.4)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: 'rgba(0, 0, 0, 0.5)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  large: {
    shadowColor: 'rgba(0, 0, 0, 0.6)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 8,
  },
  button: {
    shadowColor: 'rgba(227, 108, 44, 0.35)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
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
