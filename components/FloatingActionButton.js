import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, RADIUS } from '../constants/Theme';

const FAB_SIZE = 56;

const FloatingActionButton = ({ label, onPress, style }) => {
    return (
        <View style={[styles.container, style]} pointerEvents="box-none">
            <TouchableOpacity
                style={styles.fabRow}
                onPress={onPress}
                activeOpacity={0.8}
            >
                {/* Label Container */}
                <View style={styles.labelContainer}>
                    <Text style={styles.label}>{label}</Text>
                </View>

                {/* FAB Button */}
                <View style={styles.fab}>
                    <Feather name="plus" size={28} color="#FFF" />
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: SPACING.xl,
        right: SPACING.lg,
        zIndex: 100,
    },
    fabRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fab: {
        width: FAB_SIZE,
        height: FAB_SIZE,
        borderRadius: FAB_SIZE / 2,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.fab,
    },
    labelContainer: {
        marginRight: SPACING.md,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: SPACING.md,
        paddingVertical: 8,
        borderRadius: RADIUS.md,
        ...SHADOWS.small,
    },
    label: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.text,
    },
});

export default FloatingActionButton;
