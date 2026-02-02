import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SIZES } from '../constants/Theme';

/**
 * A toggle setting row with icon, label, optional description, and switch.
 */
export default function SettingToggle({
    icon,
    label,
    description,
    value,
    onValueChange,
    disabled = false
}) {
    return (
        <View style={[styles.container, disabled && styles.disabled]}>
            <View style={styles.iconContainer}>
                <Feather name={icon} size={SIZES.iconMd} color={COLORS.primary} />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.label}>{label}</Text>
                {description && (
                    <Text style={styles.description}>{description}</Text>
                )}
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                disabled={disabled}
                trackColor={{ false: COLORS.border, true: COLORS.primaryDisabled }}
                thumbColor={value ? COLORS.primary : COLORS.surface}
                ios_backgroundColor={COLORS.border}
            />
        </View>
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
    disabled: {
        opacity: 0.5,
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
    textContainer: {
        flex: 1,
        marginRight: SPACING.md,
    },
    label: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.text,
    },
    description: {
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.textMuted,
        marginTop: 2,
    },
});
