import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, StyleSheet, ScrollView, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, SIZES } from '../constants/Theme';

export default function EditSectionModal({ visible, onClose, onSave, section }) {
    const [sectionName, setSectionName] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        if (section) {
            setSectionName(section.name || '');
            setSelectedImage(section.image || null);
        }
    }, [section, visible]);

    const handleSave = () => {
        if (!sectionName.trim()) return;

        onSave({
            ...section,
            name: sectionName.trim(),
            image: selectedImage
            // Color and Icon are preserved from original if needed, or ignored if completely deprecated by UI
        });
        onClose();
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    return (
        <Modal
            animationType="fade" // Fade is often smoother for centers
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
                            <Text style={styles.modalTitle}>Editar Sección</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Feather name="x" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                            {/* Image Picker Section - Prominent & Centered */}
                            <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={styles.imagePickerContainer}>
                                <View style={styles.imagePreviewWrapper}>
                                    {selectedImage ? (
                                        <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                                    ) : (
                                        <View style={[styles.placeholderImage, { backgroundColor: section?.color ? `${section.color}15` : COLORS.primaryLight }]}>
                                            <Feather name={section?.icon || 'image'} size={40} color={section?.color || COLORS.primary} />
                                        </View>
                                    )}
                                    <View style={styles.editIconBadge}>
                                        <Feather name="camera" size={14} color="#FFF" />
                                    </View>
                                </View>
                                <Text style={styles.changeImageText}>Cambiar imagen</Text>
                            </TouchableOpacity>


                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Nombre de la sección</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nombre"
                                    placeholderTextColor={COLORS.placeholder}
                                    value={sectionName}
                                    onChangeText={setSectionName}
                                />
                            </View>

                        </ScrollView>

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
                                    !sectionName.trim() && styles.disabledButton
                                ]}
                                onPress={handleSave}
                                disabled={!sectionName.trim()}
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
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
        position: 'relative',
    },
    modalTitle: {
        fontSize: TYPOGRAPHY.size['2xl'],
        fontWeight: '700',
        color: COLORS.text,
        textAlign: 'center',
    },
    closeBtn: {
        position: 'absolute',
        right: 0,
        top: 0,
        padding: 4,
    },
    scrollContent: {
        alignItems: 'center',
    },
    imagePickerContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    imagePreviewWrapper: {
        width: 100,
        height: 100,
        borderRadius: RADIUS.xl, // Squircle-like
        // shadowColor: "#000",
        // shadowOffset: {
        //     width: 0,
        //     height: 4,
        // },
        // shadowOpacity: 0.1,
        // shadowRadius: 8,
        // elevation: 5,
        position: 'relative',
        backgroundColor: COLORS.surface,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: RADIUS.xl,
        resizeMode: 'cover',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        borderRadius: RADIUS.xl,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
    },
    editIconBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: COLORS.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.surface,
    },
    changeImageText: {
        marginTop: SPACING.sm,
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.primary,
        fontWeight: '600',
    },
    inputContainer: {
        width: '100%',
        marginBottom: SPACING.lg,
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
        width: '100%',
    },
    buttonsContainer: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginTop: SPACING.sm,
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
