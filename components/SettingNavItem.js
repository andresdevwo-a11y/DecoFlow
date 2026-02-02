import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SIZES } from '../constants/Theme';

/**
 * A navigation setting row with icon, label, optional value preview, and chevron.
 */
export default function SettingNavItem({
    icon,
    label,
    description,
    value,
    onPress,
    isDestructive = false,
    showChevron = true
}) {
    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.6}
        >
            <View style={[
                styles.iconContainer,
                isDestructive && styles.destructiveIconContainer
            ]}>
                <Feather
                    name={icon}
                    size={SIZES.iconMd}
                    color={isDestructive ? COLORS.error : COLORS.primary}
                />
            </View>
            <View style={styles.textContainer}>
                <Text style={[
                    styles.label,
                    isDestructive && styles.destructiveLabel
                ]}>
                    {label}
                </Text>
                {description && (
                    <Text style={styles.description}>{description}</Text>
                )}
            </View>
            {value && (
                <Text style={styles.value}>{value}</Text>
            )}
            {showChevron && (
                <Feather
                    name="chevron-right"
                    size={SIZES.iconSm}
                    color={isDestructive ? COLORS.error : COLORS.placeholder}
                />
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.lg - 2,
        paddingHorizontal: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.background,
    },
    iconContainer: {
        width: SIZES.iconContainerSm,
        height: SIZES.iconContainerSm,
        borderRadius: RADIUS.sm,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    destructiveIconContainer: {
        backgroundColor: COLORS.errorLight,
    },
    textContainer: {
        flex: 1,
        marginRight: SPACING.sm,
    },
    label: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.text,
    },
    destructiveLabel: {
        color: COLORS.error,
    },
    description: {
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    value: {
        fontSize: TYPOGRAPHY.size.base,
        color: COLORS.placeholder,
        marginRight: SPACING.sm,
    },
});
