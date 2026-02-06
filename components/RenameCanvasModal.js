import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/Theme';

export default function RenameCanvasModal({ visible, onClose, onRename, currentName }) {
    const [name, setName] = useState('');

    useEffect(() => {
        if (visible) {
            setName(currentName || '');
        }
    }, [visible, currentName]);

    const handleSave = () => {
        if (name.trim()) {
            onRename(name.trim());
            setName('');
        }
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <View style={styles.modalOverlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoidingView}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.header}>
                            <Text style={styles.modalTitle}>Renombrar Lienzo</Text>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Nuevo nombre</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nombre del lienzo"
                                placeholderTextColor={COLORS.placeholder}
                                value={name}
                                onChangeText={setName}
                                autoFocus={true}
                                selectTextOnFocus={true}
                            />
                        </View>

                        <View style={styles.buttonsContainer}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={onClose}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    styles.saveButton,
                                    !name.trim() && styles.disabledButton
                                ]}
                                onPress={handleSave}
                                disabled={!name.trim()}
                            >
                                <Text style={styles.saveButtonText}>Guardar</Text>
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
    saveButton: {
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
    saveButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: TYPOGRAPHY.size.base,
    },
});
