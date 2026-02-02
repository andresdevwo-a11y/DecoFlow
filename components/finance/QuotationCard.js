import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/Theme';
import { parseLocalDate } from '../../utils/dateHelpers';

const QuotationCard = ({ quotation, onPress }) => {
    const {
        quotationNumber,
        customerName,
        productName,
        totalAmount,
        date,
        type,
        status
    } = quotation;

    const getIconInfo = () => {
        switch (type) {
            case 'sale': return { icon: 'shopping-cart', color: '#22C55E', bg: '#DCFCE7' };
            case 'rental': return { icon: 'package', color: '#3B82F6', bg: '#DBEAFE' };
            case 'decoration': return { icon: 'gift', color: '#F97316', bg: '#FFEDD5' };
            default: return { icon: 'file-text', color: '#6B7280', bg: '#F3F4F6' };
        }
    };

    const getTypeLabel = () => {
        switch (type) {
            case 'sale': return 'Venta';
            case 'rental': return 'Alquiler';
            case 'decoration': return 'Decoración';
            default: return 'Cotización';
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

const formatDate = (dateString) => {
        if (!dateString) return '';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        const date = parseLocalDate(dateString);
        return date.toLocaleDateString('es-ES', options);
    };

    const iconInfo = getIconInfo();

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => onPress && onPress(quotation)}
            activeOpacity={0.7}
        >
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: iconInfo.bg }]}>
                    <Feather name={iconInfo.icon} size={18} color={iconInfo.color} />
                </View>
                <View style={styles.typeTag}>
                    <Text style={[styles.typeText, { color: iconInfo.color }]}>
                        {getTypeLabel()}
                    </Text>
                </View>
                {status === 'converted' && (
                    <View style={styles.convertedTag}>
                        <Feather name="check-circle" size={12} color={COLORS.primary} style={{ marginRight: 4 }} />
                        <Text style={styles.convertedText}>Convertida</Text>
                    </View>
                )}
            </View>

            <View style={styles.content}>
                <View style={styles.mainInfo}>
                    <Text style={styles.productName} numberOfLines={1}>
                        {productName}
                    </Text>
                    <Text style={styles.amount}>
                        {formatCurrency(totalAmount)}
                    </Text>
                </View>

                <View style={styles.subInfo}>
                    <View style={styles.customerContainer}>
                        <Feather name="user" size={14} color={COLORS.textMuted} style={{ marginRight: 4 }} />
                        <Text style={styles.customerName} numberOfLines={1}>
                            {customerName || 'Cliente General'}
                        </Text>
                    </View>
                    <Text style={styles.dateText}>
                        {formatDate(date)}
                    </Text>
                </View>

                {quotationNumber && (
                    <Text style={styles.quotationNumber}>
                        #{quotationNumber}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
        // Shadow for iOS/Android
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.sm,
    },
    typeTag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        backgroundColor: COLORS.background,
        borderRadius: 4,
        marginRight: 'auto', // Pushes subsequent items to the right
    },
    typeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    convertedTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '15', // Low opacity primary
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    convertedText: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.primary,
    },
    content: {
        gap: 4
    },
    mainInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    productName: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.text,
        flex: 1,
        marginRight: SPACING.sm,
    },
    amount: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
    },
    subInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 2,
    },
    customerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    customerName: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textMuted,
        marginRight: SPACING.sm,
    },
    dateText: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.textSecondary,
    },
    quotationNumber: {
        fontSize: 10,
        color: COLORS.textMuted,
        marginTop: 4,
        alignSelf: 'flex-end',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    }
});

export default QuotationCard;
