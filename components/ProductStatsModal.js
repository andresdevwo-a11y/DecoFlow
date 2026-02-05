import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, SIZES } from '../constants/Theme';
import { useFinance } from '../context/FinanceContext';
import CustomDatePicker from './finance/CustomDatePicker';

import { getPeriodDates } from '../utils/dateHelpers';

export default function ProductStatsModal({ visible, onClose, product }) {
    const { getProductStats } = useFinance();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Date Filter State
    const [selectedPeriod, setSelectedPeriod] = useState('all'); // 'all' | 'today' | 'week' | 'month' | 'year' | 'custom'
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    // Initial load
    useEffect(() => {
        if (visible && product) {
            handlePeriodChange('all');
        }
    }, [visible, product]);

    // Reload when dates change or modal opens
    useEffect(() => {
        if (visible && product) {
            loadStats();
        }
    }, [visible, product, startDate, endDate]);

    const loadStats = async () => {
        setLoading(true);
        try {
            const data = await getProductStats(product.id, startDate, endDate);
            setStats(data);
        } catch (error) {
            console.error("Error loading product stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
        if (period === 'all') {
            setStartDate(null);
            setEndDate(null);
            return;
        }

        const { startDate: newStart, endDate: newEnd } = getPeriodDates(period);
        setStartDate(newStart);
        setEndDate(newEnd);
    };

    const handleCustomDateChange = (type, date) => {
        setSelectedPeriod('custom');
        if (type === 'start') setStartDate(date);
        else setEndDate(date);
    };

    if (!visible || !product) return null;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const periodButtons = [
        { key: 'all', label: 'Todos' },
        { key: 'today', label: 'Hoy' },
        { key: 'week', label: 'Semana' },
        { key: 'month', label: 'Mes' },
        { key: 'year', label: 'Año' },
    ];

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { maxHeight: '90%' }]}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Estadísticas</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Feather name="x" size={SIZES.iconLg} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.productName} numberOfLines={2}>
                        {product.name}
                    </Text>

                    {/* Date Filters Section */}
                    <View style={styles.filterContainer}>
                        {/* Period Buttons */}
                        <View style={styles.periodButtonsContainer}>
                            {periodButtons.map((period) => (
                                <TouchableOpacity
                                    key={period.key}
                                    style={[
                                        styles.periodButton,
                                        selectedPeriod === period.key && styles.periodButtonSelected
                                    ]}
                                    onPress={() => handlePeriodChange(period.key)}
                                >
                                    <Text style={[
                                        styles.periodButtonText,
                                        selectedPeriod === period.key && styles.periodButtonTextSelected
                                    ]}>
                                        {period.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Custom Date Pickers */}
                        <View style={styles.dateRow}>
                            <View style={{ flex: 1, marginRight: SPACING.md }}>
                                <CustomDatePicker
                                    label="Desde"
                                    date={startDate}
                                    onDateChange={(d) => handleCustomDateChange('start', d)}
                                    placeholder="Inicio"
                                    maxDate={endDate ? new Date(endDate) : new Date()}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <CustomDatePicker
                                    label="Hasta"
                                    date={endDate}
                                    onDateChange={(d) => handleCustomDateChange('end', d)}
                                    placeholder="Fin"
                                    minDate={startDate ? new Date(startDate) : null}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Loading State Logic: Show spinner only on initial load (no stats yet) */}
                    {loading && !stats ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                            <Text style={{ marginTop: SPACING.sm, color: COLORS.textMuted }}>Cargando datos...</Text>
                        </View>
                    ) : stats ? (
                        <View style={[styles.content, loading && { opacity: 0.6 }]}>
                            {/* Sales Section */}
                            <View style={styles.sectionContainer}>
                                <View style={styles.sectionHeader}>
                                    <View style={[styles.iconContainer, { backgroundColor: COLORS.success + '20' }]}>
                                        <Feather name="shopping-bag" size={20} color={COLORS.success} />
                                    </View>
                                    <Text style={styles.sectionTitle}>Ventas</Text>
                                </View>
                                <View style={styles.statsRow}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statLabel}>Cantidad</Text>
                                        <Text style={styles.statValue}>{stats.sales.count}</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statLabel}>Total</Text>
                                        <Text style={[styles.statValue, { color: COLORS.success }]}>
                                            {formatCurrency(stats.sales.total)}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Rentals Section */}
                            <View style={styles.sectionContainer}>
                                <View style={styles.sectionHeader}>
                                    <View style={[styles.iconContainer, { backgroundColor: COLORS.secondary + '20' }]}>
                                        <Feather name="clock" size={20} color={COLORS.secondary || COLORS.warning} />
                                    </View>
                                    <Text style={styles.sectionTitle}>Alquileres</Text>
                                </View>
                                <View style={styles.statsRow}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statLabel}>Cantidad</Text>
                                        <Text style={styles.statValue}>{stats.rentals.count}</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statLabel}>Total</Text>
                                        <Text style={[styles.statValue, { color: COLORS.secondary || COLORS.warning }]}>
                                            {formatCurrency(stats.rentals.total)}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Total Section */}
                            <View style={[styles.sectionContainer, styles.totalContainer]}>
                                <Text style={styles.totalLabel}>Total Recaudado</Text>
                                <Text style={styles.totalValue}>
                                    {formatCurrency(stats.totalRevenue)}
                                </Text>
                            </View>

                            {/* Loading Overlay for updates */}
                            {loading && (
                                <View style={StyleSheet.absoluteFillObject}>
                                    <ActivityIndicator
                                        size="small"
                                        color={COLORS.primary}
                                        style={{
                                            position: 'absolute',
                                            top: SPACING.md,
                                            right: SPACING.md
                                        }}
                                    />
                                </View>
                            )}
                        </View>
                    ) : (
                        <Text style={styles.errorText}>No se pudieron cargar las estadísticas</Text>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: COLORS.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    modalContainer: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        width: '100%',
        maxWidth: 360,
        padding: SPACING.xl,
        ...SHADOWS.modal,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    closeButton: {
        padding: SPACING.xs,
    },
    productName: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.primary,
        marginBottom: SPACING.lg,
        textAlign: 'center',
    },
    filterContainer: {
        marginBottom: SPACING.lg,
        backgroundColor: COLORS.background,
        padding: SPACING.md,
        borderRadius: RADIUS.md,
    },
    periodButtonsContainer: {
        flexDirection: 'row',
        gap: SPACING.xs,
        marginBottom: SPACING.md,
    },
    periodButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderRadius: 8,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    periodButtonSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    periodButtonText: {
        fontSize: TYPOGRAPHY.size.xs,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.textSecondary,
    },
    periodButtonTextSelected: {
        color: '#FFF',
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    loadingContainer: {
        padding: SPACING['2xl'],
        alignItems: 'center',
        minHeight: 200,
        justifyContent: 'center'
    },
    content: {
        gap: SPACING.md,
    },
    sectionContainer: {
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
        gap: SPACING.sm,
    },
    iconContainer: {
        padding: 8,
        borderRadius: RADIUS.full,
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.text,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.xs,
    },
    statItem: {
        flex: 1,
    },
    statLabel: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.textMuted,
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    statValue: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
    },
    totalContainer: {
        backgroundColor: COLORS.primary + '10', // Light primary background
        alignItems: 'center',
        marginTop: SPACING.xs,
        borderWidth: 1,
        borderColor: COLORS.primary + '30',
    },
    totalLabel: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.primary,
        textTransform: 'uppercase',
        fontWeight: TYPOGRAPHY.weight.bold,
        letterSpacing: 0.5,
        marginBottom: SPACING.xs,
    },
    totalValue: {
        fontSize: TYPOGRAPHY.size['2xl'],
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.primary,
    },
    errorText: {
        color: COLORS.error,
        textAlign: 'center',
        marginVertical: SPACING.xl,
    }
});
