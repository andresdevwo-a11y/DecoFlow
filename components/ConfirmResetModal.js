import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, SIZES } from '../constants/Theme';

export default function ConfirmResetModal({ visible, onCancel, onConfirm, loading }) {
    const insets = useSafeAreaInsets();

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onCancel}
            statusBarTranslucent={true}
        >
            <TouchableWithoutFeedback onPress={onCancel}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback onPress={() => { }}>
                        <View style={styles.modalContainer}>
                            <View style={styles.iconContainer}>
                                <Feather name="alert-triangle" size={32} color={COLORS.error} />
                            </View>

                            <Text style={styles.title}>¿Borrar todos los datos?</Text>

                            <Text style={styles.message}>
                                Esta acción eliminará permanentemente todas tus carpetas,
                                productos y configuraciones. Esta acción no se puede deshacer.
                            </Text>

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={onCancel}
                                    activeOpacity={0.7}
                                    disabled={loading}
                                >
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.deleteButton, loading && styles.disabledButton]}
                                    onPress={onConfirm}
                                    activeOpacity={0.7}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator size="small" color={COLORS.surface} />
                                    ) : (
                                        <>
                                            <Feather name="trash-2" size={18} color={COLORS.surface} />
                                            <Text style={styles.deleteButtonText}>Borrar Todo</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
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
    modalContainer: {
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
        textAlign: 'center',
        marginBottom: SPACING.md,
    },
    message: {
        fontSize: TYPOGRAPHY.size.base,
        color: COLORS.textMuted,
        textAlign: 'center',
        lineHeight: TYPOGRAPHY.lineHeight.normal,
        marginBottom: SPACING['2xl'],
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: SPACING.md,
        width: '100%',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: SPACING.lg - 2,
        borderRadius: RADIUS.sm + 2,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.textSecondary,
    },
    deleteButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: SPACING.lg - 2,
        borderRadius: RADIUS.sm + 2,
        backgroundColor: COLORS.error,
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
    },
    deleteButtonText: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.surface,
    },
    disabledButton: {
        opacity: 0.7,
    },
});
