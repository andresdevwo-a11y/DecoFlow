import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY, SIZES } from '../constants/Theme';

const SelectionActionBar = ({ selectedCount, onClear, onDelete, onMove }) => {
    if (selectedCount === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.leftSection}>
                <TouchableOpacity onPress={onClear} style={styles.closeButton}>
                    <Feather name="x" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.countText}>{selectedCount} seleccionados</Text>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
                    <Feather name="trash-2" size={24} color={COLORS.error} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: SIZES.navBarHeight - 65,
        left: SPACING.lg,
        right: SPACING.lg,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.full,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        // Shadow matches FAB/floating elements
        shadowColor: COLORS.text, // Subtle dark shadow
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 100,
        borderWidth: 1,
        borderColor: COLORS.border,
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
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.text,
    },
    actions: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    actionButton: {
        padding: SPACING.xs,
    }
});

export default SelectionActionBar;
