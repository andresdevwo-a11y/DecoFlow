import React from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Theme from '../../constants/Theme';
import Text from './Text';

const ScreenHeader = ({
    title,
    subtitle,
    showBack = true,
    rightAction,
    onBack,
    style
}) => {
    const navigation = useNavigation();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigation.goBack();
        }
    };

    return (
        <View style={[styles.container, style]}>
            <View style={styles.content}>
                {/* Left Section (Back Button) */}
                <View style={styles.leftContainer}>
                    {showBack && (
                        <TouchableOpacity
                            onPress={handleBack}
                            style={styles.backButton}
                            activeOpacity={0.7}
                        >
                            <Feather name="arrow-left" size={24} color={Theme.COLORS.text} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Center Section (Title) */}
                <View style={styles.titleContainer}>
                    <Text preset="h4" centered numberOfLines={1}>
                        {title}
                    </Text>
                    {subtitle && (
                        <Text preset="caption" color="textSecondary" centered numberOfLines={1}>
                            {subtitle}
                        </Text>
                    )}
                </View>

                {/* Right Section (Action) */}
                <View style={styles.rightContainer}>
                    {rightAction}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Theme.COLORS.background,
        borderBottomWidth: 1,
        borderBottomColor: Theme.COLORS.borderSubtle,
        zIndex: 10,
        // Padding top for logic: on iOS SafeAreaView usually handles this, 
        // but if we are not inside one, we might need manual padding.
        // For now, assuming standard layout.
        height: Theme.SIZES.headerHeight,
        marginBottom: Theme.SPACING.md,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Theme.SPACING.lg,
    },
    leftContainer: {
        width: 48,
        alignItems: 'flex-start',
    },
    rightContainer: {
        width: 48,
        alignItems: 'flex-end',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButton: {
        padding: Theme.SPACING.xs,
        marginLeft: -Theme.SPACING.xs, // Negative margin to align icon visually
    }
});

export default ScreenHeader;
