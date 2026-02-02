import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, TYPOGRAPHY, RADIUS, SPACING, SHADOWS, SIZES } from '../../../constants/Theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ImageSourceModal({ visible, onClose, onSelect }) {
    const insets = useSafeAreaInsets();

    const handleFilePick = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/png', 'image/jpeg', 'image/jpg'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];
                // Return object with type 'file' and details
                onSelect({
                    type: 'file',
                    uri: asset.uri,
                    name: asset.name,
                    mimeType: asset.mimeType,
                    size: asset.size
                });
            }
        } catch (error) {
            console.error('Error picking file:', error);
            // Optionally notify parent of error or just ignore
            onClose(); // Close modal on error or just let user try again? 
            // Better to keep modal open or close it? 
            // If we use onSelect, typically the modal closes in parent.
            // If error, we might want to keep it open. 
            // For now, let's just log and do nothing (modal stays open) or close on success.
        }
    };

    if (!visible) return null;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={styles.dismissArea}
                    activeOpacity={1}
                    onPress={onClose}
                />

                <View style={styles.modalContainer}>
                    {/* Pull Handle */}
                    <View style={styles.handleContainer}>
                        <View style={styles.handle} />
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={true}
                        contentContainerStyle={[
                            styles.content,
                            { paddingBottom: insets.bottom + SPACING.xl }
                        ]}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={[styles.iconContainer, { backgroundColor: COLORS.primaryLight }]}>
                                <Feather name="image" size={24} color={COLORS.primary} />
                            </View>
                            <View style={styles.headerTextContainer}>
                                <Text style={styles.title} numberOfLines={1}>Agregar Imagen</Text>
                                <Text style={styles.subtitle}>Selecciona una fuente</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Feather name="x" size={22} color={COLORS.textMuted} />
                            </TouchableOpacity>
                        </View>

                        {/* Options List */}
                        <View style={styles.optionsList}>
                            <TouchableOpacity style={styles.optionItem} onPress={() => onSelect('products')} activeOpacity={0.7}>
                                <View style={[styles.optionIcon, { backgroundColor: COLORS.primaryLight }]}>
                                    <Feather name="package" size={20} color={COLORS.primary} />
                                </View>
                                <View style={styles.optionTextContainer}>
                                    <Text style={styles.optionLabel}>Desde Mis Productos</Text>
                                    <Text style={styles.optionDesc}>Cargar imágenes guardadas</Text>
                                </View>
                                <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.optionItem} onPress={handleFilePick} activeOpacity={0.7}>
                                <View style={[styles.optionIcon, { backgroundColor: '#F3E8FF' }]}>
                                    <Feather name="folder" size={20} color="#9333EA" />
                                </View>
                                <View style={styles.optionTextContainer}>
                                    <Text style={styles.optionLabel}>Archivos</Text>
                                    <Text style={styles.optionDesc}>Importar desde archivos locales</Text>
                                </View>
                                <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.optionItem} onPress={() => onSelect('gallery')} activeOpacity={0.7}>
                                <View style={[styles.optionIcon, { backgroundColor: '#EFF6FF' }]}>
                                    <Feather name="image" size={20} color="#3B82F6" />
                                </View>
                                <View style={styles.optionTextContainer}>
                                    <Text style={styles.optionLabel}>Galería de Fotos</Text>
                                    <Text style={styles.optionDesc}>Buscar fotos en el carrete</Text>
                                </View>
                                <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.optionItem} onPress={() => onSelect('camera')} activeOpacity={0.7}>
                                <View style={[styles.optionIcon, { backgroundColor: '#ECFDF5' }]}>
                                    <Feather name="camera" size={20} color="#10B981" />
                                </View>
                                <View style={styles.optionTextContainer}>
                                    <Text style={styles.optionLabel}>Tomar Foto</Text>
                                    <Text style={styles.optionDesc}>Usar la cámara directamente</Text>
                                </View>
                                <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            <TouchableOpacity style={[styles.optionItem, styles.cancelItem]} onPress={onClose} activeOpacity={0.7}>
                                <View style={[styles.optionIcon, { backgroundColor: COLORS.errorLight }]}>
                                    <Feather name="x" size={20} color={COLORS.error} />
                                </View>
                                <View style={styles.optionTextContainer}>
                                    <Text style={[styles.optionLabel, { color: COLORS.error }]}>Cancelar</Text>
                                    <Text style={styles.optionDesc}>Cerrar sin agregar nada</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: COLORS.overlay,
        justifyContent: 'flex-end',
    },
    dismissArea: {
        flex: 1,
    },
    modalContainer: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        maxHeight: SCREEN_HEIGHT * 0.85, // Limit height
        ...SHADOWS.sheet,
    },
    handleContainer: {
        width: '100%',
        alignItems: 'center',
        paddingTop: SPACING.md,
        paddingBottom: SPACING.sm,
    },
    handle: {
        width: SIZES.dragIndicatorWidth || 40,
        height: SIZES.dragIndicatorHeight || 4,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.border,
    },
    content: {
        padding: SPACING.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING['2xl'],
    },
    iconContainer: {
        width: 54,
        height: 54,
        borderRadius: RADIUS.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.lg,
    },
    headerTextContainer: {
        flex: 1,
    },
    title: {
        fontSize: TYPOGRAPHY.size['2xl'],
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: TYPOGRAPHY.size.base,
        color: COLORS.textMuted,
        fontWeight: TYPOGRAPHY.weight.medium,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionsList: {
        gap: SPACING.sm,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.md,
    },
    optionIcon: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.lg,
    },
    optionTextContainer: {
        flex: 1,
    },
    optionLabel: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.text,
        marginBottom: 2,
    },
    optionDesc: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textMuted,
    },
    cancelItem: {
        marginTop: SPACING.sm,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: SPACING.md,
        marginHorizontal: SPACING.xs,
    },
});

