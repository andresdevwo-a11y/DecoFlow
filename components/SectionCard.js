import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, SIZES } from '../constants/Theme';

const SectionCard = React.memo(({ section, onPress, onOptionsPress, viewMode = 'Grid', isSelected, selectionMode, onLongPress }) => {
    const isList = viewMode === 'Lista';

    return (
        <TouchableOpacity
            style={[
                styles.card,
                isList && styles.cardList,
                isSelected && styles.cardSelected // Visual feedback
            ]}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
        >
            {/* Selection Checkbox/Indicator */}
            {selectionMode && (
                <View style={[styles.selectionIndicator, isSelected && styles.selectionIndicatorActive]}>
                    {isSelected && <Feather name="check" size={12} color="#FFFFFF" />}
                </View>
            )}

            {/* Content Container */}
            <View style={[styles.innerContainer, isList && styles.innerContainerList]}>

                {/* Icon/Image Section */}
                <View style={[styles.iconContainer, isList && styles.iconContainerList]}>
                    {section.image ? (
                        <Image source={{ uri: section.image }} style={styles.sectionImage} />
                    ) : (
                        <View style={[styles.iconPlaceholder, isList && styles.iconPlaceholderList]}>
                            <Feather
                                name={section.icon || 'folder'}
                                size={isList ? 24 : 32} // Larger icon
                                color={COLORS.primary}
                            />
                        </View>
                    )}
                </View>

                {/* Text Content */}
                <View style={[styles.textContainer, isList && styles.textContainerList]} >
                    <View style={!isList && styles.centeredContent}>
                        <Text style={[styles.sectionName, isList && styles.sectionNameList]} numberOfLines={1}>
                            {section.name}
                        </Text>
                        <View style={styles.badgeContainer}>
                            <Text style={styles.itemCount}>
                                {section.productCount || 0} items
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Options Button */}
                {!selectionMode && (
                    <TouchableOpacity
                        style={[styles.moreButton, isList && styles.moreButtonList]}
                        onPress={onOptionsPress}
                    >
                        <Feather name={isList ? "more-vertical" : "more-horizontal"} size={20} color={COLORS.placeholder} />
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
});

export default SectionCard;

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl, // 24px
        marginBottom: SPACING.lg,
        width: '48%',
        borderWidth: 1.5, // Match ProductCard
        borderColor: 'transparent', // Match ProductCard (hidden by default)
        // Shadows matching ProductCard
        ...SHADOWS.card,
        elevation: 2,
        shadowOpacity: 0.06,
        shadowRadius: 10,

        minHeight: 180,
        overflow: 'hidden',
        padding: 0,
    },
    cardList: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        minHeight: 88,
        borderWidth: 1.5, // Match ProductCard
        borderColor: 'transparent', // Match ProductCard
        // Shadows matching ProductCard (enabled for List too)
        ...SHADOWS.card,
        elevation: 2,
        shadowOpacity: 0.06,
        shadowRadius: 10,
    },
    innerContainer: {
        width: '100%',
        height: '100%',
        flex: 1,
    },
    innerContainerList: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    // --- Cover Section (Grid) ---
    iconContainer: {
        height: '60%',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '10',
    },
    iconContainerList: {
        height: 56, // Fixed size for List mode
        width: 56,  // Fixed size for List mode
        borderRadius: 16, // Rounded corners for list thumbnail
        overflow: 'hidden', // Mask image
        backgroundColor: COLORS.primary + '10',
        marginRight: SPACING.md,
        marginBottom: 0,
    },
    iconPlaceholder: {
        width: 64,
        height: 64,
        borderRadius: RADIUS.full,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    iconPlaceholderList: {
        width: '100%',
        height: '100%',
        borderRadius: 0, // Inherit from container
        backgroundColor: 'transparent',
        shadowOpacity: 0,
        elevation: 0,
    },
    sectionImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    // --- Text Details (Grid) ---
    textContainer: {
        height: '40%',
        width: '100%',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        justifyContent: 'center',
        alignItems: 'flex-start',
        backgroundColor: COLORS.surface,
    },
    textContainerList: {
        height: 'auto',
        width: 'auto', // Allow text to take remaining width
        padding: 0,
        flex: 1,
        backgroundColor: 'transparent',
    },
    centeredContent: {
        alignItems: 'flex-start', // Ensure left align in grid inner content
        width: '100%',
    },
    sectionName: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
        textAlign: 'left',
        width: '100%',
    },
    sectionNameList: {
        marginBottom: 2,
        fontSize: TYPOGRAPHY.size.base,
    },
    badgeContainer: {
        backgroundColor: COLORS.background,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: RADIUS.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignSelf: 'flex-start',
    },
    itemCount: {
        fontSize: 10,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    moreButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.8)', // Semi-transparent bg for visibility on images
        borderRadius: RADIUS.full,
    },
    moreButtonList: {
        position: 'relative',
        top: 0,
        right: 0,
        backgroundColor: 'transparent',
    },
    cardSelected: {
        backgroundColor: COLORS.primary + '05', // Match NotesScreen
        borderColor: COLORS.primary,
        borderWidth: 1.5,
        // Match NotesScreen shadow removal
        shadowColor: 'transparent',
        shadowOpacity: 0,
        elevation: 0,
    },
    selectionIndicator: {
        position: 'absolute',
        top: SPACING.md,
        right: SPACING.md,
        width: 20, // Match NotesScreen size
        height: 20, // Match NotesScreen size
        borderRadius: 4, // Match NotesScreen (Square)
        borderWidth: 2,
        borderColor: COLORS.textMuted, // Match NotesScreen unselected border
        backgroundColor: 'rgba(255,255,255,0.9)', // High contrast background for over images
        zIndex: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectionIndicatorActive: {
        backgroundColor: COLORS.primary, // Match NotesScreen
        borderColor: COLORS.primary, // Match NotesScreen
        opacity: 1,
    }
});
