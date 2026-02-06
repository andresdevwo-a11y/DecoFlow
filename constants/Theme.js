/**
 * Theme.js - Sistema de Diseño Centralizado
 * Paleta de colores versión móvil minimalista (azul profesional)
 */

// =============================================================================
// COLORES
// =============================================================================
export const COLORS = {
    // Color de Acento
    primary: '#3B82F6',          // Azul (Acento principal)
    primaryDisabled: '#93C5FD',  // Botón principal disabled
    primaryBorder: '#93C5FD',    // Bordes / divisores azules

    // Secondary Colors
    secondary: '#3B82F6',        // Azul (Alquileres / Info)
    success: '#10B981',          // Verde (Ventas / Éxito)
    warning: '#F59E0B',          // Ámbar (Alertas)
    info: '#3B82F6',             // Azul (Info)

    // Colores Neutros
    background: '#F3F4F6',       // Fondo principal
    surface: '#FFFFFF',          // Fondo secundario / Cards
    border: '#E5E5E5',           // Bordes / Divisores
    inputBorder: '#D1D5DB',      // Borde de inputs (más oscuro)

    // Texto
    text: '#111827',             // Texto principal
    textSecondary: '#4B5563',    // Texto secundario
    textMuted: '#6B7280',        // Texto atenuado
    placeholder: '#9CA3AF',      // Placeholder / Disabled

    // Estados de error / destructivo
    error: '#EF4444',            // Rojo principal
    errorDark: '#DC2626',        // Rojo presionado
    errorLight: '#FEE2E2',       // Fondo de error sutil
    errorDisabled: '#FCA5A5',    // Error disabled

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)', // Fondo de modales

    // Módulos Financieros
    sale: '#22C55E',             // Verde (Ventas)
    rental: '#3B82F6',           // Azul (Alquileres)
    decoration: '#F97316',       // Naranja (Decoraciones)
    expense: '#EF4444',          // Rojo (Gastos)
};

// =============================================================================
// TIPOGRAFÍA
// =============================================================================
export const TYPOGRAPHY = {
    // Tamaños de fuente (escala de 2px)
    size: {
        xs: 10,      // Labels pequeños, nav bar
        sm: 12,      // Item count, descripciones menores
        md: 13,      // Descripciones
        base: 14,    // Texto base, valores
        lg: 15,      // Precios, mensajes
        xl: 16,      // Nombres, labels, inputs
        '2xl': 18,   // Headers de modales/sheets
        '3xl': 20,   // Títulos de modales, empty states
        '4xl': 24,   // Títulos de sección
        '5xl': 28,   // Título de pantallas (Settings)
    },

    // Pesos de fuente
    weight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: 'bold',
    },

    // Letter spacing
    letterSpacing: {
        wide: 1.0,
    },

    // Line heights
    lineHeight: {
        tight: 18,
        normal: 22,
        relaxed: 24,
    },
};

// =============================================================================
// ESPACIADO (basado en sistema de 4px)
// =============================================================================
export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
};

// =============================================================================
// BORDES
// =============================================================================
export const RADIUS = {
    sm: 8,       // Inputs, botones pequeños
    md: 12,      // Settings cards, color circles
    lg: 16,      // Cards principales, modales
    xl: 24,      // Bottom sheets
    full: 9999,  // Círculos perfectos
};

// =============================================================================
// SOMBRAS (minimalistas)
// =============================================================================
export const SHADOWS = {
    // Sombra sutil para cards
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },

    // Sombra pequeña (equivalent to small)
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },

    // Sombra para modales
    modal: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },

    // Sombra para bottom sheets
    sheet: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 8,
    },

    // Sombra para nav bar
    navBar: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 4,
    },

    // Sombra para FAB
    fab: {
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 3,
    },

    // Sombra media (para floating controls)
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },

    // Sombra grande (para panels)
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },

    // Sin sombra
    none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
};

// =============================================================================
// TAMAÑOS DE COMPONENTES
// =============================================================================
export const SIZES = {
    // Header
    headerHeight: 60,

    // Bottom Nav
    navBarHeight: 70,
    fabSize: 56,

    // Icons
    iconSm: 20,
    iconMd: 22,
    iconLg: 24,
    iconXl: 28,
    iconEmpty: 48,

    // Icon containers
    iconContainerSm: 36,
    iconContainerMd: 40,
    iconContainerLg: 64,
    iconContainerEmpty: 100,

    // Buttons
    buttonHeight: 48,
    buttonPaddingVertical: 12,

    // Inputs
    inputHeight: 48,

    // Cards
    cardImageHeight: 130,

    // Color picker
    colorCircle: 36,

    // Drag indicator
    dragIndicatorWidth: 40,
    dragIndicatorHeight: 4,

    // Misc
    checkbox: 24,
    minTabWidth: 64,
    borderWidthThick: 1.5, // For selection indicators
};

// =============================================================================
// EXPORTACIÓN POR DEFECTO
// =============================================================================
const Theme = {
    COLORS,
    TYPOGRAPHY,
    SPACING,
    RADIUS,
    SHADOWS,
    SIZES,
};

export default Theme;
