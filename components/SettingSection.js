import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/Theme';

/**
 * A section container for grouping related settings with a title header.
 */
export default function SettingSection({ title, children }) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING['2xl'],
    },
    title: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: SPACING.sm,
        paddingHorizontal: SPACING.xs,
    },
    content: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.md,
        overflow: 'hidden',
        ...SHADOWS.card,
    },
});
