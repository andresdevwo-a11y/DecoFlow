import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView, Dimensions, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { readAsStringAsync } from 'expo-file-system/legacy';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, SIZES } from '../constants/Theme';
import { getProductsBySectionId } from '../services/Database';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SectionOptionsModal({ visible, onClose, onOpen, onEdit, onDuplicate, onDelete, section }) {
    const insets = useSafeAreaInsets();
    const [showPdfConfig, setShowPdfConfig] = React.useState(false);
    const [priceSelection, setPriceSelection] = React.useState('both'); // 'sale', 'rent', 'both'
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [pdfProducts, setPdfProducts] = React.useState([]);

    const handleSharePress = async () => {
        try {
            if (!section) return;

            // Check if section has products using Database directly since they might not be in the prop
            const products = await getProductsBySectionId(section.id);

            if (!products || products.length === 0) {
                Alert.alert(
                    "Sección vacía",
                    "No se puede generar el PDF porque la sección está vacía."
                );
                return;
            }

            setPdfProducts(products);
            setShowPdfConfig(true);
        } catch (error) {
            console.error("Error fetching products for PDF:", error);
            Alert.alert("Error", "Ocurrió un error al verificar los productos.");
        }
    };

    const generateAndSharePDF = async () => {
        try {
            setIsGenerating(true);

            // Process products to convert images to Base64
            const productsWithImages = await Promise.all(pdfProducts.map(async (p) => {
                let imageSrc = null;
                if (p.image) {
                    try {
                        const base64 = await readAsStringAsync(p.image, { encoding: 'base64' });
                        imageSrc = `data:image/jpeg;base64,${base64}`;
                    } catch (e) {
                        console.warn("Error converting image to base64:", e);
                    }
                }
                return { ...p, imageSrc };
            }));

            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        * {
                            box-sizing: border-box;
                        }
                        body { 
                            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
                            padding: 24px; 
                            background-color: #f8f9fa;
                            margin: 0;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 32px;
                            padding-bottom: 20px;
                            border-bottom: 2px solid ${COLORS.primary};
                        }
                        h1 { 
                            color: ${COLORS.text}; 
                            margin: 0 0 8px 0;
                            font-size: 28px;
                            font-weight: 700;
                        }
                        .header-subtitle {
                            color: ${COLORS.textMuted};
                            font-size: 14px;
                        }
                        .products-grid {
                            display: flex;
                            flex-direction: column;
                            gap: 20px;
                        }
                        .product-card { 
                            background: #ffffff;
                            border: 1px solid #e0e0e0;
                            border-radius: 12px;
                            padding: 20px;
                            page-break-inside: avoid;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                            display: flex;
                            flex-direction: row;
                            gap: 20px;
                        }
                        .product-card:hover {
                            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                        }
                        .image-section { 
                            width: 180px;
                            min-width: 180px;
                            display: flex;
                            align-items: flex-start;
                            justify-content: center;
                        }
                        .product-image { 
                            width: 100%;
                            height: auto;
                            max-height: 180px; 
                            border-radius: 10px; 
                            object-fit: cover;
                            border: 1px solid #eee;
                        }
                        .no-image-placeholder {
                            width: 100%;
                            height: 140px; 
                            background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
                            border-radius: 10px; 
                            display: flex; 
                            flex-direction: column;
                            align-items: center; 
                            justify-content: center; 
                            color: #bbb;
                            font-size: 13px;
                            font-weight: 500;
                            border: 1px dashed #ddd;
                        }
                        .no-image-icon {
                            font-size: 32px;
                            margin-bottom: 6px;
                            opacity: 0.5;
                        }
                        .content-section { 
                            flex: 1;
                            display: flex;
                            flex-direction: column;
                        }
                        .product-name { 
                            font-size: 20px; 
                            font-weight: 700; 
                            margin: 0 0 14px 0;
                            color: ${COLORS.text}; 
                            line-height: 1.3;
                        }
                        .prices-container {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 12px;
                            margin-bottom: 16px;
                        }
                        .price-badge {
                            display: inline-flex;
                            align-items: center;
                            padding: 8px 14px;
                            border-radius: 8px;
                            font-size: 15px;
                        }
                        .price-sale {
                            background: linear-gradient(135deg, ${COLORS.primary}15 0%, ${COLORS.primary}25 100%);
                            border: 1px solid ${COLORS.primary}40;
                        }
                        .price-sale .price-value {
                            color: ${COLORS.primary};
                            font-weight: 700;
                        }
                        .price-rent {
                            background: linear-gradient(135deg, #6366f115 0%, #6366f125 100%);
                            border: 1px solid #6366f140;
                        }
                        .price-rent .price-value {
                            color: #6366f1;
                            font-weight: 700;
                        }
                        .price-label { 
                            font-weight: 500; 
                            color: ${COLORS.textMuted}; 
                            font-size: 13px; 
                            margin-right: 6px;
                        }
                        .price-value {
                            font-size: 16px;
                        }
                        .description-section {
                            flex: 1;
                        }
                        .description-label {
                            font-size: 11px;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            color: ${COLORS.textMuted};
                            margin-bottom: 6px;
                            font-weight: 600;
                        }
                        .description-text { 
                            color: #555; 
                            font-size: 14px; 
                            line-height: 1.6;
                            margin: 0;
                        }
                        .footer { 
                            text-align: center; 
                            color: #999; 
                            font-size: 12px; 
                            margin-top: 40px; 
                            padding-top: 20px;
                            border-top: 1px solid #e0e0e0;
                        }
                        .footer-logo {
                            font-weight: 600;
                            color: ${COLORS.primary};
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>📦 Catálogo: ${section?.name || 'Sección'}</h1>
                        <p class="header-subtitle">${pdfProducts.length} producto${pdfProducts.length !== 1 ? 's' : ''} en esta sección</p>
                    </div>
                    <div class="products-grid">
                    ${productsWithImages.map(p => `
                        <div class="product-card">
                            <div class="image-section">
                                ${p.imageSrc
                    ? `<img class="product-image" src="${p.imageSrc}" />`
                    : '<div class="no-image-placeholder"><span class="no-image-icon">📷</span>Sin Imagen</div>'}
                            </div>
                            <div class="content-section">
                                <h2 class="product-name">${p.name}</h2>
                                <div class="prices-container">
                                    ${(priceSelection === 'sale' || priceSelection === 'both') ? `
                                        <div class="price-badge price-sale">
                                            <span class="price-label">Venta:</span>
                                            <span class="price-value">$${p.price || 'N/A'}</span>
                                        </div>
                                    ` : ''}
                                    ${(priceSelection === 'rent' || priceSelection === 'both') ? `
                                        <div class="price-badge price-rent">
                                            <span class="price-label">Alquiler:</span>
                                            <span class="price-value">$${p.rentPrice || 'N/A'}</span>
                                        </div>
                                    ` : ''}
                                </div>
                                ${p.description ? `
                                    <div class="description-section">
                                        <p class="description-label">Descripción</p>
                                        <p class="description-text">${p.description}</p>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                    </div>
                    <div class="footer">
                        <p>Generado el ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            setShowPdfConfig(false);
        } catch (error) {
            Alert.alert('Error', 'No se pudo generar el PDF');
            console.error(error);
        } finally {
            setIsGenerating(false);
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
                                <Feather name="folder" size={24} color={COLORS.primary} />
                            </View>
                            <View style={styles.headerTextContainer}>
                                <Text style={styles.title} numberOfLines={1}>{section?.name || 'Sección'}</Text>
                                <Text style={styles.subtitle}>Gestionar Sección</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Feather name="x" size={22} color={COLORS.textMuted} />
                            </TouchableOpacity>
                        </View>

                        {/* Options List */}
                        <View style={styles.optionsList}>
                            <TouchableOpacity style={styles.optionItem} onPress={onOpen} activeOpacity={0.7}>
                                <View style={[styles.optionIcon, { backgroundColor: COLORS.primaryLight }]}>
                                    <Feather name="folder-plus" size={20} color={COLORS.primary} />
                                </View>
                                <View style={styles.optionTextContainer}>
                                    <Text style={styles.optionLabel}>Abrir Sección</Text>
                                    <Text style={styles.optionDesc}>Ver los productos en su interior</Text>
                                </View>
                                <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.optionItem} onPress={handleSharePress} activeOpacity={0.7}>
                                <View style={[styles.optionIcon, { backgroundColor: COLORS.secondaryLight || '#E0E7FF' }]}>
                                    <Feather name="share" size={20} color={COLORS.secondary || '#4F46E5'} />
                                </View>
                                <View style={styles.optionTextContainer}>
                                    <Text style={styles.optionLabel}>Compartir catálogo</Text>
                                    <Text style={styles.optionDesc}>Generar PDF de productos</Text>
                                </View>
                                <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.optionItem} onPress={onEdit} activeOpacity={0.7}>
                                <View style={[styles.optionIcon, { backgroundColor: COLORS.background }]}>
                                    <Feather name="edit-3" size={20} color={COLORS.textSecondary} />
                                </View>
                                <View style={styles.optionTextContainer}>
                                    <Text style={styles.optionLabel}>Editar Info</Text>
                                    <Text style={styles.optionDesc}>Cambiar nombre o detalles</Text>
                                </View>
                                <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.optionItem} onPress={onDuplicate} activeOpacity={0.7}>
                                <View style={[styles.optionIcon, { backgroundColor: COLORS.background }]}>
                                    <Feather name="copy" size={20} color={COLORS.textSecondary} />
                                </View>
                                <View style={styles.optionTextContainer}>
                                    <Text style={styles.optionLabel}>Duplicar</Text>
                                    <Text style={styles.optionDesc}>Crear una copia idéntica</Text>
                                </View>
                                <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            <TouchableOpacity style={[styles.optionItem, styles.destructiveItem]} onPress={onDelete} activeOpacity={0.7}>
                                <View style={[styles.optionIcon, { backgroundColor: COLORS.errorLight }]}>
                                    <Feather name="trash-2" size={20} color={COLORS.error} />
                                </View>
                                <View style={styles.optionTextContainer}>
                                    <Text style={[styles.optionLabel, { color: COLORS.error }]}>Eliminar Sección</Text>
                                    <Text style={styles.optionDesc}>Esta acción no se puede deshacer</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>

            {/* PDF Config Modal */}
            <Modal
                visible={showPdfConfig}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowPdfConfig(false)}
            >
                <View style={styles.configOverlay}>
                    <View style={styles.configContainer}>
                        <Text style={styles.configTitle}>Configurar PDF</Text>
                        <Text style={styles.configSubtitle}>Selecciona los precios a incluir:</Text>

                        <TouchableOpacity
                            style={[styles.radioItem, priceSelection === 'sale' && styles.radioItemSelected]}
                            onPress={() => setPriceSelection('sale')}
                        >
                            <Feather name={priceSelection === 'sale' ? "check-circle" : "circle"} size={20} color={priceSelection === 'sale' ? COLORS.primary : COLORS.textMuted} />
                            <Text style={styles.radioLabel}>Precio de venta</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.radioItem, priceSelection === 'rent' && styles.radioItemSelected]}
                            onPress={() => setPriceSelection('rent')}
                        >
                            <Feather name={priceSelection === 'rent' ? "check-circle" : "circle"} size={20} color={priceSelection === 'rent' ? COLORS.primary : COLORS.textMuted} />
                            <Text style={styles.radioLabel}>Precio de alquiler</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.radioItem, priceSelection === 'both' && styles.radioItemSelected]}
                            onPress={() => setPriceSelection('both')}
                        >
                            <Feather name={priceSelection === 'both' ? "check-circle" : "circle"} size={20} color={priceSelection === 'both' ? COLORS.primary : COLORS.textMuted} />
                            <Text style={styles.radioLabel}>Ambos precios</Text>
                        </TouchableOpacity>

                        <View style={styles.configButtons}>
                            <TouchableOpacity onPress={() => setShowPdfConfig(false)} style={styles.cancelButton}>
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={generateAndSharePDF}
                                style={styles.generateButton}
                                disabled={isGenerating}
                            >
                                <Text style={styles.generateButtonText}>{isGenerating ? 'Generando...' : 'Generar PDF'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    destructiveItem: {
        marginTop: SPACING.sm,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: SPACING.md,
        marginHorizontal: SPACING.xs,
    },

    configOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    configContainer: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        padding: SPACING.xl,
        width: '100%',
        maxWidth: 340,
        ...SHADOWS.medium,
    },
    configTitle: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        marginBottom: SPACING.xs,
        textAlign: 'center',
    },
    configSubtitle: {
        fontSize: TYPOGRAPHY.size.base,
        color: COLORS.textMuted,
        marginBottom: SPACING.lg,
        textAlign: 'center',
    },
    radioItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.sm,
    },
    radioItemSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primaryLight + '20', // Reduced opacity
    },
    radioLabel: {
        marginLeft: SPACING.md,
        fontSize: TYPOGRAPHY.size.base,
        color: COLORS.text,
        fontWeight: TYPOGRAPHY.weight.medium,
    },
    configButtons: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginTop: SPACING.lg,
    },
    cancelButton: {
        flex: 1,
        padding: SPACING.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        color: COLORS.textMuted,
        fontWeight: TYPOGRAPHY.weight.semibold,
    },
    generateButton: {
        flex: 1,
        backgroundColor: COLORS.primary,
        padding: SPACING.md,
        borderRadius: RADIUS.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    generateButtonText: {
        color: COLORS.surface,
        fontWeight: TYPOGRAPHY.weight.bold,
    },
});
