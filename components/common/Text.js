import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import Theme from '../../constants/Theme';

/**
 * Unified Text Component
 * 
 * Usage:
 * <Text preset="h1">Big Title</Text>
 * <Text preset="bodyMedium" color="textSecondary">Description</Text>
 * <Text preset="label" weight="bold">Label</Text>
 */
const Text = ({
    children,
    preset = 'bodyMedium',
    color,
    weight,
    centered,
    style,
    numberOfLines,
    ...props
}) => {

    // Get text style from preset
    const presetStyle = Theme.TYPOGRAPHY.presets[preset] || Theme.TYPOGRAPHY.presets.bodyMedium;

    // Resolve font family based on weight or preset weight
    const fontWeight = weight || presetStyle.fontWeight || '400';
    let fontFamily = Theme.TYPOGRAPHY.fontFamily.regular;

    if (fontWeight === '500' || fontWeight === '600') {
        fontFamily = Theme.TYPOGRAPHY.fontFamily.medium;
    } else if (fontWeight === '700' || fontWeight === 'bold') {
        fontFamily = Theme.TYPOGRAPHY.fontFamily.bold;
    }

    // Resolve color
    const textColor = color ? (Theme.COLORS[color] || color) : Theme.COLORS.text;

    const textStyles = [
        presetStyle,
        {
            color: textColor,
            fontFamily,
            textAlign: centered ? 'center' : 'auto',
        },
        style
    ];

    return (
        <RNText
            style={textStyles}
            numberOfLines={numberOfLines}
            {...props}
        >
            {children}
        </RNText>
    );
};

export default Text;
