import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/Theme';

const EmptyState = ({ icon = "inbox", title, description, style }) => {
    return (
        <View style={[styles.container, style]}>
            <View style={styles.iconContainer}>
                <Feather name={icon} size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>{title}</Text>
            {description && (
                <Text style={styles.description}>{description}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
        flex: 1,
        minHeight: 300, // Ensure it takes some vertical space
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.primary + '10', // Consistent with NotesScreen
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
    },
    title: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        marginBottom: SPACING.xs,
        textAlign: 'center',
    },
    description: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textMuted,
        textAlign: 'center',
        maxWidth: 250,
    },
});

export default EmptyState;
