import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, RADIUS } from '../../constants/Theme';

const BalanceCard = ({ summary = {} }) => {
    const { totalIncome = 0, expenses = { total: 0 }, balance = 0 } = summary;
    const isPositive = balance >= 0;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Balance General</Text>
                <View style={[styles.trendBadge, { backgroundColor: isPositive ? '#DCFCE7' : '#FEE2E2' }]}>
                    <Feather
                        name={isPositive ? "trending-up" : "trending-down"}
                        size={16}
                        color={isPositive ? '#16A34A' : '#DC2626'}
                    />
                    <Text style={[styles.trendText, { color: isPositive ? '#16A34A' : '#DC2626' }]}>
                        {isPositive ? 'Positivo' : 'Negativo'}
                    </Text>
                </View>
            </View>

            <View style={styles.mainBalance}>
                <Text style={styles.balanceLabel}>Balance Neto</Text>
                <Text style={[
                    styles.balanceValue,
                    isPositive ? styles.positiveValue : styles.negativeValue
                ]}>
                    {formatCurrency(balance)}
                </Text>
            </View>

            <View style={styles.detailsContainer}>
                {/* Ingresos Column */}
                <View style={styles.detailColumn}>
                    <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
                        <Feather name="arrow-up-right" size={20} color="#16A34A" />
                    </View>
                    <View>
                        <Text style={styles.detailLabel}>Ingresos</Text>
                        <Text style={[styles.detailValue, { color: '#16A34A' }]}>
                            {formatCurrency(totalIncome)}
                        </Text>
                    </View>
                </View>

                <View style={styles.verticalDivider} />

                {/* Gastos Column */}
                <View style={styles.detailColumn}>
                    <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                        <Feather name="arrow-down-left" size={20} color="#DC2626" />
                    </View>
                    <View>
                        <Text style={styles.detailLabel}>Gastos</Text>
                        <Text style={[styles.detailValue, { color: '#DC2626' }]}>
                            {formatCurrency(expenses.total)}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default BalanceCard;

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginHorizontal: SPACING.md,
        marginVertical: SPACING.sm,
        ...SHADOWS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.lg,
    },
    title: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: RADIUS.full,
        gap: 4,
    },
    trendText: {
        fontSize: TYPOGRAPHY.size.xs,
        fontWeight: TYPOGRAPHY.weight.bold,
    },
    mainBalance: {
        marginBottom: SPACING.xl,
    },
    balanceLabel: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    balanceValue: {
        fontSize: 32, // Large standout font
        fontWeight: '800', // Extra bold
        letterSpacing: -0.5,
    },
    positiveValue: {
        color: '#111827',
    },
    negativeValue: {
        color: '#DC2626',
    },
    detailsContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.background, // Subtle contrast background for details
        borderRadius: RADIUS.md, // Border radius for the container itself
        padding: SPACING.md,
    },
    detailColumn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    verticalDivider: {
        width: 1,
        backgroundColor: COLORS.border, // Darker border for divider
        marginHorizontal: SPACING.sm,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.bold,
    },
});
