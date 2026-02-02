import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, SIZES } from '../constants/Theme';

/**
 * Reusable bottom sheet for image source selection (camera/gallery).
 * Used by EditProductModal.
 */
const ImagePickerSheet = React.memo(({ visible, onClose, onTakePhoto, onPickImage, onPickFromFiles, title = "Seleccionar imagen" }) => {
    const insets = useSafeAreaInsets();

    if (!visible) return null;

    const handleTakePhoto = () => {
        onClose();
        onTakePhoto();
    };

    const handlePickImage = () => {
        onClose();
        onPickImage();
    };

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

                    <View style={[styles.content, { paddingBottom: insets.bottom + SPACING.xl }]}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={[styles.iconContainer, { backgroundColor: COLORS.primaryLight }]}>
                                <Feather name="camera" size={24} color={COLORS.primary} />
                            </View>
                            <View style={styles.headerTextContainer}>
                                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                                <Text style={styles.subtitle}>Fuente de la imagen</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Feather name="x" size={22} color={COLORS.textMuted} />
                            </TouchableOpacity>
                        </View>

                        {/* Options List */}
                        <View style={styles.optionsList}>
                            <TouchableOpacity style={styles.optionItem} onPress={handleTakePhoto} activeOpacity={0.7}>
                                <View style={[styles.optionIcon, { backgroundColor: COLORS.primaryLight }]}>
                                    <Feather name="camera" size={20} color={COLORS.primary} />
                                </View>
                                <View style={styles.optionTextContainer}>
                                    <Text style={styles.optionLabel}>Tomar Foto</Text>
                                    <Text style={styles.optionDesc}>Usar la cámara del dispositivo</Text>
                                </View>
                                <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.optionItem} onPress={() => { onClose(); onPickFromFiles && onPickFromFiles(); }} activeOpacity={0.7}>
                                <View style={[styles.optionIcon, { backgroundColor: '#F3E8FF' }]}>
                                    <Feather name="folder" size={20} color="#9333EA" />
                                </View>
                                <View style={styles.optionTextContainer}>
                                    <Text style={styles.optionLabel}>Archivos</Text>
                                    <Text style={styles.optionDesc}>Importar desde archivos locales</Text>
                                </View>
                                <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.optionItem} onPress={handlePickImage} activeOpacity={0.7}>
                                <View style={[styles.optionIcon, { backgroundColor: COLORS.background }]}>
                                    <Feather name="image" size={20} color={COLORS.textSecondary} />
                                </View>
                                <View style={styles.optionTextContainer}>
                                    <Text style={styles.optionLabel}>Galería</Text>
                                    <Text style={styles.optionDesc}>Elegir una foto existente</Text>
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
                                    <Text style={styles.optionDesc}>Cerrar sin seleccionar</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
});

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

export default ImagePickerSheet;
