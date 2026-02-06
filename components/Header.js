import React from 'react';
import { View, Text, StyleSheet, Platform, StatusBar, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SIZES, SHADOWS } from '../constants/Theme';

const Header = ({ title, onBack }) => {
    // Default title if none provided
    const displayTitle = title || "DecoFlow Studio";

    // Fixed width for side elements to ensure perfect centering
    const SIDE_WIDTH = 60;

    return (
        <View style={styles.container}>
            <View style={styles.contentContainer}>
                {/* Left Section (Back Button or Spacer) */}
                <View style={[styles.sideContainer, { alignItems: 'flex-start' }]}>
                    {onBack && (
                        <TouchableOpacity onPress={onBack} style={styles.backButton}>
                            <View style={styles.backButtonCircle}>
                                <Feather name="arrow-left" size={20} color={COLORS.text} />
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Center Section (Title) */}
                <View style={styles.titleContainer}>
                    <Text style={styles.titleText} numberOfLines={1}>
                        {displayTitle}
                    </Text>
                </View>

                {/* Right Section (Spacer - Must be same width as Left) */}
                <View style={[styles.sideContainer, { alignItems: 'flex-end' }]}>
                    {/* Add right-side actions here if needed later */}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.surface,
        width: '100%',
        ...SHADOWS.navBar,
        zIndex: 100,
    },
    contentContainer: {
        height: SIZES.headerHeight,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        paddingHorizontal: SPACING.lg,
    },
    sideContainer: {
        width: 50, // Fixed width for perfect balance
        justifyContent: 'center',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING.xs,
    },
    backButton: {
        justifyContent: 'center',
    },
    backButtonCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.background, // Subtle contrast
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleText: {
        color: COLORS.text,
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.3,
        textAlign: 'center',
    },
});

export default Header;
