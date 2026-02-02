import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, SIZES, SHADOWS } from '../constants/Theme';

const BottomNavBar = React.memo(({ currentTab, onTabChange }) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { height: SIZES.navBarHeight + insets.bottom, paddingBottom: insets.bottom }]}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
            >


                {/* Left Section (Home/Inventario) */}
                <View style={styles.tabSection}>
                    <TouchableOpacity
                        style={styles.tabButton}
                        onPress={() => onTabChange('home')}
                        activeOpacity={0.7}
                    >
                        <Feather
                            name="box"
                            size={SIZES.iconLg}
                            color={currentTab === 'home' ? COLORS.primary : COLORS.textMuted}
                        />
                        <Text style={[styles.tabText, currentTab === 'home' && styles.activeTabText]}>
                            Inventario
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Finances Section */}
                <View style={styles.tabSection}>
                    <TouchableOpacity
                        style={styles.tabButton}
                        onPress={() => onTabChange('finances')}
                        activeOpacity={0.7}
                    >
                        <Feather
                            name="dollar-sign"
                            size={SIZES.iconLg}
                            color={currentTab === 'finances' ? COLORS.primary : COLORS.textMuted}
                        />
                        <Text style={[styles.tabText, currentTab === 'finances' && styles.activeTabText]}>
                            Finanzas
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Notes Section */}
                <View style={styles.tabSection}>
                    <TouchableOpacity
                        style={styles.tabButton}
                        onPress={() => onTabChange('notes')}
                        activeOpacity={0.7}
                    >
                        <Feather
                            name="file-text"
                            size={SIZES.iconLg}
                            color={currentTab === 'notes' ? COLORS.primary : COLORS.textMuted}
                        />
                        <Text style={[styles.tabText, currentTab === 'notes' && styles.activeTabText]}>
                            Notas
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Left Section 2 (Files) */}
                <View style={styles.tabSection}>
                    <TouchableOpacity
                        style={styles.tabButton}
                        onPress={() => onTabChange('files')}
                        activeOpacity={0.7}
                    >
                        <Feather
                            name="grid"
                            size={SIZES.iconLg}
                            color={currentTab === 'files' ? COLORS.primary : COLORS.textMuted}
                        />
                        <Text style={[styles.tabText, currentTab === 'files' && styles.activeTabText]}>
                            Lienzos
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Right Section 2 (Mesa) */}
                <View style={styles.tabSection}>
                    <TouchableOpacity
                        style={styles.tabButton}
                        onPress={() => onTabChange('workspace')}
                        activeOpacity={0.7}
                    >
                        <Feather
                            name="layout"
                            size={SIZES.iconLg}
                            color={currentTab === 'workspace' ? COLORS.primary : COLORS.textMuted}
                        />
                        <Text style={[styles.tabText, currentTab === 'workspace' && styles.activeTabText]}>
                            Mesa
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Right Section (Settings) */}
                <View style={styles.tabSection}>
                    <TouchableOpacity
                        style={styles.tabButton}
                        onPress={() => onTabChange('settings')}
                        activeOpacity={0.7}
                    >
                        <Feather
                            name="settings"
                            size={SIZES.iconLg}
                            color={currentTab === 'settings' ? COLORS.primary : COLORS.textMuted}
                        />
                        <Text style={[styles.tabText, currentTab === 'settings' && styles.activeTabText]}>
                            Ajustes
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
});

export default BottomNavBar;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        ...SHADOWS.navBar,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'space-evenly', // Distribute items evenly when they fit
    },
    tabSection: {
        // width: 80, // Removed fixed width
        minWidth: SIZES.minTabWidth, // Ensure minimum touch target size
        paddingHorizontal: SPACING.xs, // Add padding for flexibility
        justifyContent: 'center',
        alignItems: 'center',
    },

    tabButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SIZES.buttonPaddingVertical,
        width: '100%',
    },
    tabText: {
        fontSize: TYPOGRAPHY.size.xs,
        marginTop: SPACING.xs,
        color: COLORS.textMuted,
        fontWeight: TYPOGRAPHY.weight.medium,
    },
    activeTabText: {
        color: COLORS.primary,
    },
});
