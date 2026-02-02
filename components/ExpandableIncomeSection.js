import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/Theme';



const ExpandableIncomeSection = ({
    icon,
    iconColor,
    label,
    count,
    total,
    transactions = [],
    formatCurrency
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
    };

    return (
        <View style={styles.container}>
            {/* Header row - clickable */}
            <TouchableOpacity onPress={toggleExpand} style={styles.headerRow} activeOpacity={0.7}>
                <View style={styles.headerLeft}>
                    <Feather name={icon} size={16} color={iconColor} />
                    <Text style={styles.headerLabel}>
                        {label} ({count})
                    </Text>
                    <Feather
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={COLORS.textMuted}
                    />
                </View>
                <Text style={[styles.headerValue, { color: iconColor }]}>
                    {formatCurrency(total)}
                </Text>
            </TouchableOpacity>

            {/* Expanded product list */}
            {isExpanded && transactions.length > 0 && (
                <View style={styles.itemsList}>
                    {transactions.map((item, index) => (
                        <View
                            key={item.id || index}
                            style={[
                                styles.itemRow,
                                index === transactions.length - 1 && styles.lastItemRow
                            ]}
                        >
                            <View style={styles.itemLeft}>
                                <View style={styles.bulletPoint} />
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName} numberOfLines={1}>
                                        {item.productName}
                                    </Text>
                                    {item.quantity > 1 && (
                                        <Text style={styles.itemQuantity}>
                                            x{item.quantity} @ {formatCurrency(item.unitPrice)}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            <Text style={styles.itemPrice}>
                                {formatCurrency(item.totalAmount)}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Empty state when expanded */}
            {isExpanded && transactions.length === 0 && (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Sin registros en este período</Text>
                </View>
            )}
        </View>
    );
};

export default ExpandableIncomeSection;

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.xs,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    headerLabel: {
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.text,
    },
    headerValue: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.semibold,
    },
    itemsList: {
        marginLeft: SPACING.lg,
        paddingLeft: SPACING.sm,
        borderLeftWidth: 1,
        borderLeftColor: COLORS.border,
        marginTop: SPACING.xs,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    lastItemRow: {
        borderBottomWidth: 0,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: SPACING.sm,
    },
    bulletPoint: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.textMuted,
        marginRight: SPACING.sm,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.text,
    },
    itemQuantity: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    itemPrice: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.textSecondary,
    },
    emptyState: {
        marginLeft: SPACING.lg + SPACING.sm,
        paddingVertical: SPACING.md,
    },
    emptyText: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textMuted,
        fontStyle: 'italic',
    },
});
