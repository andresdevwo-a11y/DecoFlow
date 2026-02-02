import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../constants/Theme';

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
                <Feather name="trending-up" size={20} color={COLORS.primary} />
                <Text style={styles.title}>Balance General</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
                <Text style={styles.label}>Ingresos</Text>
                <Text style={[styles.value, styles.income]}>
                    {formatCurrency(totalIncome)}
                </Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Gastos</Text>
                <Text style={[styles.value, styles.expense]}>
                    -{formatCurrency(expenses.total)}
                </Text>
            </View>

            <View style={styles.balanceDivider} />

            <View style={styles.row}>
                <Text style={styles.balanceLabel}>Balance Neto</Text>
                <Text style={[
                    styles.balanceValue,
                    isPositive ? styles.positive : styles.negative
                ]}>
                    {formatCurrency(balance)}
                </Text>
            </View>
        </View>
    );
};

export default BalanceCard;

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: SPACING.lg,
        marginHorizontal: SPACING.md,
        marginVertical: SPACING.sm,
        ...SHADOWS.medium,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    title: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        marginLeft: SPACING.sm,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: SPACING.md,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: SPACING.xs,
    },
    label: {
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.textSecondary,
    },
    value: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.semibold,
    },
    income: {
        color: '#22C55E',
    },
    expense: {
        color: '#EF4444',
    },
    balanceDivider: {
        height: 2,
        backgroundColor: COLORS.primary,
        marginVertical: SPACING.md,
    },
    balanceLabel: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
    },
    balanceValue: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.bold,
    },
    positive: {
        color: '#22C55E',
    },
    negative: {
        color: '#EF4444',
    },
});
