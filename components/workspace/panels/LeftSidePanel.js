import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Text,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, RADIUS, SIZES } from '../../../constants/Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PANEL_WIDTH = 64;
const PANEL_WIDTH_EXPANDED = 200;

// Panel items with categories and colors
const PANEL_ITEMS = [
    {
        id: 'add',
        icon: 'plus-circle',
        label: 'Añadir',
        color: '#10B981',
        description: 'Agregar imagen'
    },
    {
        id: 'layers',
        icon: 'layers',
        label: 'Capas',
        color: '#8B5CF6',
        description: 'Gestionar capas'
    },
    {
        id: 'settings',
        icon: 'sliders',
        label: 'Ajustes',
        color: '#F59E0B',
        description: 'Configuración'
    },
];

export default function LeftSidePanel({
    onAction,
    selectedImageId = null,
    isExpanded = false,
    onToggleExpand
}) {
    const insets = useSafeAreaInsets();
    const [activeItem, setActiveItem] = useState(null);

    const handlePress = (itemId) => {
        setActiveItem(itemId);
        if (onAction) {
            onAction(itemId);
        }
        // Reset active state after animation
        setTimeout(() => setActiveItem(null), 200);
    };

    return (
        <View
            style={[
                styles.container,
                { bottom: SIZES.navBarHeight + insets.bottom + 16 }
            ]}
            pointerEvents="box-none"
        >
            <View
                style={[
                    styles.panel,
                    {
                        width: isExpanded ? PANEL_WIDTH_EXPANDED : PANEL_WIDTH,
                        paddingTop: 16,
                        paddingBottom: 16,
                    }
                ]}
            >
                {/* Toggle Button */}
                <TouchableOpacity
                    style={styles.toggleButton}
                    onPress={onToggleExpand}
                    activeOpacity={0.7}
                >
                    <Feather
                        name={isExpanded ? 'chevron-left' : 'chevron-right'}
                        size={20}
                        color={COLORS.textMuted}
                    />
                </TouchableOpacity>

                {/* Panel Items */}
                <View style={styles.itemsContainer}>
                    {PANEL_ITEMS.map((item) => {
                        const isActive = activeItem === item.id;
                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.item,
                                    isActive && styles.itemActive,
                                ]}
                                onPress={() => handlePress(item.id)}
                                activeOpacity={0.7}
                            >
                                <View
                                    style={[
                                        styles.iconContainer,
                                        isActive && styles.iconContainerActive
                                    ]}
                                >
                                    <Feather
                                        name={item.icon}
                                        size={22}
                                        color={isActive ? COLORS.primaryDark : COLORS.primary}
                                    />
                                </View>
                                {isExpanded && (
                                    <Text
                                        style={[
                                            styles.label,
                                            isActive && styles.labelActive
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {item.label}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Bottom Spacer */}
                <View style={styles.bottomSpacer} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        top: 0,
        // bottom: 0, (moved to inline style)
        justifyContent: 'center',
        zIndex: 190,
    },
    panel: {
        backgroundColor: COLORS.surface,
        borderTopRightRadius: RADIUS.lg,
        borderBottomRightRadius: RADIUS.lg,
        ...SHADOWS.lg,
        overflow: 'hidden',
    },
    toggleButton: {
        alignSelf: 'center',
        padding: 8,
        marginBottom: 16,
    },
    itemsContainer: {
        alignItems: 'center',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: RADIUS.md,
        marginBottom: 8,
        width: '100%',
    },
    itemActive: {
        backgroundColor: COLORS.primaryLight,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    iconContainerActive: {
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
    },
    label: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 12,
        flex: 1,
    },
    labelActive: {
        color: COLORS.primaryDark,
        fontWeight: '600',
    },
    bottomSpacer: {
        height: 20,
    },
});
