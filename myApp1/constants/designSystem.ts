// Design System - DivyaDrishti
// Centralized design tokens for consistent UI/UX

export const COLORS = {
  // Base colors
  background: '#0A0A0A',
  surface: '#1C1C1E',
  border: '#333333',
  
  // Primary colors
  primary: '#FFD60A',
  primaryDark: '#FFC700',
  
  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
  
  // Semantic colors
  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF3B30',
  info: '#0A84FF',
};

export const TYPOGRAPHY = {
  // Font families
  fontRegular: 'Atkinson-Regular',
  fontBold: 'Atkinson-Bold',
  fontMedium: 'Atkinson-Bold', // Using Bold as Medium fallback
  
  // Font sizes
  hero: 48,
  h1: 36,
  h2: 28,
  h3: 24,
  h4: 20,
  lg: 18,
  body: 18,
  base: 16,
  small: 14,
  caption: 12,
  
  // Line heights (multipliers)
  lineHeightTight: 1.2,
  lineHeightNormal: 1.4,
  lineHeightRelaxed: 1.6,
  
  // Letter spacing
  letterSpacingTight: 0.5,
  letterSpacingNormal: 1,
  letterSpacingWide: 1.5,
  letterSpacingExtraWide: 2,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  xxxxl: 64,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#FFD60A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const ANIMATIONS = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
};

export const HAPTICS = {
  light: 10,
  medium: 20,
  heavy: 50,
};
