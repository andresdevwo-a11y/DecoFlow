import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../constants/Theme';

const QuickActionButton = ({ icon, label, color = COLORS.primary, onPress }) => {
    return (
        <TouchableOpacity
            style={[styles.container, { borderColor: color }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                <Feather name={icon} size={24} color={color} />
            </View>
            <Text style={[styles.label, { color }]}>{label}</Text>
        </TouchableOpacity>
    );
};

export default QuickActionButton;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: SPACING.md,
        marginHorizontal: SPACING.xs,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        ...SHADOWS.small,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
    },
    label: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: TYPOGRAPHY.weight.semibold,
        textAlign: 'center',
    },
});
