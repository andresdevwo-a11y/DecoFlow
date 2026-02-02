import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, SIZES } from '../constants/Theme';

export default function ConfirmationModal({
    visible,
    title = '¿Estás seguro?',
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    isDestructive = false
}) {

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
                            <View style={[styles.iconContainer,
                            { backgroundColor: isDestructive ? COLORS.errorLight : COLORS.primaryLight }
                            ]}>
                                <Feather
                                    name={isDestructive ? "alert-triangle" : "help-circle"}
                                    size={32}
                                    color={isDestructive ? COLORS.error : COLORS.primary}
                                />
                            </View>

                            <Text style={styles.title}>{title}</Text>

                            {message ? (
                                <Text style={styles.message}>
                                    {message}
                                </Text>
                            ) : null}

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={onCancel}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.cancelButtonText}>{cancelText}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.confirmButton, isDestructive && styles.destructiveButton]}
                                    onPress={onConfirm}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.confirmButtonText}>{confirmText}</Text>
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
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    title: {
        fontSize: TYPOGRAPHY.size['2xl'], // Reduced lightly to fit better if long
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
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.textSecondary,
    },
    confirmButton: {
        flex: 1,
        paddingVertical: SPACING.lg - 2,
        borderRadius: RADIUS.sm + 2,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    destructiveButton: {
        backgroundColor: COLORS.error,
    },
    confirmButtonText: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.surface,
    },
});
