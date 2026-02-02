import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, StyleSheet, ScrollView, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, SIZES } from '../constants/Theme';

const COLORS_LIST = [
    '#F97316', '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
    '#6366F1', '#8B5CF6', '#EC4899', '#6B7280',
];

const ICONS_LIST = [
    'folder', 'briefcase', 'book', 'star', 'heart',
    'code', 'archive', 'music', 'image', 'video',
    'coffee', 'gift', 'home', 'settings', 'lock'
];

export default function EditSectionModal({ visible, onClose, onSave, section }) {
    const [sectionName, setSectionName] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS.primary);
    const [selectedIcon, setSelectedIcon] = useState('folder');
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        if (section) {
            setSectionName(section.name || '');
            setSelectedColor(section.color || COLORS.primary);
            setSelectedIcon(section.icon || 'folder');
            setSelectedImage(section.image || null);
        }
    }, [section, visible]);

    const handleSave = () => {
        if (!sectionName.trim()) return;

        onSave({
            ...section,
            name: sectionName,
            color: selectedColor,
            icon: selectedIcon,
            image: selectedImage
        });
        onClose();
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    return (
        <Modal
            animationType="slide"
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
                        <Text style={styles.modalTitle}>Editar Sección</Text>

                        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Nombre</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej. Documentos"
                                    placeholderTextColor={COLORS.placeholder}
                                    value={sectionName}
                                    onChangeText={setSectionName}
                                    autoFocus={false}
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

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Ícono o Imagen</Text>

                                <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                                    <View style={styles.iconPreviewContainer}>
                                        {selectedImage ? (
                                            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                                        ) : (
                                            <Feather name={selectedIcon} size={40} color={selectedColor} />
                                        )}
                                        <View style={styles.editIconOverlay}>
                                            <Feather name="camera" size={12} color={COLORS.surface} />
                                        </View>
                                    </View>
                                </TouchableOpacity>

                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconRow}>
                                    {ICONS_LIST.map((icon) => (
                                        <TouchableOpacity
                                            key={icon}
                                            style={[
                                                styles.iconItem,
                                                selectedIcon === icon && !selectedImage && styles.selectedIconItem
                                            ]}
                                            onPress={() => {
                                                setSelectedIcon(icon);
                                                setSelectedImage(null);
                                            }}
                                        >
                                            <Feather
                                                name={icon}
                                                size={SIZES.iconLg}
                                                color={(selectedIcon === icon && !selectedImage) ? COLORS.primary : COLORS.textMuted}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
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
    iconPreviewContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.md,
        alignSelf: 'center',
        width: 80,
        height: 80,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    editIconOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: SPACING.xs,
        borderTopLeftRadius: RADIUS.sm,
    },
    iconRow: {
        flexDirection: 'row',
    },
    iconItem: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.sm,
        marginRight: SPACING.sm,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    selectedIconItem: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primaryLight,
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
    saveButton: {
        backgroundColor: COLORS.primary,
    },
    disabledButton: {
        backgroundColor: COLORS.primaryDisabled,
    },
    saveButtonText: {
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
