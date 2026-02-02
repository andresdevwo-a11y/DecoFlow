import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SIZES } from '../constants/Theme';

/**
 * Reusable search header component for list screens.
 * Displays a title and optional search input.
 */
const SearchHeader = React.memo(({ title, placeholder, searchText, onSearchChange, showSearch = true }) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {showSearch && (
                <View style={[
                    styles.searchContainer,
                    isFocused && styles.searchContainerFocused
                ]}>
                    <Feather
                        name="search"
                        size={SIZES.iconSm}
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
        fontSize: TYPOGRAPHY.size['4xl'],
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        marginBottom: SPACING.lg,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: SPACING.md,
        height: SIZES.inputHeight,
    },
    searchContainerFocused: {
        borderColor: COLORS.primary,
    },
    searchIcon: {
        marginRight: SPACING.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: TYPOGRAPHY.size.xl,
        color: COLORS.text,
        height: '100%',
    },
});

export default SearchHeader;
