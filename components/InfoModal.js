import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, SIZES } from '../constants/Theme';

export default function InfoModal({ visible, title, message, onClose, type = 'info' }) {

    // Determine style based on type
    let iconName = 'info';
    let iconColor = COLORS.primary;
    let iconBg = COLORS.primaryLight;

    if (type === 'success') {
        iconName = 'check-circle';
        iconColor = COLORS.success;
        iconBg = COLORS.successLight;
    } else if (type === 'error') {
        iconName = 'alert-circle';
        iconColor = COLORS.error;
        iconBg = COLORS.errorLight;
    }

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback onPress={() => { }}>
                        <View style={styles.modalContainer}>
                            <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
                                <Feather name={iconName} size={32} color={iconColor} />
                            </View>

                            <Text style={styles.title}>{title}</Text>

                            {message ? (
                                <Text style={styles.message}>
                                    {message}
                                </Text>
                            ) : null}

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={styles.button}
                                    onPress={onClose}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.buttonText}>Aceptar</Text>
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
        maxWidth: 320,
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
        fontSize: TYPOGRAPHY.size['2xl'],
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
        marginBottom: SPACING.xl,
    },
    buttonContainer: {
        width: '100%',
    },
    button: {
        width: '100%',
        paddingVertical: SPACING.lg - 2,
        borderRadius: RADIUS.sm + 2,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.surface,
    },
});
