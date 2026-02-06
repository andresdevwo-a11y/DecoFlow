import React, { useState, useRef, useCallback } from 'react';
import { View, Text, Image, Modal, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, FlatList, Dimensions, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, SIZES } from '../constants/Theme';

export default function ProductDetailsModal({ visible, onClose, product, onUpdateProduct }) {
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // Price Editing State
    const [editingPrices, setEditingPrices] = useState(false);
    const [tempPrices, setTempPrices] = useState({
        salePrice: '',
        rentPrice: ''
    });

    React.useEffect(() => {
        if (product) {
            setTempPrices({
                salePrice: product.price || product.salePrice ? String(product.price || product.salePrice) : '',
                rentPrice: product.rentPrice || product.rentalPrice ? String(product.rentPrice || product.rentalPrice) : ''
            });
            setEditingPrices(false);
            setActiveImageIndex(0);
        }
    }, [product]);

    React.useEffect(() => {
        if (!visible && product) {
            setTempPrices({
                salePrice: product.price || product.salePrice ? String(product.price || product.salePrice) : '',
                rentPrice: product.rentPrice || product.rentalPrice ? String(product.rentPrice || product.rentalPrice) : ''
            });
        }
    }, [visible, product]);

    const handleOpenPriceEditor = () => {
        setTempPrices({
            salePrice: tempPrices.salePrice || (product.price || product.salePrice ? String(product.price || product.salePrice) : ''),
            rentPrice: tempPrices.rentPrice || (product.rentPrice || product.rentalPrice ? String(product.rentPrice || product.rentalPrice) : '')
        });
        setEditingPrices(true);
    };

    const handleSaveTempPrices = () => {
        const saleNumeric = parseFloat(tempPrices.salePrice.replace(/[^0-9.]/g, ''));
        const rentNumeric = parseFloat(tempPrices.rentPrice.replace(/[^0-9.]/g, ''));

        setTempPrices({
            salePrice: isNaN(saleNumeric) ? '0' : String(saleNumeric),
            rentPrice: isNaN(rentNumeric) ? '0' : String(rentNumeric)
        });
        setEditingPrices(false);
    };

    const handleCancelPriceEdit = () => {
        setTempPrices({
            salePrice: product.price || product.salePrice ? String(product.price || product.salePrice) : '',
            rentPrice: product.rentPrice || product.rentalPrice ? String(product.rentPrice || product.rentalPrice) : ''
        });
        setEditingPrices(false);
    };

    const CAROUSEL_IMAGE_WIDTH = Dimensions.get('window').width - 64; // Account for modal padding

    const productImages = product ? [
        product.image,
        product.imageSecondary1,
        product.imageSecondary2
    ].filter(img => img !== null && img !== undefined) : [];

    const onScrollEnd = useCallback((e) => {
        const contentOffsetX = e.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffsetX / CAROUSEL_IMAGE_WIDTH);
        setActiveImageIndex(index);
    }, [CAROUSEL_IMAGE_WIDTH]);

    if (!product) return null;

    const handleShare = () => {
        setShareModalVisible(true);
    };

    const handleOptionSelect = async (options) => {
        setShareModalVisible(false);
        setTimeout(() => {
            generateAndSharePDF(options);
        }, 100);
    };

    const generateAndSharePDF = async ({ showSale, showRent }) => {
        setIsSharing(true);
        try {
            const salePrice = tempPrices.salePrice ? parseFloat(tempPrices.salePrice.replace(/[^0-9.]/g, '')) : (product.salePrice || product.price);
            const rentPrice = tempPrices.rentPrice ? parseFloat(tempPrices.rentPrice.replace(/[^0-9.]/g, '')) : (product.rentalPrice || product.rentPrice);

            // Format currency helper
            const formatCurrency = (amount) => {
                return new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(amount || 0);
            };

            const salePriceFormatted = formatCurrency(salePrice);
            const rentPriceFormatted = formatCurrency(rentPrice);

            // Fetch base64 images
            const processImage = async (imageUri) => {
                if (!imageUri) return null;
                try {
                    if (imageUri.startsWith('http')) {
                        return imageUri;
                    } else {
                        const base64 = await FileSystem.readAsStringAsync(imageUri, {
                            encoding: 'base64',
                        });
                        return `data:image/jpeg;base64,${base64}`;
                    }
                } catch (imgError) {
                    console.warn('Error processing image for PDF:', imgError);
                    return imageUri;
                }
            };

            const imageSrcs = await Promise.all(productImages.map(processImage));
            const currentDate = new Date().toLocaleDateString('es-CO', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            const htmlContent = `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1a1a1a; padding: 24px; background-color: #f8f9fa; }
                        .card { background: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); padding: 32px; max-width: 100%; }
                        .name-section { text-align: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid ${COLORS.primary}20; }
                        .brand { font-size: 11px; color: #999; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 10px; }
                        .product-name { font-size: 32px; font-weight: 800; color: #1a1a1a; margin: 0; line-height: 1.2; }
                        .price-section { display: flex; justify-content: center; flex-wrap: wrap; gap: 16px; margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid #eee; }
                        .price-badge { background: linear-gradient(135deg, ${COLORS.primary}18 0%, ${COLORS.primary}08 100%); border: 1px solid ${COLORS.primary}35; border-radius: 14px; padding: 18px 28px; text-align: center; min-width: 160px; }
                        .price-badge.rent { background: linear-gradient(135deg, #6366f118 0%, #6366f108 100%); border: 1px solid #6366f135; }
                        .price-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #666; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; gap: 6px; }
                        .price-value { font-size: 26px; font-weight: 700; color: ${COLORS.primary}; }
                        .price-badge.rent .price-value { color: #6366f1; }
                        .images-section { margin-bottom: 28px; }
                        .images-stack { display: flex; flex-direction: column; gap: 16px; }
                        .image-container { background: #f8f8f8; border-radius: 12px; overflow: hidden; text-align: center; padding: 12px; border: 1px solid #eee; }
                        .image-container img { width: 100%; max-width: 100%; height: auto; max-height: 400px; object-fit: contain; display: block; margin: 0 auto; border-radius: 8px; }
                        .description-section { background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #eee; page-break-inside: avoid; }
                        .description-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin-bottom: 12px; font-weight: 600; }
                        .description-text { font-size: 15px; line-height: 1.7; color: #444; text-align: left; margin: 0; }
                        .footer { text-align: center; padding-top: 16px; border-top: 1px solid #eee; }
                        .footer-text { font-size: 11px; color: #aaa; letter-spacing: 0.5px; }
                        .footer-brand { font-weight: 600; color: ${COLORS.primary}; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div class="name-section">
                            <div class="brand">DECOFLOW</div>
                            <h1 class="product-name">${product.name}</h1>
                        </div>
                        <div class="price-section">
                            ${showSale ? `<div class="price-badge"><div class="price-label">💰 Precio de Venta</div><div class="price-value">${salePriceFormatted}</div></div>` : ''}
                            ${showRent ? `<div class="price-badge rent"><div class="price-label">🏷️ Precio de Alquiler</div><div class="price-value">${rentPriceFormatted}</div></div>` : ''}
                        </div>
                        ${imageSrcs.filter(Boolean).length > 0 ? `<div class="images-section"><div class="images-stack">${imageSrcs.filter(Boolean).map((src, index) => `<div class="image-container"><img src="${src}" alt="${product.name} - Imagen ${index + 1}" /></div>`).join('')}</div></div>` : ''}
                        ${product.description ? `<div class="description-section"><p class="description-title">📝 Descripción</p><p class="description-text">${product.description}</p></div>` : ''}
                        <div class="footer"><p class="footer-text">Generado el ${currentDate} • <span class="footer-brand">DECOFLOW</span></p></div>
                    </div>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false });
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: `Compartir ${product.name}` });
            } else {
                Alert.alert('Error', 'Compartir no está disponible en este dispositivo');
            }
        } catch (error) {
            console.error('Error sharing PDF:', error);
            Alert.alert('Error', 'Hubo un problema al generar el PDF');
        } finally {
            setIsSharing(false);
        }
    };

    const getDisplayPrices = () => {
        const originalSale = parseFloat(product.salePrice || product.price) || 0;
        const originalRent = parseFloat(product.rentalPrice || product.rentPrice) || 0;

        const parsePrice = (str) => {
            const num = parseFloat(String(str).replace(/[^0-9.]/g, ''));
            return isNaN(num) ? 0 : num;
        };

        const tempSaleVal = parsePrice(tempPrices.salePrice);
        const tempRentVal = parsePrice(tempPrices.rentPrice);

        const useTempSale = tempPrices.salePrice !== '';
        const useTempRent = tempPrices.rentPrice !== '';

        const salePrice = useTempSale ? tempSaleVal : originalSale;
        const rentPrice = useTempRent ? tempRentVal : originalRent;

        const isSaleEdited = useTempSale && (Math.abs(tempSaleVal - originalSale) > 0.1);
        const isRentEdited = useTempRent && (Math.abs(tempRentVal - originalRent) > 0.1);

        return {
            salePrice,
            rentPrice,
            isSaleEdited,
            isRentEdited
        };
    };

    return (
        <>
            <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose} statusBarTranslucent={true}>
                <View style={styles.overlay}>
                    <View style={styles.modalContainer}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.titleContainer}>
                                <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Feather name="x" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                            {/* Carousel */}
                            <View style={styles.carouselWrapper}>
                                {productImages.length > 0 ? (
                                    <>
                                        <FlatList
                                            data={productImages}
                                            horizontal
                                            pagingEnabled
                                            showsHorizontalScrollIndicator={false}
                                            onMomentumScrollEnd={onScrollEnd}
                                            keyExtractor={(_, index) => index.toString()}
                                            renderItem={({ item }) => (
                                                <Image source={{ uri: item }} style={[styles.carouselImage, { width: CAROUSEL_IMAGE_WIDTH }]} />
                                            )}
                                        />
                                        {productImages.length > 1 && (
                                            <View style={styles.paginationDots}>
                                                {productImages.map((_, index) => (
                                                    <View key={index} style={[styles.dot, index === activeImageIndex && styles.dotActive]} />
                                                ))}
                                            </View>
                                        )}
                                    </>
                                ) : (
                                    <View style={styles.placeholderImage}>
                                        <Feather name="image" size={48} color={COLORS.placeholder} />
                                    </View>
                                )}
                            </View>

                            {/* Prices Card */}
                            <View style={styles.pricesCard}>
                                {(() => {
                                    const { salePrice, rentPrice, isSaleEdited, isRentEdited } = getDisplayPrices();
                                    const hasRentPrice = rentPrice && parseFloat(rentPrice) > 0;
                                    const hasSalePrice = salePrice !== undefined;

                                    return (
                                        <>
                                            <View style={styles.priceRow}>
                                                <View style={styles.priceColumn}>
                                                    <Text style={styles.priceLabel}>VENTA</Text>
                                                    <Text style={styles.priceValue}>
                                                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(salePrice || 0)}
                                                    </Text>
                                                    {isSaleEdited && <Text style={styles.tempTag}>Editado</Text>}
                                                </View>

                                                {hasRentPrice && (
                                                    <>
                                                        <View style={styles.verticalDivider} />
                                                        <View style={styles.priceColumn}>
                                                            <Text style={styles.priceLabel}>ALQUILER</Text>
                                                            <Text style={[styles.priceValue, styles.rentValue]}>
                                                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(rentPrice)}
                                                            </Text>
                                                            {isRentEdited && <Text style={styles.tempTag}>Editado</Text>}
                                                        </View>
                                                    </>
                                                )}
                                            </View>

                                            <TouchableOpacity style={styles.editPricesBtn} onPress={handleOpenPriceEditor}>
                                                <Feather name="edit-2" size={14} color={COLORS.primary} />
                                                <Text style={styles.editPricesText}>Modificar precios</Text>
                                            </TouchableOpacity>
                                        </>
                                    );
                                })()}
                            </View>

                            {/* Description */}
                            {product.description ? (
                                <View style={styles.descriptionSection}>
                                    <Text style={styles.sectionHeader}>Descripción</Text>
                                    <Text style={styles.descriptionText} numberOfLines={isDescriptionExpanded ? undefined : 3}>
                                        {product.description}
                                    </Text>
                                    {product.description.length > 100 && (
                                        <TouchableOpacity onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
                                            <Text style={styles.readMoreText}>{isDescriptionExpanded ? 'Mostrar menos' : 'Leer más'}</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ) : null}

                        </ScrollView>

                        {/* Footer Actions */}
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[styles.actionButton, isSharing && styles.disabledButton]}
                                onPress={handleShare}
                                disabled={isSharing}
                            >
                                {isSharing ? <ActivityIndicator color="#FFF" size="small" style={{ marginRight: 8 }} /> : <Feather name="share" size={20} color="#FFF" style={{ marginRight: 8 }} />}
                                <Text style={styles.actionButtonText}>Compartir PDF</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Share Options Modal */}
            <Modal animationType="fade" transparent={true} visible={shareModalVisible} onRequestClose={() => setShareModalVisible(false)} statusBarTranslucent={true}>
                <View style={styles.shareOverlay}>
                    <View style={styles.shareModal}>
                        <Text style={styles.shareTitle}>Exportar PDF</Text>
                        <Text style={styles.shareSubtitle}>¿Qué precios deseas incluir?</Text>

                        <TouchableOpacity style={styles.shareOption} onPress={() => handleOptionSelect({ showSale: true, showRent: false })}>
                            <Feather name="tag" size={20} color={COLORS.primary} />
                            <Text style={styles.shareOptionText}>Solo Venta</Text>
                        </TouchableOpacity>

                        {product.rentalPrice || product.rentPrice ? (
                            <>
                                <TouchableOpacity style={styles.shareOption} onPress={() => handleOptionSelect({ showSale: false, showRent: true })}>
                                    <Feather name="clock" size={20} color={COLORS.primary} />
                                    <Text style={styles.shareOptionText}>Solo Alquiler</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.shareOption, styles.shareOptionPrimary]} onPress={() => handleOptionSelect({ showSale: true, showRent: true })}>
                                    <Feather name="layers" size={20} color="#FFF" />
                                    <Text style={[styles.shareOptionText, { color: '#FFF' }]}>Ambos Precios</Text>
                                </TouchableOpacity>
                            </>
                        ) : null}

                        <TouchableOpacity style={styles.shareCancel} onPress={() => setShareModalVisible(false)}>
                            <Text style={styles.shareCancelText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Price Edit Modal */}
            <Modal animationType="slide" transparent={true} visible={editingPrices} onRequestClose={handleCancelPriceEdit} statusBarTranslucent={true}>
                <View style={styles.priceEditOverlay}>
                    <View style={styles.priceEditModal}>
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>Editar Precios (Temporal)</Text>
                            <TouchableOpacity onPress={handleCancelPriceEdit}><Feather name="x" size={24} color={COLORS.text} /></TouchableOpacity>
                        </View>
                        <View style={styles.priceInputs}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Venta</Text>
                                <TextInput style={styles.priceInput} value={tempPrices.salePrice} onChangeText={(t) => setTempPrices(p => ({ ...p, salePrice: t }))} keyboardType="numeric" placeholder="0" />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Alquiler</Text>
                                <TextInput style={styles.priceInput} value={tempPrices.rentPrice} onChangeText={(t) => setTempPrices(p => ({ ...p, rentPrice: t }))} keyboardType="numeric" placeholder="0" />
                            </View>
                        </View>
                        <TouchableOpacity style={styles.savePricesBtn} onPress={handleSaveTempPrices}>
                            <Text style={styles.savePricesText}>Aplicar Cambios</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: SPACING.md },
    modalContainer: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, width: '100%', maxHeight: '95%', overflow: 'hidden', display: 'flex', flexDirection: 'column' },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    titleContainer: { flex: 1, paddingRight: SPACING.md },
    headerTitle: { fontSize: TYPOGRAPHY.size.xl, fontWeight: '700', color: COLORS.text },
    closeButton: { padding: 4 },

    content: { padding: SPACING.lg },

    carouselWrapper: { marginBottom: SPACING.xl, alignItems: 'center' },
    carouselImage: { height: 280, borderRadius: RADIUS.lg, resizeMode: 'contain', backgroundColor: COLORS.background },
    paginationDots: { flexDirection: 'row', marginTop: SPACING.md, gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.border },
    dotActive: { backgroundColor: COLORS.primary, width: 18 },
    placeholderImage: { width: '100%', height: 200, backgroundColor: COLORS.background, borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center' },

    pricesCard: { backgroundColor: COLORS.background, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.xl },
    priceRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: SPACING.md },
    priceColumn: { alignItems: 'center' },
    priceLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1, marginBottom: 4 },
    priceValue: { fontSize: 24, fontWeight: '700', color: COLORS.text },
    rentValue: { color: COLORS.primary },
    verticalDivider: { width: 1, height: 40, backgroundColor: COLORS.border },
    editPricesBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
    editPricesText: { marginLeft: 8, color: COLORS.primary, fontWeight: '600', fontSize: TYPOGRAPHY.size.sm },
    tempTag: { fontSize: 9, color: COLORS.warning, fontWeight: '700', marginTop: 2 },

    descriptionSection: { marginBottom: SPACING.xl },
    sectionHeader: { fontSize: TYPOGRAPHY.size.base, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
    descriptionText: { fontSize: TYPOGRAPHY.size.base, color: COLORS.textSecondary, lineHeight: 22 },
    readMoreText: { color: COLORS.primary, fontWeight: '600', marginTop: SPACING.xs },

    footer: { padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border },
    actionButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', ...SHADOWS.md },
    actionButtonText: { color: '#FFF', fontWeight: '700', fontSize: TYPOGRAPHY.size.base },
    disabledButton: { opacity: 0.7 },

    shareOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
    shareModal: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.xl, width: '100%', maxWidth: 340 },
    shareTitle: { fontSize: TYPOGRAPHY.size.xl, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: SPACING.xs },
    shareSubtitle: { fontSize: TYPOGRAPHY.size.base, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl },
    shareOption: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.background, marginBottom: SPACING.sm },
    shareOptionPrimary: { backgroundColor: COLORS.primary },
    shareOptionText: { marginLeft: SPACING.md, fontSize: TYPOGRAPHY.size.base, fontWeight: '600', color: COLORS.text },
    shareCancel: { marginTop: SPACING.md, alignItems: 'center', padding: SPACING.sm },
    shareCancelText: { color: COLORS.textSecondary, fontWeight: '600' },

    priceEditOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    priceEditModal: { backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.xl },
    priceInputs: { marginBottom: SPACING.xl },
    inputGroup: { marginBottom: SPACING.md },
    inputLabel: { fontSize: TYPOGRAPHY.size.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 4 },
    priceInput: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: TYPOGRAPHY.size.lg, borderWidth: 1, borderColor: COLORS.border },
    savePricesBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: RADIUS.lg, alignItems: 'center' },
    savePricesText: { color: '#FFF', fontWeight: '700', fontSize: TYPOGRAPHY.size.base }
});
