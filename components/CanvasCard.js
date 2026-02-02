import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, SIZES } from '../constants/Theme';

const CanvasCard = React.memo(({ canvas, onPress, onOptionsPress, viewMode = 'Grid' }) => {
    const isList = viewMode === 'Lista';

    return (
        <TouchableOpacity
            style={[styles.card, isList && styles.cardList]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Image / Thumbnail Section */}
            <View style={[styles.imageContainer, isList && styles.imageContainerList]}>
                {canvas.thumbnail ? (
                    <Image source={{ uri: canvas.thumbnail }} style={styles.image} />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Feather name="layout" size={isList ? 24 : 32} color={COLORS.primary} />
                    </View>
                )}

                {/* Options Button (Grid only) */}
                {!isList && (
                    <TouchableOpacity
                        style={styles.optionsButton}
                        onPress={onOptionsPress}
                    >
                        <View style={styles.optionsButtonBackground}>
                            <Feather name="more-vertical" size={SIZES.iconSm} color={COLORS.text} />
                        </View>
                    </TouchableOpacity>
                )}
            </View>

            {/* Content Section */}
            <View style={[styles.content, isList && styles.contentList]}>
                <View style={isList ? styles.textContainerList : null}>
                    <Text style={[styles.name, isList && styles.nameList]} numberOfLines={1}>
                        {canvas.name}
                    </Text>
                    <Text style={styles.dateText}>
                        {new Date(canvas.updatedAt).toLocaleDateString()}
                    </Text>
                </View>

                {/* Options Button (List only) */}
                {isList && (
                    <TouchableOpacity
                        style={styles.optionsButtonList}
                        onPress={onOptionsPress}
                    >
                        <Feather name="more-vertical" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
});

export default CanvasCard;

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        marginBottom: SPACING.lg,
        width: '48%',
        ...SHADOWS.card,
    },
    cardList: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.sm,
    },
    imageContainer: {
        height: SIZES.cardImageHeight || 140, // Ensure fallback if SIZES.cardImageHeight is undefined
        width: '100%',
        borderTopLeftRadius: RADIUS.lg,
        borderTopRightRadius: RADIUS.lg,
        overflow: 'hidden',
        backgroundColor: COLORS.surfaceHighlight, // Slightly different from ProductCard background
        position: 'relative',
    },
    imageContainerList: {
        width: 80,
        height: 80,
        borderRadius: RADIUS.md,
        marginRight: SPACING.md,
        aspectRatio: 1,
        borderTopLeftRadius: RADIUS.md,
        borderTopRightRadius: RADIUS.md,
        borderBottomLeftRadius: RADIUS.md,
        borderBottomRightRadius: RADIUS.md,
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceHighlight,
    },
    optionsButton: {
        position: 'absolute',
        top: SPACING.sm,
        right: SPACING.sm,
        zIndex: 10,
    },
    optionsButtonBackground: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: RADIUS.md,
        padding: SPACING.xs,
    },
    content: {
        padding: SPACING.md,
    },
    contentList: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 0,
    },
    textContainerList: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        color: COLORS.text,
        fontSize: TYPOGRAPHY.size.text,
        fontWeight: TYPOGRAPHY.weight.semibold,
        marginBottom: 4,
    },
    nameList: {
        fontSize: TYPOGRAPHY.size.xl,
        marginBottom: 2,
    },
    dateText: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.textSecondary,
    },
    optionsButtonList: {
        padding: SPACING.sm,
        marginLeft: SPACING.xs,
    },
});
