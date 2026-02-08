import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Theme from '../../constants/Theme';

const Card = ({
    children,
    variant = 'default', // default, elevated, outlined
    padding = 'lg', // xs, sm, md, lg, xl, none
    onPress,
    style,
    ...props
}) => {

    const Container = onPress ? TouchableOpacity : View;

    // Resolve padding
    const paddingValue = padding === 'none' ? 0 : (Theme.SPACING[padding] || Theme.SPACING.lg);

    const getVariantStyle = () => {
        switch (variant) {
            case 'elevated':
                return [styles.elevated, Theme.SHADOWS.sm];
            case 'outlined':
                return styles.outlined;
            case 'default':
            default:
                return styles.default;
        }
    };

    return (
        <Container
            activeOpacity={onPress ? 0.7 : 1}
            onPress={onPress}
            style={[
                styles.base,
                getVariantStyle(),
                { padding: paddingValue },
                style
            ]}
            {...props}
        >
            {children}
        </Container>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: Theme.RADIUS.xl,
        overflow: 'hidden',
    },
    default: {
        backgroundColor: Theme.COLORS.surface,
    },
    elevated: {
        backgroundColor: Theme.COLORS.surface,
    },
    outlined: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Theme.COLORS.border,
    }
});

export default Card;
