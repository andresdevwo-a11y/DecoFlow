import React from 'react';
import { View, StyleSheet } from 'react-native';
import Theme from '../../constants/Theme';
import Text from './Text';

const FormField = ({
    label,
    error,
    required,
    children,
    style
}) => {
    return (
        <View style={[styles.container, style]}>
            {label && (
                <View style={styles.labelContainer}>
                    <Text preset="label" color="textSecondary">
                        {label}
                    </Text>
                    {required && (
                        <Text preset="label" color="error" style={styles.requiredMark}> *</Text>
                    )}
                </View>
            )}

            <View style={styles.inputWrapper}>
                {children}
            </View>

            {error && (
                <Text preset="caption" color="error" style={styles.errorText}>
                    {error}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: Theme.SPACING.lg,
    },
    labelContainer: {
        flexDirection: 'row',
        marginBottom: Theme.SPACING.xs,
        marginLeft: Theme.SPACING.xs,
    },
    requiredMark: {
        marginLeft: 2,
    },
    inputWrapper: {
        // Wrapper for the actual input component
    },
    errorText: {
        marginTop: Theme.SPACING.xs,
        marginLeft: Theme.SPACING.xs,
    }
});

export default FormField;
