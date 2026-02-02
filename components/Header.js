import React from 'react';
import { View, Text, StyleSheet, Platform, StatusBar, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SIZES } from '../constants/Theme';

const Header = ({ title = "Woodland Studio", onBack }) => {
    return (
        <View style={styles.container}>
            <View style={styles.contentContainer}>
                {onBack && (
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <Feather name="arrow-left" size={SIZES.iconLg} color={COLORS.primary} />
                    </TouchableOpacity>
                )}
                <Text style={styles.logoText}>{title}</Text>
                {onBack && <View style={styles.rightSpacer} />}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        width: '100%',
    },
    contentContainer: {
        height: SIZES.headerHeight,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        paddingHorizontal: SPACING.lg,
    },
    backButton: {
        position: 'absolute',
        left: SPACING.lg,
        bottom: (SIZES.headerHeight - SIZES.iconLg) / 2,
        zIndex: 10,
    },
    logoText: {
        color: COLORS.text,
        fontSize: TYPOGRAPHY.size['3xl'],
        fontWeight: '700',
        letterSpacing: TYPOGRAPHY.letterSpacing.wide,
    },
    rightSpacer: {
        width: SIZES.iconLg,
    }
});

export default Header;
