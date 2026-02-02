import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, RADIUS, SIZES } from '../../constants/Theme';

export default function WorkspaceHeader({
    onBack,
    onSave,
    onShare,
    title = "Mi Lienzo",
    saveStatus = 'idle' // 'idle', 'saving', 'saved', 'error'
}) {
    const insets = useSafeAreaInsets();

    const getSaveButtonContent = () => {
        switch (saveStatus) {
            case 'saving':
                return (
                    <>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text style={styles.saveText}>Guardando...</Text>
                    </>
                );
            case 'saved':
                return (
                    <>
                        <Feather name="check" size={20} color="#FFFFFF" />
                        <Text style={styles.saveText}>Guardado</Text>
                    </>
                );
            case 'error':
                return (
                    <>
                        <Feather name="alert-circle" size={20} color="#FFFFFF" />
                        <Text style={styles.saveText}>Error</Text>
                    </>
                );
            default: // idle
                return (
                    <>
                        <Feather name="save" size={20} color="#FFFFFF" />
                        <Text style={styles.saveText}>Guardar</Text>
                    </>
                );
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.content}>
                {/* Left: Back Button */}
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={onBack}
                    activeOpacity={0.7}
                >
                    <Feather name="arrow-left" size={24} color={COLORS.text} />
                </TouchableOpacity>

                {/* Center: Title */}
                <View style={styles.titleContainer}>
                    <Text style={styles.title} numberOfLines={1}>
                        {title}
                    </Text>
                </View>

                {/* Right: Actions */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={onShare}
                        activeOpacity={0.7}
                    >
                        <Feather name="share" size={20} color={COLORS.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            styles.saveButton,
                            saveStatus === 'saved' && styles.savedButton
                        ]}
                        onPress={onSave}
                        activeOpacity={0.7}
                        disabled={saveStatus === 'saving'}
                    >
                        {getSaveButtonContent()}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        zIndex: 100,
        ...SHADOWS.sm,
    },
    content: {
        height: SIZES.headerHeight,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        justifyContent: 'space-between',
    },
    iconButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: RADIUS.full,
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionButton: {
        height: 36,
        minWidth: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: RADIUS.md,
        paddingHorizontal: 8,
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        gap: 6,
        minWidth: 110, // Ensure enough width for text changes
    },
    savedButton: {
        backgroundColor: '#10B981', // Green for success
    },
    saveText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    }
});
