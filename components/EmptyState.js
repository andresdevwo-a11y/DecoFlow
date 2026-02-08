import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Theme from '../constants/Theme';
import Text from './common/Text';
import Button from './common/Button';
import { Feather } from '@expo/vector-icons';

const EmptyState = ({
    title,
    description,
    icon,
    image,
    actionLabel,
    onAction,
    style
}) => {
    return (
        <View style={[styles.container, style]}>
            <View style={styles.iconContainer}>
                {image ? (
                    <Image source={image} style={styles.image} resizeMode="contain" />
                ) : (
                    <Feather
                        name={icon || 'inbox'}
                        size={48}
                        color={Theme.COLORS.primary}
                    />
                )}
            </View>

            <Text preset="h3" centered style={styles.title}>
                {title || 'No Data'}
            </Text>

            {description && (
                <Text preset="bodyMedium" color="textSecondary" centered style={styles.description}>
                    {description}
                </Text>
            )}

            {actionLabel && onAction && (
                <Button
                    text={actionLabel}
                    onPress={onAction}
                    variant="primary"
                    style={styles.button}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: Theme.SPACING.xl,
        flex: 1,
        minHeight: 300,
    },
    iconContainer: {
        marginBottom: Theme.SPACING.lg,
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Theme.COLORS.primary50,
        borderRadius: Theme.RADIUS.full,
    },
    image: {
        width: '80%',
        height: '80%',
    },
    title: {
        marginBottom: Theme.SPACING.sm,
    },
    description: {
        marginBottom: Theme.SPACING.xl,
        maxWidth: 280,
    },
    button: {
        minWidth: 160,
    }
});

export default EmptyState;
