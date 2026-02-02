import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, RADIUS, TYPOGRAPHY, SIZES } from '../../../constants/Theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PANEL_WIDTH = SCREEN_WIDTH * 0.75;

/**
 * LayerItem - Individual layer representation
 */
function LayerItem({
    layer,
    isSelected,
    onSelect,
    onToggleLock,
    onToggleVisibility,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast,
}) {
    return (
        <TouchableOpacity
            style={[
                styles.layerItem,
                isSelected && styles.layerItemSelected,
            ]}
            onPress={() => onSelect(layer.id)}
            activeOpacity={0.7}
        >
            {/* Thumbnail */}
            <View style={styles.thumbnailContainer}>
                {layer.source ? (
                    <Image
                        source={layer.source}
                        style={styles.thumbnail}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.thumbnailPlaceholder}>
                        <Feather name="image" size={20} color="#9CA3AF" />
                    </View>
                )}
            </View>

            {/* Layer Info */}
            <View style={styles.layerInfo}>
                <Text style={styles.layerName} numberOfLines={1}>
                    {layer.name || `Capa ${layer.id.slice(-4)}`}
                </Text>
                <Text style={styles.layerDimensions}>
                    {Math.round(layer.width)} × {Math.round(layer.height)}
                </Text>
            </View>

            {/* Controls */}
            <View style={styles.layerControls}>
                {/* Visibility Toggle */}
                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => onToggleVisibility(layer.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Feather
                        name={layer.visible !== false ? 'eye' : 'eye-off'}
                        size={16}
                        color={layer.visible !== false ? '#6B7280' : '#D1D5DB'}
                    />
                </TouchableOpacity>

                {/* Lock Toggle */}
                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => onToggleLock(layer.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Feather
                        name={layer.locked ? 'lock' : 'unlock'}
                        size={16}
                        color={layer.locked ? COLORS.primary : '#D1D5DB'}
                    />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

/**
 * LayersPanel - Manages layer ordering and visibility
 */
export default function LayersPanel({
    visible = false,
    onClose,
    layers = [],
    selectedLayerId,
    onSelectLayer,
    onToggleLock,
    onToggleVisibility,
    onReorderLayers,
    onDeleteLayer,
}) {
    const insets = useSafeAreaInsets();

    const handleMoveUp = (layerId) => {
        const index = layers.findIndex(l => l.id === layerId);
        if (index < layers.length - 1 && onReorderLayers) {
            const newLayers = [...layers];
            [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
            onReorderLayers(newLayers);
        }
    };

    const handleMoveDown = (layerId) => {
        const index = layers.findIndex(l => l.id === layerId);
        if (index > 0 && onReorderLayers) {
            const newLayers = [...layers];
            [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
            onReorderLayers(newLayers);
        }
    };

    if (!visible) return null;

    return (
        <>
            {/* Backdrop */}
            <TouchableOpacity
                style={styles.backdrop}
                activeOpacity={1}
                onPress={onClose}
            />

            {/* Panel */}
            <View
                style={[
                    styles.panel,
                    {
                        top: SIZES.headerHeight + insets.top + 16,
                        bottom: SIZES.navBarHeight + insets.bottom + 16,
                        paddingTop: 16,
                        paddingBottom: 16,
                    }
                ]}
            >
                {/* Header */}
                < View style={styles.header} >
                    <Text style={styles.title}>Capas</Text>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                    >
                        <Feather name="x" size={24} color="#374151" />
                    </TouchableOpacity>
                </View >

                {/* Layer Count */}
                < View style={styles.countContainer} >
                    <Text style={styles.countText}>
                        {layers.length} {layers.length === 1 ? 'elemento' : 'elementos'}
                    </Text>
                </View >

                {/* Layers List */}
                < ScrollView
                    style={styles.layersList}
                    contentContainerStyle={styles.layersListContent}
                    showsVerticalScrollIndicator={false}
                >
                    {
                        layers.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Feather name="layers" size={48} color="#D1D5DB" />
                                <Text style={styles.emptyText}>No hay capas</Text>
                                <Text style={styles.emptySubtext}>
                                    Agrega imágenes para comenzar
                                </Text>
                            </View>
                        ) : (
                            // Render layers in reverse order (top layer first)
                            [...layers].reverse().map((layer, index) => (
                                <LayerItem
                                    key={layer.id}
                                    layer={layer}
                                    isSelected={layer.id === selectedLayerId}
                                    onSelect={onSelectLayer}
                                    onToggleLock={onToggleLock}
                                    onToggleVisibility={onToggleVisibility}
                                    onMoveUp={() => handleMoveUp(layer.id)}
                                    onMoveDown={() => handleMoveDown(layer.id)}
                                    isFirst={index === 0}
                                    isLast={index === layers.length - 1}
                                />
                            ))
                        )
                    }
                </ScrollView >

                {/* Footer Actions */}
                {
                    selectedLayerId && (
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={styles.footerButton}
                                onPress={() => handleMoveUp(selectedLayerId)}
                            >
                                <Feather name="arrow-up" size={20} color="#374151" />
                                <Text style={styles.footerButtonText}>Subir</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.footerButton}
                                onPress={() => handleMoveDown(selectedLayerId)}
                            >
                                <Feather name="arrow-down" size={20} color="#374151" />
                                <Text style={styles.footerButtonText}>Bajar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.footerButton, styles.footerButtonDanger]}
                                onPress={() => onDeleteLayer && onDeleteLayer(selectedLayerId)}
                            >
                                <Feather name="trash-2" size={20} color="#EF4444" />
                                <Text style={[styles.footerButtonText, styles.footerButtonTextDanger]}>
                                    Eliminar
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )
                }
            </View >
        </>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        zIndex: 500,
    },
    panel: {
        position: 'absolute',
        right: 0,
        // top: 70, (moved to inline)
        // bottom: 80, (moved to inline)
        width: PANEL_WIDTH,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: RADIUS.xl,
        borderBottomLeftRadius: RADIUS.xl,
        zIndex: 501,
        ...SHADOWS.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    title: {
        fontSize: TYPOGRAPHY.size['2xl'],
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: '#111827',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    countContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    countText: {
        fontSize: TYPOGRAPHY.size.sm,
        color: '#6B7280',
    },
    layersList: {
        flex: 1,
    },
    layersListContent: {
        paddingHorizontal: 12,
        paddingBottom: 20,
    },
    layerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: RADIUS.md,
        marginBottom: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    layerItemSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primaryLight,
    },
    thumbnailContainer: {
        width: 48,
        height: 48,
        borderRadius: RADIUS.sm,
        overflow: 'hidden',
        backgroundColor: '#E5E7EB',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    thumbnailPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    layerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    layerName: {
        fontSize: TYPOGRAPHY.size.base,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: '#111827',
        marginBottom: 2,
    },
    layerDimensions: {
        fontSize: TYPOGRAPHY.size.xs,
        color: '#9CA3AF',
    },
    layerControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    controlButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: '#6B7280',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: TYPOGRAPHY.size.sm,
        color: '#9CA3AF',
        marginTop: 4,
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 8,
    },
    footerButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: '#F3F4F6',
        borderRadius: RADIUS.md,
        gap: 6,
    },
    footerButtonDanger: {
        backgroundColor: '#FEE2E2',
    },
    footerButtonText: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: '#374151',
    },
    footerButtonTextDanger: {
        color: '#EF4444',
    },
});
