import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../constants/Theme';

const QuickNavigationGrid = ({ onViewReports, onViewQuotations, onViewDataManagement }) => {
    return (
        <View style={styles.container}>
            <View style={styles.topRow}>
                {/* Reports Button */}
                <TouchableOpacity
                    style={styles.card}
                    onPress={onViewReports}
                    activeOpacity={0.7}
                >
                    <View style={[styles.iconContainer, { backgroundColor: COLORS.primary + '15' }]}>
                        <Feather name="bar-chart-2" size={24} color={COLORS.primary} />
                    </View>
                    <Text style={styles.label}>Reportes</Text>
                    <Text style={styles.subLabel}>Estadísticas</Text>
                </TouchableOpacity>

                {/* Quotations Button */}
                <TouchableOpacity
                    style={styles.card}
                    onPress={onViewQuotations}
                    activeOpacity={0.7}
                >
                    <View style={[styles.iconContainer, { backgroundColor: '#8B5CF6' + '15' }]}>
                        <Feather name="file-text" size={24} color="#8B5CF6" />
                    </View>
                    <Text style={styles.label}>Cotizaciones</Text>
                    <Text style={styles.subLabel}>Historial</Text>
                </TouchableOpacity>
            </View>

            {/* Data Management - Full Width */}
            <TouchableOpacity
                style={[styles.card, styles.fullWidthCard]}
                onPress={onViewDataManagement}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, { backgroundColor: COLORS.text + '10' }]}>
                    <Feather name="database" size={22} color={COLORS.text} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.label}>Gestión de Datos</Text>
                    <Text style={styles.subLabel}>Limpiar y administrar registros</Text>
                </View>
                <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: SPACING.md,
        marginTop: SPACING.lg,
        paddingTop: SPACING.md, // Add a bit of spacing above cards
        gap: SPACING.md,
    },
    topRow: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    card: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        ...SHADOWS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'flex-start',
    },
    fullWidthCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.lg,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    label: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.text,
        marginBottom: 2,
    },
    subLabel: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.textSecondary,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
        marginLeft: SPACING.md,
        // Override margin bottom from top cards logic
    }
});

export default QuickNavigationGrid;
