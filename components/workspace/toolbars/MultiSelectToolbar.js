import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS } from '../../../constants/Theme';

const TOOLBAR_HEIGHT = 80; // Slightly smaller? standard is 85
const BUTTON_WIDTH = 70;
const ICON_SIZE = 24;

export default function MultiSelectToolbar({ onAction, selectedCount = 0 }) {

    // Group enabled only if 2+ items
    const canGroup = selectedCount >= 2;

    const ITEMS = [
        {
            id: 'delete',
            icon: 'trash-2',
            label: 'Borrar (' + selectedCount + ')',
            color: '#EF4444', // Red 500
            enabled: true
        },
        {
            id: 'group',
            icon: 'layers',
            label: 'Agrupar',
            color: canGroup ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
            enabled: canGroup
        },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.toolbar}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {ITEMS.map((item, index) => (
                        <View key={item.id} style={styles.itemContainer}>
                            <TouchableOpacity
                                style={[styles.button, { opacity: item.enabled ? 1 : 0.5 }]}
                                activeOpacity={0.6}
                                onPress={() => item.enabled && onAction && onAction(item.id)}
                                disabled={!item.enabled}
                            >
                                <View style={[
                                    styles.iconContainer,
                                    item.id === 'delete' && { backgroundColor: 'rgba(239, 68, 68, 0.2)' }
                                ]}>
                                    <Feather
                                        name={item.icon}
                                        size={ICON_SIZE}
                                        color={item.color}
                                    />
                                </View>
                                <Text style={[styles.label, { color: item.id === 'delete' ? '#EF4444' : '#F9FAFB' }]} numberOfLines={1}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 101, // Above standard toolbar
    },
    toolbar: {
        height: TOOLBAR_HEIGHT,
        minWidth: 200,
        backgroundColor: '#1F2937',
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    scrollContent: {
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center', // Center content
        flexGrow: 1,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: '100%',
        marginHorizontal: 5
    },
    button: {
        width: BUTTON_WIDTH,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    label: {
        color: '#F9FAFB',
        fontSize: 10,
        fontWeight: '500',
        textAlign: 'center',
    },
});
