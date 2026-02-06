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
            activeOpacity={0.8}
        >
            {/* Image / Thumbnail Section */}
            <View style={[styles.imageContainer, isList && styles.imageContainerList]}>
                {canvas.thumbnail ? (
                    <Image source={{ uri: canvas.thumbnail }} style={styles.image} />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Feather name="layout" size={isList ? 24 : 32} color={COLORS.primary + '60'} />
                    </View>
                )}

                {/* Options Button (Grid only) */}
                {!isList && (
                    <TouchableOpacity
                        style={styles.floatingOptionsButton}
                        onPress={onOptionsPress}
                    >
                        <Feather name="more-horizontal" size={18} color={COLORS.text} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Content Section */}
            <View style={[styles.content, isList && styles.contentList]}>
                <View style={isList ? styles.textContainerList : null}>
                    <Text style={[styles.name, isList && styles.nameList]} numberOfLines={1}>
                        {canvas.name}
                    </Text>
                    <View style={styles.dateBadge}>
                        <Feather name="clock" size={10} color={COLORS.textMuted} style={{ marginRight: 4 }} />
                        <Text style={styles.dateText}>
                            {new Date(canvas.updatedAt).toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                {/* Options Button (List only) */}
                {isList && (
                    <TouchableOpacity
                        style={styles.optionsButtonList}
                        onPress={onOptionsPress}
                    >
                        <Feather name="more-vertical" size={20} color={COLORS.textSecondary} />
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
        borderRadius: RADIUS.xl,
        marginBottom: SPACING.lg,
        width: '48%',
        borderWidth: 0,
        ...SHADOWS.card,
        elevation: 2,
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    cardList: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.sm,
    },
    imageContainer: {
        height: 140,
        width: '100%',
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        overflow: 'hidden',
        backgroundColor: COLORS.background,
        position: 'relative',
    },
    imageContainerList: {
        width: 80,
        height: 80,
        borderRadius: RADIUS.lg,
        marginRight: SPACING.md,
        aspectRatio: 1,
        borderBottomLeftRadius: RADIUS.lg,
        borderBottomRightRadius: RADIUS.lg,
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
        backgroundColor: '#F3F4F6',
    },
    floatingOptionsButton: {
        position: 'absolute',
        top: SPACING.sm,
        right: SPACING.sm,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
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
        fontSize: TYPOGRAPHY.size.base,
        fontWeight: '700',
        marginBottom: 6,
    },
    nameList: {
        fontSize: TYPOGRAPHY.size.lg,
        marginBottom: 4,
    },
    dateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: RADIUS.sm,
    },
    dateText: {
        fontSize: 10,
        color: COLORS.textMuted,
        fontWeight: '500',
    },
    optionsButtonList: {
        padding: SPACING.sm,
        marginLeft: SPACING.xs,
    },
});
