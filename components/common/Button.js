import React from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet, View } from 'react-native';
import Theme from '../../constants/Theme';
import Text from './Text';

const Button = ({
    text,
    onPress,
    variant = 'primary', // primary, secondary, danger, ghost, outline
    size = 'md', // sm, md, lg
    loading = false,
    disabled = false,
    icon,
    style,
    ...props
}) => {

    // Determine styles based on variant and size
    const getContainerStyle = () => {
        const baseStyle = [styles.base];

        // Variant styles
        switch (variant) {
            case 'primary':
                baseStyle.push(styles.primary);
                if (disabled) baseStyle.push(styles.primaryDisabled);
                break;
            case 'secondary':
                baseStyle.push(styles.secondary);
                break;
            case 'danger':
                baseStyle.push(styles.danger);
                break;
            case 'ghost':
                baseStyle.push(styles.ghost);
                break;
            case 'outline':
                baseStyle.push(styles.outline);
                break;
        }

        // Size styles
        switch (size) {
            case 'sm':
                baseStyle.push(styles.sizeSm);
                break;
            case 'lg':
                baseStyle.push(styles.sizeLg);
                break;
            default:
                baseStyle.push(styles.sizeMd);
        }

        return baseStyle;
    };

    const getTextColor = () => {
        if (disabled && variant === 'primary') return Theme.COLORS.surface;
        if (disabled) return Theme.COLORS.textTertiary;

        switch (variant) {
            case 'primary':
            case 'danger':
                return Theme.COLORS.surface;
            case 'secondary':
                return Theme.COLORS.primary;
            case 'outline':
                return Theme.COLORS.textSecondary;
            case 'ghost':
                return Theme.COLORS.primary;
            default:
                return Theme.COLORS.surface;
        }
    };

    // Determine Text Preset
    const getTextPreset = () => {
        if (size === 'sm') return 'label';
        return 'bodyMedium';
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
            style={[getContainerStyle(), style]}
            {...props}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={getTextColor()}
                />
            ) : (
                <View style={styles.contentContainer}>
                    {icon && <View style={styles.iconContainer}>{icon}</View>}
                    {text && (
                        <Text
                            preset={getTextPreset()}
                            color={getTextColor()}
                            weight="600"
                            style={{ color: getTextColor() }} // Force color override
                        >
                            {text}
                        </Text>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Theme.RADIUS.xl, // Pill shape often looks good
    },
    // Sizes
    sizeSm: {
        height: 36,
        paddingHorizontal: Theme.SPACING.md,
    },
    sizeMd: {
        height: 48,
        paddingHorizontal: Theme.SPACING.xl,
    },
    sizeLg: {
        height: 56,
        paddingHorizontal: Theme.SPACING['2xl'],
    },
    // Variants
    primary: {
        backgroundColor: Theme.COLORS.primary,
        ...Theme.SHADOWS.sm,
    },
    primaryDisabled: {
        backgroundColor: Theme.COLORS.primary300,
        ...Theme.SHADOWS.none,
    },
    secondary: {
        backgroundColor: Theme.COLORS.primary50,
    },
    danger: {
        backgroundColor: Theme.COLORS.error,
    },
    ghost: {
        backgroundColor: 'transparent',
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Theme.COLORS.border,
    },

    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        marginRight: Theme.SPACING.sm,
    }
});

export default Button;
