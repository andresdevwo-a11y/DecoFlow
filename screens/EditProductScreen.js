import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SIZES, SHADOWS } from '../constants/Theme';
import { useAlert } from '../context/AlertContext';
import Header from '../components/Header';
import ImagePickerSheet from '../components/ImagePickerSheet';
import * as DocumentPicker from 'expo-document-picker';

export default function EditProductScreen({ onBack, onSave, product }) {
    const insets = useSafeAreaInsets();
    const { showAlert, showConfirm } = useAlert();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [rentPrice, setRentPrice] = useState('');
    const [images, setImages] = useState({
        primary: null,
        secondary1: null,
        secondary2: null
    });
    const [activeImageSlot, setActiveImageSlot] = useState(null);
    const [focusedField, setFocusedField] = useState(null);
    const [showImageSheet, setShowImageSheet] = useState(false);

    useEffect(() => {
        if (product) {
            setName(product.name || '');
            setDescription(product.description || '');
            setPrice(product.price ? String(product.price) : '');
            setRentPrice(product.rentPrice ? String(product.rentPrice) : '');
            setImages({
                primary: product.image || null,
                secondary1: product.imageSecondary1 || null,
                secondary2: product.imageSecondary2 || null
            });
        }
    }, [product]);

    const hasChanges = () => {
        if (!product) return false;
        return (
            name !== (product.name || '') ||
            description !== (product.description || '') ||
            price !== (product.price ? String(product.price) : '') ||
            rentPrice !== (product.rentPrice ? String(product.rentPrice) : '') ||
            images.primary !== (product.image || null) ||
            images.secondary1 !== (product.imageSecondary1 || null) ||
            images.secondary2 !== (product.imageSecondary2 || null)
        );
    };

    const isFormValid = name.trim().length > 0;
    const canSave = hasChanges() && isFormValid;

    const openImagePicker = (slot) => {
        setActiveImageSlot(slot);
        setShowImageSheet(true);
    };

    const updateImage = (uri) => {
        if (activeImageSlot) {
            setImages(prev => ({ ...prev, [activeImageSlot]: uri }));
        }
    };

    const removeImage = (slot) => {
        // Check if image existed originally in DB
        const originalImages = {
            primary: product?.image || null,
            secondary1: product?.imageSecondary1 || null,
            secondary2: product?.imageSecondary2 || null
        };

        const doRemove = () => {
            setImages(prev => ({ ...prev, [slot]: null }));
        };

        if (originalImages[slot]) {
            // Show confirmation for saved images
            showConfirm({
                title: 'Eliminar imagen',
                message: '¿Estás seguro de que deseas eliminar esta imagen? Se eliminará permanentemente al guardar.',
                confirmText: 'Eliminar',
                cancelText: 'Cancelar',
                isDestructive: true,
                onConfirm: doRemove
            });
        } else {
            // Remove directly if it's a new image
            doRemove();
        }
    };

    const handleTakePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            showAlert("error", "Permiso denegado", "Se necesita permiso para acceder a la cámara.");
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            quality: 1,
        });

        if (!result.canceled) {
            updateImage(result.assets[0].uri);
        }
    };

    const handlePickFromGallery = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 1,
        });

        if (!result.canceled) {
            updateImage(result.assets[0].uri);
        }
    };

    const handlePickFromFiles = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                updateImage(result.assets[0].uri);
            }
        } catch (err) {
            console.log('Error picking document', err);
        }
    };

    const handleSave = () => {
        if (!isFormValid) {
            showAlert("error", "Faltan datos", "Por favor ingresa el nombre del producto.");
            return;
        }

        onSave({
            ...product,
            name,
            description,
            price,
            rentPrice,
            image: images.primary,
            imageSecondary1: images.secondary1,
            imageSecondary2: images.secondary2
        });
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <Header title="Editar producto" onBack={onBack} />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Image Upload */}
                    <View style={styles.imageSection}>
                        <Text style={styles.sectionTitle}>Imágenes del producto</Text>

                        {/* Primary Image */}
                        <View style={styles.primaryImageContainer}>
                            <TouchableOpacity
                                onPress={() => openImagePicker('primary')}
                                style={[styles.imageUploadMain, styles.shadow]}
                            >
                                {images.primary ? (
                                    <Image source={{ uri: images.primary }} style={styles.imagePreviewMain} />
                                ) : (
                                    <View style={styles.imagePlaceholderMain}>
                                        <Feather name="camera" size={40} color={COLORS.primary} />
                                        <Text style={styles.uploadTextMain}>Foto Principal</Text>
                                    </View>
                                )}
                                <View style={styles.editBadge}>
                                    <Feather name="edit-2" size={12} color="white" />
                                </View>
                                {images.primary && (
                                    <TouchableOpacity
                                        style={styles.deleteBadge}
                                        onPress={() => removeImage('primary')}
                                    >
                                        <Feather name="x" size={14} color="white" />
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Secondary Images Row */}
                        <View style={styles.secondaryImagesRow}>
                            {/* Secondary 1 */}
                            <View style={styles.secondaryImageWrapper}>
                                <TouchableOpacity
                                    onPress={() => openImagePicker('secondary1')}
                                    style={[styles.imageUploadSecondary, styles.shadow]}
                                >
                                    {images.secondary1 ? (
                                        <Image source={{ uri: images.secondary1 }} style={styles.imagePreviewSecondary} />
                                    ) : (
                                        <View style={styles.imagePlaceholderSecondary}>
                                            <Feather name="plus" size={24} color={COLORS.textMuted} />
                                            <Text style={styles.uploadTextSecondary}>Opcional 1</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                {images.secondary1 && (
                                    <TouchableOpacity
                                        style={styles.deleteBadgeSecondary}
                                        onPress={() => removeImage('secondary1')}
                                    >
                                        <Feather name="x" size={12} color="white" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Secondary 2 */}
                            <View style={styles.secondaryImageWrapper}>
                                <TouchableOpacity
                                    onPress={() => openImagePicker('secondary2')}
                                    style={[styles.imageUploadSecondary, styles.shadow]}
                                >
                                    {images.secondary2 ? (
                                        <Image source={{ uri: images.secondary2 }} style={styles.imagePreviewSecondary} />
                                    ) : (
                                        <View style={styles.imagePlaceholderSecondary}>
                                            <Feather name="plus" size={24} color={COLORS.textMuted} />
                                            <Text style={styles.uploadTextSecondary}>Opcional 2</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                {images.secondary2 && (
                                    <TouchableOpacity
                                        style={styles.deleteBadgeSecondary}
                                        onPress={() => removeImage('secondary2')}
                                    >
                                        <Feather name="x" size={12} color="white" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Name Input */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Nombre del producto <Text style={styles.required}>*</Text></Text>
                        <View style={[
                            styles.inputWrapper,
                            focusedField === 'name' && styles.inputWrapperFocused
                        ]}>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Ej. Cámara Canon EOS"
                                placeholderTextColor={COLORS.placeholder}
                                onFocus={() => setFocusedField('name')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>
                    </View>

                    {/* Price Input */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Precio de venta</Text>
                        <View style={[
                            styles.inputWrapper,
                            styles.row,
                            focusedField === 'price' && styles.inputWrapperFocused
                        ]}>
                            <View style={styles.currencyPrefix}>
                                <Text style={styles.currencySymbol}>$</Text>
                            </View>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                value={price}
                                onChangeText={setPrice}
                                placeholder="0.00"
                                placeholderTextColor={COLORS.placeholder}
                                keyboardType="numeric"
                                onFocus={() => setFocusedField('price')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>
                    </View>

                    {/* Rent Price Input */}
                    <View style={styles.fieldContainer}>
                        <View style={styles.labelRow}>
                            <Text style={styles.label}>Precio de alquiler</Text>
                            <Text style={styles.optionalLabel}>(Opcional)</Text>
                        </View>
                        <View style={[
                            styles.inputWrapper,
                            styles.row,
                            focusedField === 'rentPrice' && styles.inputWrapperFocused
                        ]}>
                            <View style={styles.currencyPrefix}>
                                <Text style={styles.currencySymbol}>$</Text>
                            </View>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                value={rentPrice}
                                onChangeText={setRentPrice}
                                placeholder="0.00"
                                placeholderTextColor={COLORS.placeholder}
                                keyboardType="numeric"
                                onFocus={() => setFocusedField('rentPrice')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>
                    </View>

                    {/* Description Input */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Descripción</Text>
                        <View style={[
                            styles.inputWrapper,
                            focusedField === 'description' && styles.inputWrapperFocused
                        ]}>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Añade detalles sobre el producto..."
                                placeholderTextColor={COLORS.placeholder}
                                multiline
                                numberOfLines={4}
                                onFocus={() => setFocusedField('description')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>
                    </View>

                    {/* Spacing for bottom button */}
                    <View style={{ height: 100 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Fixed Bottom Footer */}
            <View style={[
                styles.footer,
                {
                    height: SIZES.navBarHeight + insets.bottom,
                    paddingBottom: insets.bottom,
                    paddingHorizontal: SPACING.lg,
                    justifyContent: 'center',
                }
            ]}>
                <TouchableOpacity
                    style={[styles.saveButton, !canSave && { backgroundColor: COLORS.primaryDisabled }]}
                    onPress={handleSave}
                    disabled={!canSave}
                >
                    <Text style={styles.saveButtonText}>Guardar cambios</Text>
                </TouchableOpacity>
            </View>

            <ImagePickerSheet
                visible={showImageSheet}
                onClose={() => setShowImageSheet(false)}
                onTakePhoto={handleTakePhoto}
                onPickImage={handlePickFromGallery}
                onPickFromFiles={handlePickFromFiles}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollContent: {
        padding: SPACING.lg,
    },
    imageSection: {
        marginBottom: SPACING.xl,
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.size.base,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.text,
        marginBottom: SPACING.lg,
        alignSelf: 'flex-start',
    },
    primaryImageContainer: {
        marginBottom: SPACING.md,
    },
    imageUploadMain: {
        width: 200,
        height: 200,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed', // Dashed for "upload" feel
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    imagePreviewMain: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imagePlaceholderMain: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadTextMain: {
        marginTop: SPACING.sm,
        color: COLORS.primary,
        fontSize: TYPOGRAPHY.size.base,
        fontWeight: TYPOGRAPHY.weight.medium,
    },
    editBadge: {
        position: 'absolute',
        bottom: SPACING.sm,
        right: SPACING.sm,
        backgroundColor: COLORS.primary,
        padding: 6,
        borderRadius: RADIUS.full,
        zIndex: 10,
    },
    deleteBadge: {
        position: 'absolute',
        top: SPACING.sm,
        right: SPACING.sm,
        backgroundColor: 'rgba(0,0,0,0.6)',
        width: 26,
        height: 26,
        borderRadius: RADIUS.full,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    secondaryImageWrapper: {
        position: 'relative',
    },
    deleteBadgeSecondary: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: 'rgba(0,0,0,0.6)',
        width: 22,
        height: 22,
        borderRadius: RADIUS.full,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    secondaryImagesRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: SPACING.lg,
    },
    imageUploadSecondary: {
        width: 100,
        height: 100,
        backgroundColor: COLORS.background, // Slightly darker to differentiate
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    imagePreviewSecondary: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imagePlaceholderSecondary: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadTextSecondary: {
        marginTop: 4,
        color: COLORS.textMuted,
        fontSize: 10,
        fontWeight: TYPOGRAPHY.weight.medium,
    },
    shadow: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 2,
    },
    fieldContainer: {
        marginBottom: SPACING.xl,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.xs,
    },
    label: {
        fontSize: TYPOGRAPHY.size.base,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    optionalLabel: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textMuted,
        fontWeight: TYPOGRAPHY.weight.normal,
    },
    required: {
        color: COLORS.error,
        marginLeft: 4,
    },
    inputWrapper: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
        minHeight: SIZES.inputHeight,
        justifyContent: 'center',
    },
    inputWrapperFocused: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.surface,
    },
    input: {
        paddingVertical: 12,
        paddingHorizontal: SPACING.md,
        fontSize: TYPOGRAPHY.size.base,
        color: COLORS.text,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    currencyPrefix: {
        paddingLeft: SPACING.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    currencySymbol: {
        fontSize: TYPOGRAPHY.size.base,
        color: COLORS.textMuted,
        fontWeight: TYPOGRAPHY.weight.medium,
    },
    textArea: {
        minHeight: 120,
        textAlignVertical: 'top',
        paddingTop: SPACING.md,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        ...SHADOWS.navBar,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        paddingHorizontal: SPACING.xl,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.medium,
    }
});
