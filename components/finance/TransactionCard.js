import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../constants/Theme';
import { parseLocalDate, getLocalDateString } from '../../utils/dateHelpers';

const TransactionCard = ({ transaction, onPress, onLongPress, onAddPayment }) => {
    const { type, productName, totalAmount, date, customerName, items, isInstallment, totalPrice, amountPaid } = transaction;

    const isSale = type === 'sale';
    const isRental = type === 'rental';
    const isDecoration = type === 'decoration';
    const isExpense = type === 'expense';

    // Calculate installment progress
    // Fix: cast isInstallment to boolean to avoid rendering 0 in JSX (which causes crash)
    const showInstallment = Boolean(isInstallment) && totalPrice > 0;
    const pendingAmount = showInstallment ? (totalPrice - (amountPaid || 0)) : 0;
    const progressPercent = showInstallment ? ((amountPaid || 0) / totalPrice) * 100 : 100;

    const getColors = () => {
        if (isSale) return { main: '#22C55E', bg: '#22C55E15' }; // Green
        if (isRental) return { main: '#3B82F6', bg: '#3B82F615' }; // Blue
        if (isDecoration) return { main: '#F97316', bg: '#F9731615' }; // Orange
        return { main: COLORS.error, bg: COLORS.error + '15' }; // Red
    };

    const colors = getColors();
    const installmentColor = '#8B5CF6'; // Purple for installment indicator

    const getIcon = () => {
        if (isSale) return 'shopping-cart';
        if (isRental) return 'package';
        if (isDecoration) return 'gift';
        return 'minus-circle';
    };

    const getTypeLabel = () => {
        if (isSale) return 'VENTA';
        if (isRental) return 'ALQUILER';
        if (isDecoration) return 'DECORACIÓN';
        return 'GASTO';
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

const formatRelativeDate = (dateString) => {
        const date = parseLocalDate(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const dateOnly = dateString.split('T')[0];
        const todayOnly = getLocalDateString();
        const yesterdayOnly = getLocalDateString(new Date(yesterday));

        if (dateOnly === todayOnly) return 'Hoy';
        if (dateOnly === yesterdayOnly) return 'Ayer';

        return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
        >
            {/* 1. Icon (Left) */}
            <View style={[styles.iconContainer, { backgroundColor: colors.bg }]}>
                <Feather name={getIcon()} size={20} color={colors.main} />
            </View>

            {/* 2. Content (Middle) */}
            <View style={styles.content}>
                <View style={styles.badgeRow}>
                    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                        <Text style={[styles.badgeText, { color: colors.main }]}>
                            {getTypeLabel()}
                        </Text>
                    </View>

                    {/* Installment Badge */}
                    {showInstallment && (
                        <View style={[styles.badge, { backgroundColor: installmentColor + '15', marginLeft: 4 }]}>
                            <Feather name="clock" size={10} color={installmentColor} style={{ marginRight: 3 }} />
                            <Text style={[styles.badgeText, { color: installmentColor }]}>ABONADO</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.productName} numberOfLines={1}>
                    {productName}
                </Text>

                {customerName ? (
                    <Text style={styles.customerName} numberOfLines={1}>
                        {customerName}
                    </Text>
                ) : null}

                {items && items.length > 1 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Feather name="layers" size={12} color={COLORS.textMuted} />
                        <Text style={{ fontSize: 11, color: COLORS.textMuted, marginLeft: 4 }}>
                            {items.length} productos
                        </Text>
                    </View>
                )}

                {/* Installment Progress Bar */}
                {showInstallment && (
                    <View style={styles.installmentSection}>
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBackground}>
                                <View style={[styles.progressFill, { width: `${Math.min(progressPercent, 100)}%`, backgroundColor: installmentColor }]} />
                            </View>
                        </View>
                        <Text style={styles.installmentText}>
                            {formatCurrency(amountPaid || 0)} / {formatCurrency(totalPrice)}
                        </Text>
                        <Text style={styles.pendingText}>
                            Pendiente: {formatCurrency(pendingAmount)}
                        </Text>
                    </View>
                )}
            </View>

            {/* 3. Amount & Date (Right) */}
            <View style={styles.rightContent}>
                <Text style={[styles.amount, { color: showInstallment ? installmentColor : colors.main }]}>
                    {isExpense ? '-' : '+'}{formatCurrency(showInstallment ? (amountPaid || 0) : totalAmount)}
                </Text>
                <Text style={styles.date}>
                    {formatRelativeDate(date)}
                </Text>

                {/* Add Payment Button for Installments */}
                {showInstallment && onAddPayment && (
                    <TouchableOpacity
                        style={styles.addPaymentButton}
                        onPress={() => onAddPayment(transaction)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Feather name="plus-circle" size={20} color={installmentColor} />
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
};

export default TransactionCard;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: SPACING.md,
        ...SHADOWS.small,
    },
    // 1. Icon Styles
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.md,
    },
    // 2. Content Styles
    content: {
        flex: 1,
        justifyContent: 'center',
        marginRight: SPACING.sm,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    productName: {
        fontSize: TYPOGRAPHY.size.base,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.text,
        lineHeight: 20,
    },
    customerName: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
        marginTop: 1,
    },
    // Installment styles
    installmentSection: {
        marginTop: SPACING.sm,
    },
    progressContainer: {
        marginBottom: 4,
    },
    progressBackground: {
        height: 6,
        backgroundColor: COLORS.border,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    installmentText: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.textSecondary,
        fontWeight: TYPOGRAPHY.weight.medium,
    },
    pendingText: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.textMuted,
        fontStyle: 'italic',
    },
    // 3. Right Content Styles
    rightContent: {
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
    },
    amount: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.bold,
        marginBottom: 2,
    },
    date: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.textMuted,
    },
    addPaymentButton: {
        marginTop: SPACING.sm,
        padding: 4,
    },
});
