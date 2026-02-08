import React from 'react';
import { View, StyleSheet } from 'react-native';
import Theme from '../../constants/Theme';
import Text from './Text';

const Badge = ({
    text,
    variant = 'neutral', // neutral, success, warning, error, info, primary
    size = 'md', // sm, md
    style,
    textStyle
}) => {

    const getColors = () => {
        switch (variant) {
            case 'success':
                return { bg: Theme.COLORS.success + '20', text: Theme.COLORS.success };
            case 'warning':
                return { bg: Theme.COLORS.warning + '20', text: Theme.COLORS.warning };
            case 'error':
                return { bg: Theme.COLORS.error + '20', text: Theme.COLORS.error };
            case 'info':
                return { bg: Theme.COLORS.info + '20', text: Theme.COLORS.info };
            case 'primary':
                return { bg: Theme.COLORS.primary + '20', text: Theme.COLORS.primary };
            case 'neutral':
            default:
                return { bg: Theme.COLORS.secondary100, text: Theme.COLORS.textSecondary };
        }
    };

    const { bg, text: textColor } = getColors();

    const getSizeStyle = () => {
        if (size === 'sm') {
            return {
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
            };
        }
        // Default md
        return {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
        };
    };

    return (
        <View style={[
            styles.base,
            { backgroundColor: bg },
            getSizeStyle(),
            style
        ]}>
            <Text
                preset={size === 'sm' ? 'caption' : 'label'}
                weight="600"
                style={[{ color: textColor }, textStyle]}
            >
                {text}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    base: {
        alignSelf: 'flex-start',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default Badge;
