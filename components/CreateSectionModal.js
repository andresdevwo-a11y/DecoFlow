import React, { useState } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/Theme';

export default function CreateSectionModal({ visible, onClose, onCreate }) {
    const [sectionName, setSectionName] = useState('');

    const handleCreate = () => {
        if (!sectionName.trim()) return;

        onCreate({
            name: sectionName.trim(),
            color: COLORS.primary // Default color since selection is removed
        });

        setSectionName('');
    };

    const handleClose = () => {
        setSectionName('');
        onClose();
    }

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
                            <Text style={styles.modalTitle}>Nueva Sección</Text>
                            <Text style={styles.modalSubtitle}>Organiza tus productos en categorías</Text>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Nombre de la sección</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej. Inventario, Ventas..."
                                placeholderTextColor={COLORS.placeholder}
                                value={sectionName}
                                onChangeText={setSectionName}
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
                                    !sectionName.trim() && styles.disabledButton
                                ]}
                                onPress={handleCreate}
                                disabled={!sectionName.trim()}
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
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // Softer overlay
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
        borderRadius: RADIUS.xl, // Increased radius for modern look
        padding: SPACING['2xl'],
        width: '100%',
        maxWidth: 400,
        ...SHADOWS.modal, // Use soft large shadow
        elevation: 10,
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
        borderRadius: RADIUS.lg, // Pills
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: COLORS.background,
        // No border for cleaner look, just background
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
