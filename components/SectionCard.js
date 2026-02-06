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
                        <View style={[styles.iconPlaceholder, { backgroundColor: COLORS.primary + '10' }]}>
                            <Feather
                                name={section.icon || 'folder'}
                                size={isList ? 20 : 28}
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
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
        width: '48%',
        borderWidth: 1.5, // Consistent width
        borderColor: 'transparent',
        ...SHADOWS.card,
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        alignItems: 'center', // Center content in grid
        justifyContent: 'center',
        minHeight: 160, // Consistent height for Grid
    },
    cardList: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: SPACING.sm,
        minHeight: 'auto',
    },
    innerContainer: {
        alignItems: 'center',
        width: '100%',
    },
    innerContainerList: {
        flexDirection: 'row',
    },
    iconContainer: {
        marginBottom: SPACING.md,
    },
    iconContainerList: {
        marginBottom: 0,
        marginRight: SPACING.md,
    },
    iconPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 20, // Soft large radius
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionImage: {
        width: 56,
        height: 56,
        borderRadius: 20,
        resizeMode: 'cover',
    },
    textContainer: {
        alignItems: 'center',
        flex: 1,
    },
    textContainerList: {
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    centeredContent: {
        alignItems: 'center',
    },
    sectionName: {
        fontSize: TYPOGRAPHY.size.lg, // Larger
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
        textAlign: 'center',
    },
    sectionNameList: {
        textAlign: 'left',
        marginBottom: 2,
    },
    badgeContainer: {
        backgroundColor: COLORS.background,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: RADIUS.full,
    },
    itemCount: {
        fontSize: 11,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    moreButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        padding: 8,
    },
    moreButtonList: {
        position: 'relative',
        top: 0,
        right: 0,
        marginLeft: 'auto',
    },
    cardSelected: {
        borderColor: COLORS.primary,
        borderWidth: 1.5,
        backgroundColor: COLORS.primary + '12',
        shadowOpacity: 0,
        elevation: 0,
    },
    selectionIndicator: {
        position: 'absolute',
        top: SPACING.sm,
        right: SPACING.sm,
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.textMuted,
        backgroundColor: 'transparent',
        zIndex: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectionIndicatorActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    }
});
