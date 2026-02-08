import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Theme from '../../constants/Theme';
import Text from './Text';

const Input = ({
    label,
    error,
    placeholder,
    value,
    onChangeText,
    secureTextEntry,
    keyboardType,
    autoCapitalize,
    leftIcon,
    rightIcon,
    multiline,
    numberOfLines,
    style,
    disabled = false,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);

    const getBorderColor = () => {
        if (error) return Theme.COLORS.error;
        if (isFocused) return Theme.COLORS.primary;
        return Theme.COLORS.border;
    };

    // Background color logic: Subtle when focused or filled
    const getBackgroundColor = () => {
        if (disabled) return Theme.COLORS.secondary50;
        return Theme.COLORS.surface;
    };

    return (
        <View style={[styles.container, style]}>
            {label && (
                <Text preset="label" color="textSecondary" style={styles.label}>
                    {label}
                </Text>
            )}

            <View style={[
                styles.inputContainer,
                {
                    borderColor: getBorderColor(),
                    backgroundColor: getBackgroundColor(),
                    height: multiline ? 'auto' : Theme.SIZES.inputHeight,
                    minHeight: multiline ? 80 : undefined,
                    paddingVertical: multiline ? Theme.SPACING.md : 0,
                }
            ]}>
                {leftIcon && (
                    <View style={styles.leftIcon}>
                        {leftIcon}
                    </View>
                )}

                <TextInput
                    style={[
                        styles.input,
                        multiline && styles.multilineInput,
                        disabled && styles.disabledInput
                    ]}
                    placeholder={placeholder}
                    placeholderTextColor={Theme.COLORS.textTertiary}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    editable={!disabled}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                    textAlignVertical={multiline ? 'top' : 'center'}
                    {...props}
                />

                {rightIcon && (
                    <View style={styles.rightIcon}>
                        {rightIcon}
                    </View>
                )}
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
    label: {
        marginBottom: Theme.SPACING.xs,
        marginLeft: Theme.SPACING.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: Theme.RADIUS.lg,
        paddingHorizontal: Theme.SPACING.md,
    },
    input: {
        flex: 1,
        fontFamily: Theme.TYPOGRAPHY.fontFamily.regular,
        fontSize: Theme.TYPOGRAPHY.presets.bodyMedium.fontSize,
        color: Theme.COLORS.text,
        height: '100%',
    },
    multilineInput: {
        height: null,
    },
    disabledInput: {
        color: Theme.COLORS.textTertiary,
    },
    leftIcon: {
        marginRight: Theme.SPACING.sm,
    },
    rightIcon: {
        marginLeft: Theme.SPACING.sm,
    },
    errorText: {
        marginTop: Theme.SPACING.xs,
        marginLeft: Theme.SPACING.xs,
    }
});

export default Input;
