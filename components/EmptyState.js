import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/Theme';

const EmptyState = ({ icon = "inbox", title, description, style }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Fade in animation on mount
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <Animated.View style={[styles.container, style, { opacity: fadeAnim }]}>
            <View style={styles.iconContainer}>
                <Feather name={icon} size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>{title}</Text>
            {description && (
                <Text style={styles.description}>{description}</Text>
            )}
        </Animated.View>
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
