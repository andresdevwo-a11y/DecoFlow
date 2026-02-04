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

    // Update state when product changes
    React.useEffect(() => {
        if (product) {
            // Reset temp prices to original product prices
            setTempPrices({
                salePrice: product.price || product.salePrice ? String(product.price || product.salePrice) : '',
                rentPrice: product.rentPrice || product.rentalPrice ? String(product.rentPrice || product.rentalPrice) : ''
            });
            setEditingPrices(false);
        }
    }, [product]);

    // Reset temp prices when modal closes
    React.useEffect(() => {
        if (!visible && product) {
            setTempPrices({
                salePrice: product.price || product.salePrice ? String(product.price || product.salePrice) : '',
                rentPrice: product.rentPrice || product.rentalPrice ? String(product.rentPrice || product.rentalPrice) : ''
            });
        }
    }, [visible, product]);

    const handleOpenPriceEditor = () => {
        // Initialize temp prices with current product prices if empty
        setTempPrices({
            salePrice: tempPrices.salePrice || (product.price || product.salePrice ? String(product.price || product.salePrice) : ''),
            rentPrice: tempPrices.rentPrice || (product.rentPrice || product.rentalPrice ? String(product.rentPrice || product.rentalPrice) : '')
        });
        setEditingPrices(true);
    };

    const handleSaveTempPrices = () => {
        // Save temporarily without updating the actual product
        const saleNumeric = parseFloat(tempPrices.salePrice.replace(/[^0-9.]/g, ''));
        const rentNumeric = parseFloat(tempPrices.rentPrice.replace(/[^0-9.]/g, ''));

        setTempPrices({
            salePrice: isNaN(saleNumeric) ? '0' : String(saleNumeric),
            rentPrice: isNaN(rentNumeric) ? '0' : String(rentNumeric)
        });
        setEditingPrices(false);
    };

    const handleCancelPriceEdit = () => {
        // Reset to original product prices
        setTempPrices({
            salePrice: product.price || product.salePrice ? String(product.price || product.salePrice) : '',
            rentPrice: product.rentPrice || product.rentalPrice ? String(product.rentPrice || product.rentalPrice) : ''
        });
        setEditingPrices(false);
    };

    // Get carousel image width based on modal width
    const CAROUSEL_IMAGE_WIDTH = Dimensions.get('window').width - 80; // Account for modal padding

    // Build array of available images
    const productImages = product ? [
        product.image,
        product.imageSecondary1,
        product.imageSecondary2
    ].filter(img => img !== null && img !== undefined) : [];

    // Reset active index when product changes
    React.useEffect(() => {
        setActiveImageIndex(0);
    }, [product]);

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
        // Small timeout to allow modal to close smoothly before starting heavy work
        setTimeout(() => {
            generateAndSharePDF(options);
        }, 100);
    };

    const generateAndSharePDF = async ({ showSale, showRent }) => {
        setIsSharing(true);
        try {
            // Use temporary prices if available, otherwise use product prices
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

            // Helper to process image to base64
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

            // Process all images
            const imageSrcs = await Promise.all(productImages.map(processImage));
            const primaryImageSrc = imageSrcs[0] || '';
            const secondaryImageSrcs = imageSrcs.slice(1).filter(Boolean);

            // Get current date for footer
            const currentDate = new Date().toLocaleDateString('es-CO', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            // Construct HTML content with new hierarchical layout:
            // 1. Product Name (top)
            // 2. Prices (below name)
            // 3. Images (up to 3, large, vertical stack)
            // 4. Description (bottom)
            const htmlContent = `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
                        body {
                            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                            color: #1a1a1a;
                            padding: 24px;
                            background-color: #f8f9fa;
                        }
                        .card {
                            background: white;
                            border-radius: 16px;
                            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
                            padding: 32px;
                            max-width: 100%;
                        }
                        
                        /* ===== SECTION 1: PRODUCT NAME (TOP) ===== */
                        .name-section {
                            text-align: center;
                            margin-bottom: 24px;
                            padding-bottom: 20px;
                            border-bottom: 2px solid ${COLORS.primary}20;
                        }
                        .brand {
                            font-size: 11px;
                            color: #999;
                            letter-spacing: 3px;
                            text-transform: uppercase;
                            margin-bottom: 10px;
                        }
                        .product-name {
                            font-size: 32px;
                            font-weight: 800;
                            color: #1a1a1a;
                            margin: 0;
                            line-height: 1.2;
                        }
                        
                        /* ===== SECTION 2: PRICES (BELOW NAME) ===== */
                        .price-section {
                            display: flex;
                            justify-content: center;
                            flex-wrap: wrap;
                            gap: 16px;
                            margin-bottom: 28px;
                            padding-bottom: 24px;
                            border-bottom: 1px solid #eee;
                        }
                        .price-badge {
                            background: linear-gradient(135deg, ${COLORS.primary}18 0%, ${COLORS.primary}08 100%);
                            border: 1px solid ${COLORS.primary}35;
                            border-radius: 14px;
                            padding: 18px 28px;
                            text-align: center;
                            min-width: 160px;
                        }
                        .price-badge.rent {
                            background: linear-gradient(135deg, #6366f118 0%, #6366f108 100%);
                            border: 1px solid #6366f135;
                        }
                        .price-label {
                            font-size: 11px;
                            text-transform: uppercase;
                            letter-spacing: 1.2px;
                            color: #666;
                            margin-bottom: 8px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 6px;
                        }
                        .price-value {
                            font-size: 26px;
                            font-weight: 700;
                            color: ${COLORS.primary};
                        }
                        .price-badge.rent .price-value {
                            color: #6366f1;
                        }
                        
                        /* ===== SECTION 3: IMAGES (LARGE, VERTICAL STACK) ===== */
                        .images-section {
                            margin-bottom: 28px;
                        }
                        .images-stack {
                            display: flex;
                            flex-direction: column;
                            gap: 16px;
                        }
                        .image-container {
                            background: #f8f8f8;
                            border-radius: 12px;
                            overflow: hidden;
                            text-align: center;
                            padding: 12px;
                            border: 1px solid #eee;
                        }
                        .image-container img {
                            width: 100%;
                            max-width: 100%;
                            height: auto;
                            max-height: 400px;
                            object-fit: contain;
                            display: block;
                            margin: 0 auto;
                            border-radius: 8px;
                        }
                        .image-label {
                            font-size: 10px;
                            color: #999;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            margin-top: 8px;
                        }
                        
                        /* ===== SECTION 4: DESCRIPTION (BOTTOM) ===== */
                        .description-section {
                            background: #f9fafb;
                            border-radius: 12px;
                            padding: 24px;
                            margin-bottom: 24px;
                            border: 1px solid #eee;
                            page-break-inside: avoid;
                        }
                        .description-title {
                            font-size: 11px;
                            text-transform: uppercase;
                            letter-spacing: 1.5px;
                            color: #888;
                            margin-bottom: 12px;
                            font-weight: 600;
                        }
                        .description-text {
                            font-size: 15px;
                            line-height: 1.7;
                            color: #444;
                            text-align: left;
                            margin: 0;
                        }
                        
                        /* ===== FOOTER ===== */
                        .footer {
                            text-align: center;
                            padding-top: 16px;
                            border-top: 1px solid #eee;
                        }
                        .footer-text {
                            font-size: 11px;
                            color: #aaa;
                            letter-spacing: 0.5px;
                        }
                        .footer-brand {
                            font-weight: 600;
                            color: ${COLORS.primary};
                        }
                    </style>
                </head>
                <body>
                    <div class="card">
                        
                        <!-- SECTION 1: PRODUCT NAME -->
                        <div class="name-section">
                            <div class="brand">DECOFLOW</div>
                            <h1 class="product-name">${product.name}</h1>
                        </div>

                        <!-- SECTION 2: PRICES -->
                        <div class="price-section">
                            ${showSale ? `
                            <div class="price-badge">
                                <div class="price-label">💰 Precio de Venta</div>
                                <div class="price-value">${salePriceFormatted}</div>
                            </div>
                            ` : ''}
                            ${showRent ? `
                            <div class="price-badge rent">
                                <div class="price-label">🏷️ Precio de Alquiler</div>
                                <div class="price-value">${rentPriceFormatted}</div>
                            </div>
                            ` : ''}
                        </div>

                        <!-- SECTION 3: IMAGES (up to 3, large, vertical) -->
                        ${imageSrcs.filter(Boolean).length > 0 ? `
                        <div class="images-section">
                            <div class="images-stack">
                                ${imageSrcs.filter(Boolean).map((src, index) => `
                                    <div class="image-container">
                                        <img src="${src}" alt="${product.name} - Imagen ${index + 1}" />
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        ` : ''}

                        <!-- SECTION 4: DESCRIPTION -->
                        ${product.description ? `
                        <div class="description-section">
                            <p class="description-title">📝 Descripción</p>
                            <p class="description-text">${product.description}</p>
                        </div>
                        ` : ''}

                        <!-- FOOTER -->
                        <div class="footer">
                            <p class="footer-text">Generado el ${currentDate} • <span class="footer-brand">DECOFLOW</span></p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            // Generate PDF
            const { uri } = await Print.printToFileAsync({
                html: htmlContent,
                base64: false
            });

            // Share PDF
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    UTI: '.pdf',
                    mimeType: 'application/pdf',
                    dialogTitle: `Compartir ${product.name}`
                });
            } else {
                Alert.alert('Error', 'Compartir no está disponible en este dispositivo');
            }

        } catch (error) {
            console.error('Error generating PDF:', error);
            Alert.alert('Error', 'Hubo un problema al generar el PDF');
        } finally {
            setIsSharing(false);
        }
    };

    // Helper function to get display prices (shows temp prices if available)
    const getDisplayPrices = () => {
        const salePrice = tempPrices.salePrice ? parseFloat(tempPrices.salePrice.replace(/[^0-9.]/g, '')) : (product.salePrice || product.price);
        const rentPrice = tempPrices.rentPrice ? parseFloat(tempPrices.rentPrice.replace(/[^0-9.]/g, '')) : (product.rentalPrice || product.rentPrice);

        return {
            salePrice,
            rentPrice,
            hasTempPrices: !!(tempPrices.salePrice || tempPrices.rentPrice)
        };
    };

    return (
        <>
            <Modal
                animationType="slide"
                transparent={true}
                visible={visible}
                onRequestClose={onClose}
                statusBarTranslucent={true}
            >
                <View style={styles.overlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>{product.name}</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Feather name="x" size={SIZES.iconLg} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            contentContainerStyle={styles.content}
                            showsVerticalScrollIndicator={false}
                        >
                            {productImages.length > 0 ? (
                                <View style={styles.carouselContainer}>
                                    <FlatList
                                        data={productImages}
                                        horizontal
                                        pagingEnabled
                                        showsHorizontalScrollIndicator={false}
                                        onMomentumScrollEnd={onScrollEnd}
                                        keyExtractor={(_, index) => index.toString()}
                                        renderItem={({ item }) => (
                                            <Image
                                                source={{ uri: item }}
                                                style={[styles.carouselImage, { width: CAROUSEL_IMAGE_WIDTH }]}
                                            />
                                        )}
                                        scrollEnabled={productImages.length > 1}
                                    />
                                    {productImages.length > 1 && (
                                        <View style={styles.paginationDots}>
                                            {productImages.map((_, index) => (
                                                <View
                                                    key={index}
                                                    style={[
                                                        styles.dot,
                                                        index === activeImageIndex && styles.dotActive
                                                    ]}
                                                />
                                            ))}
                                        </View>
                                    )}
                                </View>
                            ) : (
                                <View style={styles.placeholderImage}>
                                    <Feather name="image" size={SIZES.iconEmpty} color={COLORS.placeholder} />
                                </View>
                            )}

                            {product.description ? (
                                <View style={styles.descriptionContainer}>
                                    <Text
                                        style={styles.description}
                                        numberOfLines={isDescriptionExpanded ? undefined : 2}
                                    >
                                        {product.description}
                                    </Text>
                                    {product.description.length > 80 && (
                                        <TouchableOpacity onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
                                            <Text style={styles.readMore}>
                                                {isDescriptionExpanded ? 'Ver menos' : 'Ver más'}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ) : null}

                            {/* Price Section */}
                            <View style={styles.priceSection}>
                                {(() => {
                                    const { salePrice, rentPrice, hasTempPrices } = getDisplayPrices();
                                    const hasRentPrice = rentPrice !== undefined && rentPrice !== null && rentPrice !== '' && parseFloat(rentPrice) > 0;
                                    const hasSalePrice = salePrice !== undefined && salePrice !== null && salePrice !== '' && parseFloat(salePrice) > 0;

                                    return (
                                        <View style={styles.priceRow}>
                                            {hasSalePrice && (
                                                <View style={styles.priceItem}>
                                                    <Text style={styles.priceLabel}>Precio de venta {hasTempPrices && <Text style={styles.tempIndicator}>(temporal)</Text>}</Text>
                                                    <Text style={styles.price}>
                                                        {new Intl.NumberFormat('es-CO', {
                                                            style: 'currency',
                                                            currency: 'COP',
                                                            minimumFractionDigits: 0,
                                                            maximumFractionDigits: 0
                                                        }).format(salePrice || 0)}
                                                    </Text>
                                                </View>
                                            )}

                                            {hasRentPrice && (
                                                <View style={styles.priceItem}>
                                                    <Text style={styles.priceLabel}>Precio de alquiler {hasTempPrices && <Text style={styles.tempIndicator}>(temporal)</Text>}</Text>
                                                    <Text style={styles.rentPrice}>
                                                        {new Intl.NumberFormat('es-CO', {
                                                            style: 'currency',
                                                            currency: 'COP',
                                                            minimumFractionDigits: 0,
                                                            maximumFractionDigits: 0
                                                        }).format(rentPrice)}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    );
                                })()}
                            </View>

                            {/* Acciones Rápidas Section */}
                            <View style={styles.quickActionsSection}>
                                <Text style={styles.sectionHeader}>Acciones Rápidas</Text>

                                <View style={styles.actionsRow}>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={handleOpenPriceEditor}
                                    >
                                        <Feather name="edit-3" size={16} color={COLORS.primary} />
                                        <Text style={[styles.actionButtonText, { color: COLORS.primary, fontWeight: 'bold' }]}>
                                            Editar Precios
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[styles.shareButton, isSharing && styles.shareButtonDisabled]}
                                onPress={handleShare}
                                disabled={isSharing}
                            >
                                {isSharing ? (
                                    <ActivityIndicator size="small" color={COLORS.surface} style={styles.shareIcon} />
                                ) : (
                                    <Feather name="share" size={SIZES.iconSm} color={COLORS.surface} style={styles.shareIcon} />
                                )}
                                <Text style={styles.shareButtonText}>
                                    {isSharing ? 'Generando PDF...' : 'Compartir PDF'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Custom Share Options Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={shareModalVisible}
                onRequestClose={() => setShareModalVisible(false)}
                statusBarTranslucent={true}
            >
                <View style={styles.shareOverlay}>
                    <View style={styles.shareModal}>
                        <Text style={styles.shareTitle}>Opciones de PDF</Text>
                        <Text style={styles.shareSubtitle}>Selecciona qué precios incluir:</Text>

                        <View style={styles.shareOptions}>
                            <TouchableOpacity
                                style={styles.shareOptionButton}
                                onPress={() => handleOptionSelect({ showSale: true, showRent: false })}
                            >
                                <Feather name="tag" size={20} color={COLORS.primary} style={styles.optionIcon} />
                                <Text style={styles.shareOptionText}>Solo Precio de Venta</Text>
                            </TouchableOpacity>

                            {(() => {
                                const rentPrice = product.rentalPrice || product.rentPrice;
                                const hasRentPrice = rentPrice !== undefined && rentPrice !== null && rentPrice !== '' && parseFloat(rentPrice) > 0;

                                if (hasRentPrice) {
                                    return (
                                        <>
                                            <TouchableOpacity
                                                style={styles.shareOptionButton}
                                                onPress={() => handleOptionSelect({ showSale: false, showRent: true })}
                                            >
                                                <Feather name="clock" size={20} color={COLORS.secondary || COLORS.textSecondary} style={styles.optionIcon} />
                                                <Text style={styles.shareOptionText}>Solo Precio de Alquiler</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={[styles.shareOptionButton, styles.shareOptionPrimary]}
                                                onPress={() => handleOptionSelect({ showSale: true, showRent: true })}
                                            >
                                                <Feather name="layers" size={20} color={COLORS.surface} style={styles.optionIcon} />
                                                <Text style={[styles.shareOptionText, styles.textWhite]}>Ambos Precios</Text>
                                            </TouchableOpacity>
                                        </>
                                    );
                                }
                                return null;
                            })()}
                        </View>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setShareModalVisible(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Price Edit Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={editingPrices}
                onRequestClose={handleCancelPriceEdit}
                statusBarTranslucent={true}
            >
                <View style={styles.priceEditOverlay}>
                    <View style={styles.priceEditModal}>
                        <View style={styles.priceEditHeader}>
                            <Text style={styles.priceEditTitle}>Editar Precios</Text>
                            <TouchableOpacity onPress={handleCancelPriceEdit} style={styles.priceEditCloseBtn}>
                                <Feather name="x" size={20} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.priceEditContent}>
                            <View style={styles.priceInputContainer}>
                                <Text style={styles.priceInputLabel}>Precio de Venta</Text>
                                <View style={styles.priceInputWrapper}>
                                    <Text style={styles.priceInputPrefix}>$</Text>
                                    <TextInput
                                        style={styles.priceInput}
                                        value={tempPrices.salePrice}
                                        onChangeText={(text) => setTempPrices(prev => ({ ...prev, salePrice: text }))}
                                        keyboardType="numeric"
                                        placeholder="0.00"
                                    />
                                </View>
                            </View>

                            <View style={styles.priceInputContainer}>
                                <Text style={styles.priceInputLabel}>Precio de Alquiler</Text>
                                <View style={styles.priceInputWrapper}>
                                    <Text style={styles.priceInputPrefix}>$</Text>
                                    <TextInput
                                        style={styles.priceInput}
                                        value={tempPrices.rentPrice}
                                        onChangeText={(text) => setTempPrices(prev => ({ ...prev, rentPrice: text }))}
                                        keyboardType="numeric"
                                        placeholder="0.00"
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.priceEditActions}>
                            <TouchableOpacity
                                style={[styles.priceEditBtn, styles.priceEditCancelBtn]}
                                onPress={handleCancelPriceEdit}
                            >
                                <Text style={styles.priceEditCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.priceEditBtn, styles.priceEditSaveBtn]}
                                onPress={handleSaveTempPrices}
                            >
                                <Text style={styles.priceEditSaveText}>Aplicar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: COLORS.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    modalContainer: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        width: '100%',
        maxWidth: 400,
        padding: SPACING['2xl'],
        maxHeight: '90%',
        ...SHADOWS.modal,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
        position: 'relative',
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.size['4xl'],
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        textAlign: 'center',
        paddingHorizontal: 30,
    },
    closeButton: {
        position: 'absolute',
        right: 0,
        top: 0,
        padding: SPACING.xs,
    },
    content: {
        alignItems: 'center',
    },
    carouselContainer: {
        width: '100%',
        marginBottom: SPACING.lg,
    },
    carouselImage: {
        height: 280,
        borderRadius: RADIUS.md,
        resizeMode: 'contain',
    },
    paginationDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.md,
        gap: SPACING.xs,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.border,
    },
    dotActive: {
        backgroundColor: COLORS.primary,
        width: 24,
    },
    image: {
        width: '100%',
        borderRadius: RADIUS.md,
        resizeMode: 'contain',
        marginBottom: SPACING.lg,
    },
    placeholderImage: {
        width: '100%',
        height: 200,
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        marginBottom: SPACING.lg,
    },
    descriptionContainer: {
        width: '100%',
        marginBottom: SPACING.md,
    },
    description: {
        fontSize: TYPOGRAPHY.size.xl,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.xs,
    },
    readMore: {
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.weight.semibold,
        textAlign: 'center',
        marginTop: SPACING.xs,
    },
    // --- QUICK ACTIONS SECTION ---
    quickActionsSection: {
        width: '100%',
        marginBottom: SPACING.lg,
        paddingHorizontal: SPACING.xs,
    },
    sectionHeader: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: SPACING.md,
        flexWrap: 'wrap',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        minWidth: 140,
        justifyContent: 'center',
    },
    actionButtonPrimary: {
        backgroundColor: COLORS.primaryLight,
        borderColor: COLORS.primaryLight,
    },
    actionButtonText: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.text,
        marginLeft: SPACING.xs,
    },

    priceSection: {
        width: '100%',
        marginBottom: SPACING['2xl'],
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: SPACING.xl,
    },
    priceItem: {
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textMuted,
        marginBottom: SPACING.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    price: {
        fontSize: TYPOGRAPHY.size['3xl'],
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.primary,
    },
    rentPrice: {
        fontSize: TYPOGRAPHY.size['3xl'],
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.secondary || COLORS.textSecondary,
    },
    shareButton: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING['2xl'],
        borderRadius: RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    shareButtonDisabled: {
        opacity: 0.7,
    },
    shareIcon: {
        marginRight: SPACING.sm,
    },
    shareButtonText: {
        color: COLORS.surface,
        fontWeight: TYPOGRAPHY.weight.bold,
        fontSize: TYPOGRAPHY.size.xl,
    },
    footer: {
        marginTop: SPACING.md,
        paddingTop: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
    },

    // Share Modal Styles
    shareOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    shareModal: {
        backgroundColor: COLORS.surface,
        width: '100%',
        maxWidth: 320,
        borderRadius: RADIUS.xl,
        padding: SPACING['2xl'],
        ...SHADOWS.modal,
    },
    shareTitle: {
        fontSize: TYPOGRAPHY.size['2xl'],
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: SPACING.xs,
    },
    shareSubtitle: {
        fontSize: TYPOGRAPHY.size.base,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.xl,
    },
    shareOptions: {
        gap: SPACING.md,
        width: '100%',
    },
    shareOptionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderRadius: RADIUS.md,
    },
    shareOptionPrimary: {
        backgroundColor: COLORS.primary,
    },
    optionIcon: {
        marginRight: SPACING.md,
    },
    shareOptionText: {
        fontSize: TYPOGRAPHY.size.lg,
        color: COLORS.text,
        fontWeight: TYPOGRAPHY.weight.medium,
    },
    textWhite: {
        color: COLORS.surface,
    },
    cancelButton: {
        marginTop: SPACING.xl,
        alignItems: 'center',
        paddingVertical: SPACING.sm,
    },
    cancelButtonText: {
        fontSize: TYPOGRAPHY.size.base,
        color: COLORS.textMuted,
        fontWeight: TYPOGRAPHY.weight.medium,
    },

    // Price Edit Modal Styles
    priceEditOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    priceEditModal: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        width: '100%',
        maxWidth: 320,
        padding: SPACING['2xl'],
        ...SHADOWS.modal,
    },
    priceEditHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    priceEditTitle: {
        fontSize: TYPOGRAPHY.size['2xl'],
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
    },
    priceEditCloseBtn: {
        padding: SPACING.xs,
    },
    priceEditContent: {
        gap: SPACING.lg,
        marginBottom: SPACING['2xl'],
    },
    priceInputContainer: {
        gap: SPACING.sm,
    },
    priceInputLabel: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.textSecondary,
    },
    priceInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.md,
    },
    priceInputPrefix: {
        fontSize: TYPOGRAPHY.size.lg,
        color: COLORS.textSecondary,
        marginRight: SPACING.sm,
    },
    priceInput: {
        flex: 1,
        fontSize: TYPOGRAPHY.size.lg,
        color: COLORS.text,
        paddingVertical: SPACING.md,
    },
    priceEditActions: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    priceEditBtn: {
        flex: 1,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderRadius: RADIUS.md,
        alignItems: 'center',
    },
    priceEditCancelBtn: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    priceEditSaveBtn: {
        backgroundColor: COLORS.primary,
    },
    priceEditCancelText: {
        fontSize: TYPOGRAPHY.size.base,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.text,
    },
    priceEditSaveText: {
        fontSize: TYPOGRAPHY.size.base,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.surface,
    },
    tempIndicator: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.primary,
        fontStyle: 'italic',
    },
});
