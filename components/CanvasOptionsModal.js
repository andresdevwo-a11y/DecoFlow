import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, SIZES } from '../constants/Theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CanvasOptionsModal({ visible, onClose, canvasName, onOpen, onRename, onDelete }) {
    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={styles.dismissArea}
                    activeOpacity={1}
                    onPress={onClose}
                />

                <View style={styles.modalContainer}>
                    {/* Pull Handle */}
                    <View style={styles.handleContainer}>
                        <View style={styles.handle} />
                    </View>

                    <ScrollView contentContainerStyle={styles.content}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={[styles.iconContainer, { backgroundColor: COLORS.primaryLight }]}>
                                <Feather name="layout" size={24} color={COLORS.primary} />
                            </View>
                            <View style={styles.headerTextContainer}>
                                <Text style={styles.title} numberOfLines={1}>{canvasName}</Text>
                                <Text style={styles.subtitle}>Gestionar Lienzo</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Feather name="x" size={22} color={COLORS.textMuted} />
                            </TouchableOpacity>
                        </View>

                        {/* Options List */}
                        <View style={styles.optionsList}>
                            <TouchableOpacity style={styles.optionItem} onPress={onOpen} activeOpacity={0.7}>
                                <View style={[styles.optionIcon, { backgroundColor: COLORS.primaryLight }]}>
                                    <Feather name="external-link" size={20} color={COLORS.primary} />
                                </View>
                                <View style={styles.optionTextContainer}>
                                    <Text style={styles.optionLabel}>Abrir Lienzo</Text>
                                    <Text style={styles.optionDesc}>Cargar y editar este diseño</Text>
                                </View>
                                <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.optionItem} onPress={onRename} activeOpacity={0.7}>
                                <View style={[styles.optionIcon, { backgroundColor: COLORS.background }]}>
                                    <Feather name="edit-3" size={20} color={COLORS.textSecondary} />
                                </View>
                                <View style={styles.optionTextContainer}>
                                    <Text style={styles.optionLabel}>Renombrar</Text>
                                    <Text style={styles.optionDesc}>Cambiar el nombre del archivo</Text>
                                </View>
                                <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            <TouchableOpacity style={[styles.optionItem, styles.destructiveItem]} onPress={onDelete} activeOpacity={0.7}>
                                <View style={[styles.optionIcon, { backgroundColor: COLORS.errorLight }]}>
                                    <Feather name="trash-2" size={20} color={COLORS.error} />
                                </View>
                                <View style={styles.optionTextContainer}>
                                    <Text style={[styles.optionLabel, { color: COLORS.error }]}>Eliminar Permanentemente</Text>
                                    <Text style={styles.optionDesc}>Esta acción no se puede deshacer</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: COLORS.overlay,
        justifyContent: 'flex-end',
    },
    dismissArea: {
        flex: 1,
    },
    modalContainer: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        maxHeight: SCREEN_HEIGHT * 0.85, // Limit height
        ...SHADOWS.sheet,
    },
    handleContainer: {
        width: '100%',
        alignItems: 'center',
        paddingTop: SPACING.md,
        paddingBottom: SPACING.sm,
    },
    handle: {
        width: SIZES.dragIndicatorWidth || 40,
        height: SIZES.dragIndicatorHeight || 4,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.border,
    },
    content: {
        padding: SPACING.xl,
        paddingBottom: SPACING['4xl'], // Large padding for bottom safe area
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING['2xl'],
    },
    iconContainer: {
        width: 54,
        height: 54,
        borderRadius: RADIUS.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.lg,
    },
    headerTextContainer: {
        flex: 1,
    },
    title: {
        fontSize: TYPOGRAPHY.size['2xl'],
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: TYPOGRAPHY.size.base,
        color: COLORS.textMuted,
        fontWeight: TYPOGRAPHY.weight.medium,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionsList: {
        gap: SPACING.sm,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.md,
    },
    optionIcon: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.lg,
    },
    optionTextContainer: {
        flex: 1,
    },
    optionLabel: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.text,
        marginBottom: 2,
    },
    optionDesc: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textMuted,
    },
    destructiveItem: {
        marginTop: SPACING.sm,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: SPACING.md,
        marginHorizontal: SPACING.xs,
    },
});
