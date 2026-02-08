/**
 * Theme.js - Centralized Design System
 * Modern, minimalist, and professional aesthetic.
 */

// =============================================================================
// COLORS
// =============================================================================
export const COLORS = {
    // Primary (Blue) - Professional, Trustworthy
    primary: '#3B82F6',
    primary50: '#EFF6FF',
    primary100: '#DBEAFE',
    primary200: '#BFDBFE',
    primary300: '#93C5FD',
    primary400: '#60A5FA',
    primary500: '#3B82F6',
    primary600: '#2563EB',
    primary700: '#1D4ED8',
    primary800: '#1E40AF',
    primary900: '#1E3A8A',

    // Secondary (Slate/Gray) - Neutral, Balanced
    secondary: '#64748B',
    secondary50: '#F8FAFC',
    secondary100: '#F1F5F9',
    secondary200: '#E2E8F0',
    secondary300: '#CBD5E1',
    secondary400: '#94A3B8',
    secondary500: '#64748B',
    secondary600: '#475569',
    secondary700: '#334155',
    secondary800: '#1E293B',
    secondary900: '#0F172A',

    // Functional Colors
    success: '#10B981',    // Green
    warning: '#F59E0B',    // Amber
    error: '#EF4444',      // Red
    info: '#3B82F6',       // Blue
    
    // Feature Specific
    sale: '#10B981',       // Green
    rental: '#3B82F6',     // Blue
    decoration: '#F97316', // Orange
    expense: '#EF4444',    // Red

    // Backgrounds
    background: '#F8FAFC', // Very light slate (cleaner than pure gray)
    surface: '#FFFFFF',
    surfaceSubtle: '#F1F5F9',
    
    // Text
    text: '#0F172A',            // High contrast
    textSecondary: '#64748B',   // Medium contrast
    textTertiary: '#94A3B8',    // Low contrast
    textInverse: '#FFFFFF',
    
    // Borders
    border: '#E2E8F0',
    borderSubtle: '#F1F5F9',
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.4)',
};

// =============================================================================
// TYPOGRAPHY (Semantic Presets)
// =============================================================================
export const TYPOGRAPHY = {
    // Fonts
    fontFamily: {
        regular: 'System', // Use system font for now, ideally 'Inter' or similar
        medium: 'System-Medium',
        bold: 'System-Bold', 
    },

    // Semantic Presets
    presets: {
        h1: { fontSize: 32, fontWeight: '700', lineHeight: 40, letterSpacing: -0.5 },
        h2: { fontSize: 24, fontWeight: '700', lineHeight: 32, letterSpacing: -0.5 },
        h3: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
        h4: { fontSize: 18, fontWeight: '600', lineHeight: 26 },
        
        bodyLarge: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
        bodyMedium: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
        bodySmall: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
        
        label: { fontSize: 12, fontWeight: '600', lineHeight: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
        caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
    }
};

// =============================================================================
// SPACING (4px Grid)
// =============================================================================
export const SPACING = {
    px: 1,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
    '6xl': 64,
};

// =============================================================================
// SIZES & BORDERS
// =============================================================================
export const RADIUS = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    full: 9999,
};

export const SIZES = {
    // Interactive
    buttonHeight: 48,
    buttonHeightSm: 36,
    inputHeight: 48,
    checkbox: 20,
    
    // Icons
    iconSm: 16,
    iconMd: 20,
    iconLg: 24,
    iconXl: 32,
    
    // Layout
    headerHeight: 60,
    tabBarHeight: 64,
};

// =============================================================================
// SHADOWS (Soft & Natural)
// =============================================================================
export const SHADOWS = {
    none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    xs: {
        shadowColor: COLORS.secondary900,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    sm: {
        shadowColor: COLORS.secondary900,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    md: {
        shadowColor: COLORS.secondary900,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    lg: {
        shadowColor: COLORS.secondary900,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
    },
};

const Theme = {
    COLORS,
    TYPOGRAPHY,
    SPACING,
    RADIUS,
    SIZES,
    SHADOWS,
};

export default Theme;
