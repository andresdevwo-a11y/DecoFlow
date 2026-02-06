import React, { useState } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/Theme';

export default function CreateCanvasModal({ visible, onClose, onCreate }) {
    const [name, setName] = useState('');

    const handleCreate = () => {
        if (name.trim()) {
            onCreate(name.trim());
            setName('');
        }
    };

    const handleClose = () => {
        setName('');
        onClose();
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={handleClose}
            statusBarTranslucent={true}
        >
            <View style={styles.modalOverlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoidingView}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.header}>
                            <Text style={styles.modalTitle}>Nuevo Lienzo</Text>
                            <Text style={styles.modalSubtitle}>Crea un espacio para diseño libre</Text>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Nombre del lienzo</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej. Sala de estar, Proyecto 1..."
                                placeholderTextColor={COLORS.placeholder}
                                value={name}
                                onChangeText={setName}
                                autoFocus={true}
                            />
                        </View>

                        <View style={styles.buttonsContainer}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={handleClose}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    styles.createButton,
                                    !name.trim() && styles.disabledButton
                                ]}
                                onPress={handleCreate}
                                disabled={!name.trim()}
                            >
                                <Text style={styles.createButtonText}>Crear</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    keyboardAvoidingView: {
        width: '100%',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        padding: SPACING['2xl'],
        width: '100%',
        maxWidth: 400,
        ...SHADOWS.modal,
    },
    header: {
        marginBottom: SPACING.xl,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: TYPOGRAPHY.size['2xl'],
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: SPACING.xs,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: SPACING.xl,
    },
    label: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
        marginLeft: SPACING.xs,
    },
    input: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.lg,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        fontSize: TYPOGRAPHY.size.lg,
        color: COLORS.text,
    },
    buttonsContainer: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    button: {
        flex: 1,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: COLORS.background,
    },
    cancelButtonText: {
        color: COLORS.textSecondary,
        fontWeight: '600',
        fontSize: TYPOGRAPHY.size.base,
    },
    createButton: {
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        backgroundColor: COLORS.border,
        shadowOpacity: 0,
        elevation: 0,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: TYPOGRAPHY.size.base,
    },
});
