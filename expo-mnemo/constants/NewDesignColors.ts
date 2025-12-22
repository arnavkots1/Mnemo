/**
 * New Design System - Soft Pastel Colors
 * Inspired by modern task management UI
 */

export const Colors = {
  // Primary Background
  background: '#FFF5F0',        // Soft cream/off-white
  backgroundDark: '#5C5C6F',    // Dark gray/charcoal for cards
  
  // Cards & Surfaces
  cardLight: '#FFFFFF',         // White cards
  cardDark: '#5C5C6F',          // Dark gray cards
  cardAccent: '#FFD4C3',        // Soft peach/pink
  
  // Accents & Actions
  primary: '#FFD4C3',           // Soft peach (buttons, highlights)
  secondary: '#D4E8F0',         // Soft blue (tags, badges)
  accent: '#E8E577',            // Soft yellow (progress, highlights)
  success: '#A8E6A1',           // Soft green
  
  // Text
  textPrimary: '#2D2D3F',       // Dark charcoal
  textSecondary: '#8B8B9E',     // Medium gray
  textLight: '#FFFFFF',         // White (on dark cards)
  textMuted: '#B5B5C5',         // Light gray
  
  // Borders & Dividers
  border: '#E8E8EE',            // Very light gray
  borderDark: '#4A4A5C',        // Dark border (on dark cards)
  
  // Additional Colors
  error: '#FFB4AB',             // Soft red/pink
  warning: '#FFE5B4',           // Soft orange/peach
  info: '#B4D4FF',              // Soft blue
  
  // Shadows
  shadow: 'rgba(93, 93, 111, 0.15)',
  shadowDark: 'rgba(0, 0, 0, 0.25)',
};

export const Gradients = {
  primary: ['#FFD4C3', '#FFE4D4'],
  blue: ['#D4E8F0', '#E4F4F8'],
  dark: ['#5C5C6F', '#4A4A5C'],
};

export const Shadows = {
  small: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  large: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const BorderRadius = {
  small: 12,
  medium: 16,
  large: 24,
  xlarge: 32,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};


