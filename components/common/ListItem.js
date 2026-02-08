import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Theme from '../../constants/Theme';
import Text from './Text';
import Card from './Card';
import { Feather } from '@expo/vector-icons';

const ListItem = ({
    title,
    subtitle,
    leftIcon,
    rightIcon,
    rightElement,
    onPress,
    style,
    variant = 'default', // default (flat), card (elevated)
    showChevron = false,
    height = 'auto',
    disabled = false,
}) => {

    // Choose container based on variant
    const Container = variant === 'card' ? Card : View;
    const containerStyle = variant === 'card' ? styles.cardContainer : styles.flatContainer;
    const TouchComponent = onPress ? TouchableOpacity : View;

    return (
        <TouchComponent
            onPress={onPress}
            activeOpacity={0.7}
            disabled={disabled}
        >
            <Container style={[styles.base, containerStyle, { height }, style]}>

                {/* Left Icon */}
                {leftIcon && (
                    <View style={styles.leftIconContainer}>
                        {leftIcon}
                    </View>
                )}

                {/* Text Content */}
                <View style={styles.textContainer}>
                    <Text preset="bodyMedium" weight="600" numberOfLines={1}>
                        {title}
                    </Text>
                    {subtitle && (
                        <Text preset="caption" color="textSecondary" numberOfLines={1} style={{ marginTop: 2 }}>
                            {subtitle}
                        </Text>
                    )}
                </View>

                {/* Right Side */}
                <View style={styles.rightContainer}>
                    {rightElement}
                    {rightIcon}
                    {showChevron && !rightIcon && (
                        <Feather name="chevron-right" size={20} color={Theme.COLORS.textTertiary} />
                    )}
                </View>

            </Container>
        </TouchComponent>
    );
};

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Theme.SPACING.md,
        paddingHorizontal: Theme.SPACING.md,
    },
    flatContainer: {
        borderBottomWidth: 1,
        borderBottomColor: Theme.COLORS.borderSubtle,
        backgroundColor: Theme.COLORS.surface,
    },
    cardContainer: {
        marginBottom: Theme.SPACING.sm,
        padding: Theme.SPACING.md,
        // Card styles handled by Card component
    },
    leftIconContainer: {
        marginRight: Theme.SPACING.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: Theme.SPACING.sm,
    }
});

export default ListItem;
