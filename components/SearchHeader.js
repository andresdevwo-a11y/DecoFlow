import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SIZES, SHADOWS } from '../constants/Theme';

/**
 * Reusable search header component for list screens.
 * Displays a title and optional search input.
 */
const SearchHeader = React.memo(({ title, placeholder, searchText, onSearchChange, showSearch = true }) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={styles.header}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {showSearch && (
                <View style={[
                    styles.searchContainer,
                    isFocused && styles.searchContainerFocused
                ]}>
                    <Feather
                        name="search"
                        size={20}
                        color={isFocused ? COLORS.primary : COLORS.placeholder}
                        style={styles.searchIcon}
                    />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={placeholder || "Buscar..."}
                        placeholderTextColor={COLORS.placeholder}
                        value={searchText}
                        onChangeText={onSearchChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        selectionColor={COLORS.primary}
                    />
                </View>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    header: {
        marginBottom: SPACING.xl,
    },
    title: {
        fontSize: TYPOGRAPHY.size['4xl'], // 24px
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: SPACING.lg,
        letterSpacing: -0.5,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface, // Use surface color
        borderRadius: RADIUS.full, // Pill shape
        borderWidth: 0, // Remove border
        paddingHorizontal: SPACING.lg,
        height: 52, // Slightly thicker for easier tap
        ...SHADOWS.card, // Soft shadow
        shadowOpacity: 0.05,
        elevation: 2,
    },
    searchContainerFocused: {
        backgroundColor: '#FFFFFF', // Clean white on focus
        shadowOpacity: 0.1,
        elevation: 4,
        // borderColor: COLORS.primary,
        // borderWidth: 1, // Optional: if we want border on focus
    },
    searchIcon: {
        marginRight: SPACING.md,
    },
    searchInput: {
        flex: 1,
        fontSize: TYPOGRAPHY.size.lg,
        color: COLORS.text,
        height: '100%',
        fontWeight: '500',
    },
});

export default SearchHeader;
