import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, SIZES } from '../../../constants/Theme';

export default function ConfirmationModal({
    visible,
    onClose,
    onConfirm,
    title = 'Confirmar',
    message = '¿Estás seguro?',
    confirmLabel = 'Eliminar',
    cancelLabel = 'Cancelar',
    confirmColor = COLORS.error
}) {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <View style={styles.overlay}>
                <View style={styles.dialog}>
                    <View style={styles.iconContainer}>
                        <Feather name="alert-triangle" size={32} color={COLORS.error} />
                    </View>

                    <Text style={styles.title}>{title}</Text>

                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelText}>{cancelLabel}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.confirmButton, { backgroundColor: confirmColor }]}
                            onPress={onConfirm}
                        >
                            <Text style={styles.confirmText}>{confirmLabel}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: COLORS.overlay || 'rgba(0,0,0,0.5)', // Fallback if overlay color not defined
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING['2xl'],
    },
    dialog: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING['2xl'],
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        ...SHADOWS.modal,
    },
    iconContainer: {
        width: SIZES.iconContainerLg || 64, // Fallback
        height: SIZES.iconContainerLg || 64,
        borderRadius: (SIZES.iconContainerLg || 64) / 2,
        backgroundColor: COLORS.errorLight || '#FECACA', // Fallback
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    title: {
        fontSize: TYPOGRAPHY.size['3xl'],
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        marginBottom: SPACING.sm,
        textAlign: 'center',
    },
    message: {
        fontSize: TYPOGRAPHY.size.lg,
        color: COLORS.textSecondary || COLORS.textMuted,
        textAlign: 'center',
        marginBottom: SPACING['2xl'],
        lineHeight: 24, // Optimized for readability
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        gap: SPACING.md,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.textSecondary || COLORS.textMuted,
    },
    confirmButton: {
        flex: 1,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.sm,
        alignItems: 'center',
    },
    confirmText: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.surface,
    },
});
