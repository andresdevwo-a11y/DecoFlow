import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, SIZES, RADIUS } from '../constants/Theme';

const FloatingActionButton = ({ label, onPress, style }) => {
    return (
        <View style={[
            styles.container,
            style,
            { bottom: SPACING.xl } // Elevated for better spacing above nav bar
        ]} pointerEvents="box-none">
            <TouchableOpacity
                style={styles.button}
                onPress={onPress}
                activeOpacity={0.8}
            >
                <Text style={styles.label}>{label}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        // bottom: moved to inline style
        left: SPACING.lg,
        right: SPACING.lg,
        zIndex: 100,
    },
    button: {
        backgroundColor: COLORS.primary, // Orange #F97316
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xl,
        borderRadius: RADIUS.lg, // Pill-shaped rounded corners
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        color: COLORS.surface,
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.medium,
    }
});

export default FloatingActionButton;
