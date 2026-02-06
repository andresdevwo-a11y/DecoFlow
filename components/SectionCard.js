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

            <View style={[styles.topRow, isList && styles.topRowList]}>
                {section.image ? (
                    <Image source={{ uri: section.image }} style={styles.sectionImage} />
                ) : (
                    <View style={[styles.iconContainer, { backgroundColor: section.color ? `${section.color}15` : COLORS.primaryLight }]}>
                        <Feather
                            name={section.icon || 'folder'} // Keep 'folder' icon for now or change to 'grid'? 'folder' is still a good icon.
                            size={SIZES.iconLg}
                            color={section.color || COLORS.primary}
                        />
                    </View>
                )}

                {isList && (
                    <View style={styles.contentList}>
                        <Text style={styles.sectionName} numberOfLines={1}>
                            {section.name}
                        </Text>
                        <Text style={styles.itemCount}>
                            {section.productCount || 0} items
                        </Text>
                    </View>
                )}

                {/* Hide More Button in Selection Mode */}
                {!selectionMode && (
                    <TouchableOpacity
                        style={[styles.moreButton, isList && styles.moreButtonList]}
                        onPress={onOptionsPress}
                    >
                        <Feather name="more-vertical" size={SIZES.iconSm} color={COLORS.placeholder} />
                    </TouchableOpacity>
                )}
            </View>

            {!isList && (
                <View style={styles.content}>
                    <Text style={styles.sectionName} numberOfLines={1}>
                        {section.name}
                    </Text>
                    <Text style={styles.itemCount}>
                        {section.productCount || 0} items
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
});

export default SectionCard;

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
        width: '48%',
        borderWidth: 0,
        borderColor: 'transparent',
        ...SHADOWS.card,
    },
    cardList: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        marginBottom: SPACING.sm,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.md,
    },
    topRowList: {
        marginBottom: 0,
        flex: 1,
        alignItems: 'center',
    },
    iconContainer: {
        width: SIZES.iconContainerMd,
        height: SIZES.iconContainerMd,
        borderRadius: RADIUS.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    moreButton: {
        padding: SPACING.xs,
    },
    moreButtonList: {
        marginLeft: 'auto',
    },
    sectionImage: {
        width: SIZES.iconContainerMd,
        height: SIZES.iconContainerMd,
        borderRadius: RADIUS.sm,
        resizeMode: 'cover',
    },
    content: {
        marginTop: SPACING.xs,
    },
    contentList: {
        marginLeft: SPACING.md,
        flex: 1,
        marginRight: SPACING.sm,
        justifyContent: 'center',
    },
    sectionName: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    itemCount: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.placeholder,
    },
    cardSelected: {
        borderColor: COLORS.primary,
        borderWidth: 1.5,
        backgroundColor: COLORS.primary + '05', // Subtle background like Notes
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    selectionIndicator: {
        position: 'absolute',
        top: SPACING.sm,
        right: SPACING.sm,
        width: 20, // Smaller size like Notes (20px)
        height: 20,
        borderRadius: 4, // 4px radius
        borderWidth: 1.5,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
        zIndex: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectionIndicatorActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        borderWidth: 0,
    }
});
