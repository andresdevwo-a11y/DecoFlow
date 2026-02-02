import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, SIZES } from '../constants/Theme';

export default function DeleteConfirmationModal({ visible, onCancel, onConfirm, sectionName, title, message, loading }) {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onCancel}
            statusBarTranslucent={true}
        >
            <View style={styles.overlay}>
                <View style={styles.dialog}>
                    <View style={styles.iconContainer}>
                        <Feather name="alert-triangle" size={32} color={COLORS.error} />
                    </View>

                    <Text style={styles.title}>{title || '¿Eliminar sección?'}</Text>

                    <Text style={styles.message}>
                        {message || `Estás a punto de eliminar "${sectionName}". Esta acción no se puede deshacer.`}
                    </Text>

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onCancel} disabled={loading}>
                            <Text style={styles.cancelText}>Cancelar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.deleteButton, loading && styles.disabledButton]}
                            onPress={onConfirm}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color={COLORS.surface} />
                            ) : (
                                <Text style={styles.deleteText}>Eliminar</Text>
                            )}
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
        backgroundColor: COLORS.overlay,
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
        width: SIZES.iconContainerLg,
        height: SIZES.iconContainerLg,
        borderRadius: SIZES.iconContainerLg / 2,
        backgroundColor: COLORS.errorLight,
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
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING['2xl'],
        lineHeight: TYPOGRAPHY.lineHeight.normal,
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
        color: COLORS.textSecondary,
    },
    deleteButton: {
        flex: 1,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.sm,
        backgroundColor: COLORS.error,
        alignItems: 'center',
    },
    deleteText: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.surface,
    },
    disabledButton: {
        opacity: 0.7,
    }
});
