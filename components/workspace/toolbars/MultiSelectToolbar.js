import React, { useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS } from '../../../constants/Theme';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

const TOOLBAR_HEIGHT = 60;
const BUTTON_WIDTH = 80;
const ICON_SIZE = 20;

export default function MultiSelectToolbar({ onAction, selectedCount = 0 }) {

    // Group enabled only if 2+ items
    const canGroup = selectedCount >= 2;

    const bottomSheetOffset = useSharedValue(20);
    const opacity = useSharedValue(0);

    useEffect(() => {
        bottomSheetOffset.value = withTiming(0, { duration: 200 });
        opacity.value = withTiming(1, { duration: 200 });
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: bottomSheetOffset.value }],
            opacity: opacity.value
        };
    });

    const ITEMS = [
        {
            id: 'delete',
            icon: 'trash-2',
            label: 'Borrar',
            color: '#EF4444',
            bgColor: 'rgba(239, 68, 68, 0.1)',
            count: selectedCount,
            enabled: true
        },
        {
            id: 'group',
            icon: 'layers',
            label: 'Agrupar',
            color: canGroup ? COLORS.primary : 'rgba(156, 163, 175, 0.5)',
            bgColor: canGroup ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.05)',
            enabled: canGroup
        },
    ];

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.toolbar, animatedStyle]}>
                <View style={styles.header}>
                    <Text style={styles.countText}>{selectedCount} seleccionados</Text>
                </View>
                <View style={styles.divider} />
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {ITEMS.map((item, index) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.button,
                                { opacity: item.enabled ? 1 : 0.6 }
                            ]}
                            activeOpacity={0.7}
                            onPress={() => item.enabled && onAction && onAction(item.id)}
                            disabled={!item.enabled}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: item.enabled ? item.bgColor : '#F3F4F6' }]}>
                                <Feather
                                    name={item.icon}
                                    size={ICON_SIZE}
                                    color={item.enabled ? item.color : '#9CA3AF'}
                                />
                            </View>
                            <Text style={[
                                styles.label,
                                { color: item.enabled ? (item.id === 'delete' ? '#EF4444' : '#1F2937') : '#9CA3AF' } // Dark text or specific color
                            ]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        alignItems: 'center',
        zIndex: 200,
    },
    toolbar: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingVertical: 10,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        // Modern Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
    header: {
        paddingRight: 10,
    },
    countText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827'
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 10
    },
    scrollContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 16,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
    },
});
