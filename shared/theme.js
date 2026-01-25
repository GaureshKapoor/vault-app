// Vault Design System - Dark Theme (matches web)
// Based on apps/web/src/index.css dark mode

export const colors = {
  // Core
  background: '#09090b', // 240 10% 4%
  foreground: '#fafafa', // 0 0% 98%

  // Card
  card: '#0f0f11', // 240 10% 6%
  cardForeground: '#fafafa',

  // Primary - Vibrant purple
  primary: '#8b5cf6', // 263 70% 58%
  primaryForeground: '#ffffff',
  primaryStrong: '#7c3aed', // 263 82% 50%
  primarySoft: '#2e1065', // 263 50% 20%
  primaryLight: '#2e1065', // alias for primarySoft

  // Secondary
  secondary: '#27272a', // 240 4% 16%
  secondaryForeground: '#fafafa',

  // Muted
  muted: '#27272a', // 240 4% 16%
  mutedForeground: '#a1a1aa', // 215 20% 65%

  // Accent
  accent: '#2e1065', // 263 50% 20%
  accentForeground: '#a78bfa', // 263 70% 70%

  // Border
  border: '#27272a', // 240 4% 16%
  input: '#27272a',

  // Status Colors
  status: {
    idea: '#8b5cf6',
    exploring: '#0ea5e9',
    shortlisted: '#eab308',
    building: '#22c55e',
    paused: '#71717a',
    shipped: '#7c3aed',
  },

  // Utility
  success: '#22c55e',
  successLight: '#16331f', // dark green for backgrounds
  error: '#ef4444',
  errorLight: '#3b1515', // dark red for backgrounds
  warning: '#f59e0b',
  warningLight: '#3b2f0d', // dark amber for backgrounds

  // Convenience aliases (for iOS screens)
  text: '#fafafa', // alias for foreground
  textSecondary: '#a1a1aa', // alias for mutedForeground
  white: '#ffffff',
  black: '#000000',
  surface: '#18181b', // slightly lighter than background for cards/inputs
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const typography = {
  // Font sizes (direct access)
  xs: 12,
  sm: 14,
  base: 16,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,

  // Font sizes (nested for compatibility)
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },

  // Font weights (direct access)
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',

  // Font weights (nested for compatibility)
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
};

// Common shadow for cards and buttons
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primary: {
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
};

export default {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
};
