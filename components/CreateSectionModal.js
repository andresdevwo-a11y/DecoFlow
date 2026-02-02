import React, { useState } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/Theme';

const COLORS_LIST = [
    '#F97316', // Orange (Signature)
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#6B7280', // Gray
];

export default function CreateSectionModal({ visible, onClose, onCreate }) {
    const [sectionName, setSectionName] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS.primary);

    const handleCreate = () => {
        if (!sectionName.trim()) return;

        onCreate({
            name: sectionName,
            color: selectedColor
        });

        setSectionName('');
        setSelectedColor(COLORS.primary);
    };

    const handleClose = () => {
        setSectionName('');
        setSelectedColor(COLORS.primary);
        onClose();
    }

    return (
        <Modal
            animationType="slide"
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
                        <Text style={styles.modalTitle}>Nueva Sección</Text>

                        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Nombre</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej. Inventario"
                                    placeholderTextColor={COLORS.placeholder}
                                    value={sectionName}
                                    onChangeText={setSectionName}
                                    autoFocus={true}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Color</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
                                    {COLORS_LIST.map((color) => (
                                        <TouchableOpacity
                                            key={color}
                                            style={[
                                                styles.colorCircle,
                                                { backgroundColor: color },
                                                selectedColor === color && styles.selectedColorCircle
                                            ]}
                                            onPress={() => setSelectedColor(color)}
                                        >
                                            {selectedColor === color && (
                                                <Feather name="check" size={16} color={COLORS.surface} />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </ScrollView>

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
        backgroundColor: COLORS.overlay,
        justifyContent: 'center',
        padding: SPACING.xl,
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING['2xl'],
        maxHeight: '90%',
        ...SHADOWS.modal,
    },
    modalTitle: {
        fontSize: TYPOGRAPHY.size['3xl'],
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        marginBottom: SPACING['2xl'],
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: SPACING.xl,
    },
    label: {
        fontSize: TYPOGRAPHY.size.base,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
    },
    input: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
        borderRadius: RADIUS.sm,
        padding: SPACING.md,
        fontSize: TYPOGRAPHY.size.xl,
        color: COLORS.text,
    },
    colorRow: {
        flexDirection: 'row',
    },
    colorCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: SPACING.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedColorCircle: {
        borderWidth: 2,
        borderColor: COLORS.text,
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: SPACING.sm,
    },
    button: {
        flex: 1,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        marginRight: SPACING.md,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    cancelButtonText: {
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.weight.semibold,
        fontSize: TYPOGRAPHY.size.xl,
    },
    createButton: {
        backgroundColor: COLORS.primary,
    },
    disabledButton: {
        backgroundColor: COLORS.primaryDisabled,
    },
    createButtonText: {
        color: COLORS.surface,
        fontWeight: TYPOGRAPHY.weight.bold,
        fontSize: TYPOGRAPHY.size.xl,
    },
    keyboardAvoidingView: {
        width: '100%',
    },
    scrollContainer: {
        marginBottom: SPACING.md,
    },
});
