import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, SIZES } from '../constants/Theme';

export default function ChangeLicenseModal({ visible, onCancel, onConfirm, loading }) {
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
                                <Feather name="log-out" size={32} color={COLORS.error} />
                            </View>

                            <Text style={styles.title}>¿Cambiar Licencia?</Text>

                            <Text style={styles.message}>
                                ¿Estás seguro? Esto cerrará tu sesión actual y necesitarás ingresar un nuevo código de licencia válido para continuar.
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
                                    style={[styles.confirmButton, loading && styles.disabledButton]}
                                    onPress={onConfirm}
                                    activeOpacity={0.7}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator size="small" color={COLORS.surface} />
                                    ) : (
                                        <>
                                            <Feather name="check" size={18} color={COLORS.surface} />
                                            <Text style={styles.confirmButtonText}>Sí, Cambiar</Text>
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
    confirmButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: SPACING.lg - 2,
        borderRadius: RADIUS.sm + 2,
        backgroundColor: COLORS.error, // Usamos color de error para acciones destructivas como esta
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
    },
    confirmButtonText: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.surface,
    },
    disabledButton: {
        opacity: 0.7,
    },
});
