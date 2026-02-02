import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS } from '../../constants/Theme';

const TOOLBAR_HEIGHT = 85;
const BUTTON_WIDTH = 60;
const ICON_SIZE = 22;

const TOOLBAR_ITEMS = [
    { id: 'add', icon: 'plus', group: 'add', label: 'Añadir' },
    { id: 'duplicate', icon: 'copy', group: 'add', label: 'Duplicar', separator: true },

    { id: 'delete', icon: 'trash-2', group: 'actions', label: 'Borrar', separator: true },

    { id: 'clear', icon: 'x-circle', group: 'canvas', label: 'Limpiar' },
];

export default function WorkspaceToolbar({ onAction }) {
    return (
        <View style={styles.container}>
            <View style={styles.toolbar}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {TOOLBAR_ITEMS.map((item, index) => (
                        <View key={item.id} style={styles.itemContainer}>
                            <TouchableOpacity
                                style={styles.button}
                                activeOpacity={0.6}
                                onPress={() => onAction && onAction(item.id)}
                            >
                                <View style={styles.iconContainer}>
                                    <Feather
                                        name={item.icon}
                                        size={ICON_SIZE}
                                        color="#FFFFFF"
                                    />
                                </View>
                                <Text style={styles.label} numberOfLines={1}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                            {item.separator && <View style={styles.separator} />}
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
        bottom: 60, // Lowered closer to BottomNavBar (was 90)
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 100,
    },
    toolbar: {
        height: TOOLBAR_HEIGHT,
        maxWidth: '92%',
        backgroundColor: '#1F2937', // Dark charcoal for contrast
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        // Shadow
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    scrollContent: {
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: '100%',
    },
    button: {
        width: BUTTON_WIDTH,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    label: {
        color: '#F9FAFB', // Light gray/white
        fontSize: 10,
        fontWeight: '500',
        textAlign: 'center',
        opacity: 0.9,
    },
    separator: {
        width: 1,
        height: 32,
        backgroundColor: 'rgba(255,255,255,0.15)',
        marginHorizontal: 4,
    },
});
