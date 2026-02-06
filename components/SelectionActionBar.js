import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY, SIZES } from '../constants/Theme';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

const SelectionActionBar = ({ selectedCount, onClear, onDelete, onMove }) => {
    if (selectedCount === 0) return null;

    return (
        <Animated.View
            style={styles.container}
            entering={FadeInDown.duration(300).springify()}
            exiting={FadeOutDown.duration(200)}
        >
            <View style={styles.leftSection}>
                <TouchableOpacity onPress={onClear} style={styles.closeButton}>
                    <Feather name="x" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.countText}>{selectedCount} seleccionados</Text>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
                    <Feather name="trash-2" size={24} color="#FF6B6B" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: SPACING.xl, // Match FAB position
        left: SPACING.lg,
        right: SPACING.lg,
        backgroundColor: COLORS.text, // Dark toast style
        borderRadius: RADIUS.full,
        paddingVertical: 10,
        paddingHorizontal: SPACING.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 100,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    closeButton: {
        padding: SPACING.xs,
        marginRight: SPACING.md,
    },
    countText: {
        fontSize: TYPOGRAPHY.size.base,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: '#FFFFFF', // White text
    },
    actions: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    actionButton: {
        padding: SPACING.xs,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: RADIUS.full,
    }
});

export default SelectionActionBar;
