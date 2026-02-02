import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, SIZES } from '../constants/Theme';
import { useFinance } from '../context/FinanceContext';
import { useAlert } from '../context/AlertContext';
import QuickActionModal from './QuickActionModal';
import ProductStatsModal from './ProductStatsModal'; // NEW: Import Stats Modal

const ProductCard = React.memo(({ product, onPress, onOptionsPress, onQuickAction, viewMode = 'Grid', isSelected, selectionMode, onLongPress }) => {
    const isList = viewMode === 'Lista';
    const effectiveRentalPrice = product.rentalPrice || product.rentPrice;
    const hasRentalPrice = Boolean(effectiveRentalPrice && parseFloat(effectiveRentalPrice) > 0);

    // NEW: State for Quick Action Modal
    const [quickActionModalVisible, setQuickActionModalVisible] = React.useState(false);
    const [statsModalVisible, setStatsModalVisible] = React.useState(false); // NEW: State for Stats Modal
    const [selectedTransactionType, setSelectedTransactionType] = React.useState(null);

    // Context hooks for transaction creation
    // Note: We use a try-catch pattern or optional chaining in case the component is used outside the provider,
    // though in this app structure it should always be within FinanceProvider.
    let addSale, addRental;
    try {
        const finance = useFinance();
        addSale = finance.addSale;
        addRental = finance.addRental;
    } catch (e) {
        // Fallback or ignore if context is missing (development/testing)
        console.warn("ProductCard: FinanceContext not available");
    }

    // Alert context for styled modals
    let showActionSheet, showAlert;
    try {
        const alert = useAlert();
        showActionSheet = alert.showActionSheet;
        showAlert = alert.showAlert;
    } catch (e) {
        console.warn("ProductCard: AlertContext not available");
    }

    const generateTransactionRef = (type, adjustedValues = null) => {
        const now = new Date();

        // Use adjusted values if provided, otherwise default to product values
        const unitPrice = adjustedValues
            ? adjustedValues.price
            : (type === 'sale'
                ? (parseFloat(product.price) || 0)
                : (parseFloat(effectiveRentalPrice) || 0));

        const quantity = adjustedValues ? adjustedValues.quantity : 1;

        // Total is calculated in modal usually, but verify here
        const total = adjustedValues ? adjustedValues.total : (unitPrice * quantity);

        // Build the item object matching TransactionDetailScreen expectations
        const productItem = {
            productId: product.id,
            productName: product.name,
            quantity: quantity,
            unitPrice: unitPrice,
            total: total,
            // Include image if available for richer display
            image: product.image || null
        };

        const isInstallment = adjustedValues && adjustedValues.isInstallment;
        const installmentAmount = adjustedValues && adjustedValues.installmentAmount;

        const transactionData = {
            type, // 'sale' or 'rental'
            productName: product.name,
            productId: product.id,
            quantity: quantity,
            unitPrice: unitPrice,
            // Calculate correct amount based on type
            totalAmount: isInstallment ? (installmentAmount || 0) : total, // This is expected income
            date: now.toISOString(),
            // Items array with the product
            items: [productItem],
            // Additional fields for FinanceContext
            startDate: now.toISOString().split('T')[0], // For rentals
            status: 'active', // For rentals

            // Installment Support
            isInstallment: !!isInstallment,
            totalPrice: total, // Full price
            amountPaid: isInstallment ? (installmentAmount || 0) : total,
        };
        return transactionData;
    };

    const handleQuickActionConfirm = async (values) => {
        if (!selectedTransactionType) return;

        const transactionData = generateTransactionRef(selectedTransactionType, values);

        console.log(`Creando ${selectedTransactionType === 'sale' ? 'Venta' : 'Alquiler'} con valores ajustados:`, transactionData);

        if (selectedTransactionType === 'sale' && addSale) {
            try {
                await addSale(transactionData);
                showAlert('success', 'Éxito', 'Venta registrada correctamente');
            } catch (error) {
                showAlert('error', 'Error', 'No se pudo registrar la venta');
            }
        } else if (selectedTransactionType === 'rental' && addRental) {
            try {
                await addRental(transactionData);
                showAlert('success', 'Éxito', 'Alquiler registrado correctamente');
            } catch (error) {
                showAlert('error', 'Error', 'No se pudo registrar el alquiler');
            }
        }
    };

    const handleQuickAction = () => {
        if (onQuickAction) {
            onQuickAction(product);
        } else if (showActionSheet && showAlert) {
            // Use styled ActionSheetModal
            showActionSheet({
                title: "Acción Rápida",
                message: `¿Generar registro para ${product.name}?`,
                actions: [
                    {
                        text: "Venta",
                        icon: "shopping-cart",
                        onPress: () => {
                            setSelectedTransactionType('sale');
                            // Delay slightly to let ActionSheet close smoothly
                            setTimeout(() => setQuickActionModalVisible(true), 300);
                        }
                    },
                    {
                        text: "Alquiler",
                        icon: "package",
                        onPress: () => {
                            setSelectedTransactionType('rental');
                            // Delay slightly to let ActionSheet close smoothly
                            setTimeout(() => setQuickActionModalVisible(true), 300);
                        }
                    }
                ],
                cancelText: "Cancelar"
            });
        } else {
            // Fallback if AlertContext is not available (shouldn't happen in production)
            console.warn("AlertContext not available, action skipped");
        }
    };

    return (<>
        <TouchableOpacity
            style={[
                styles.card,
                isList && styles.cardList,
                isSelected && styles.cardSelected
            ]}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.8}
        >
            {/* Selection Checkbox/Indicator */}
            {selectionMode && (
                <View style={[styles.selectionIndicator, isSelected && styles.selectionIndicatorActive]}>
                    {isSelected && <Feather name="check" size={16} color="#FFFFFF" />}
                </View>
            )}

            {/* Image Section */}
            <View style={[styles.imageContainer, isList && styles.imageContainerList]}>
                {product.image ? (
                    <Image source={{ uri: product.image }} style={styles.image} />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Feather name="image" size={isList ? 24 : 32} color={COLORS.placeholder} />
                    </View>
                )}



                {/* Options Button (Grid only) */}
                {!isList && !selectionMode && (
                    <TouchableOpacity
                        style={styles.optionsButton}
                        onPress={onOptionsPress}
                    >
                        <View style={styles.optionsButtonBackground}>
                            <Feather name="more-vertical" size={20} color={COLORS.text} />
                        </View>
                    </TouchableOpacity>
                )}

                {/* Action Buttons Container (Grid only) - Bottom Right */}
                {!isList && !selectionMode && (
                    <View style={styles.actionButtonsContainerGrid}>
                        {/* Stats Button */}
                        <TouchableOpacity
                            style={styles.actionButtonGrid}
                            onPress={() => setStatsModalVisible(true)}
                        >
                            <View style={styles.statsButtonBackground}>
                                <Feather name="bar-chart-2" size={16} color={COLORS.text} />
                            </View>
                        </TouchableOpacity>

                        {/* Quick Action Button */}
                        <TouchableOpacity
                            style={[styles.actionButtonGrid, styles.quickActionGridButton]}
                            onPress={handleQuickAction}
                        >
                            <Feather name="shopping-cart" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Content Section */}
            <View style={[styles.content, isList && styles.contentList]}>
                <View style={isList ? styles.textContainerList : null}>
                    <Text style={[styles.name, isList && styles.nameList]} numberOfLines={1}>
                        {product.name}
                    </Text>

                    {product.description ? (
                        <Text style={styles.description} numberOfLines={isList ? 1 : 2}>
                            {product.description}
                        </Text>
                    ) : null}

                    {/* Price Container */}
                    <View style={[styles.pricesContainer, isList && styles.pricesContainerList]}>

                        {/* Sale Price Block */}
                        <View style={styles.priceBlock}>
                            <Text style={styles.priceLabelTop}>VENTA</Text>
                            <Text style={styles.salePriceValue}>
                                ${(product.price !== undefined && product.price !== null && product.price !== '') ? product.price : '0'}
                            </Text>
                        </View>

                        {/* Separator (List mode) */}
                        {isList && hasRentalPrice && <View style={styles.priceSeparator} />}

                        {/* Rental Price Block */}
                        {hasRentalPrice && (
                            <View style={[styles.priceBlock, !isList && styles.priceItemStacked]}>
                                <Text style={styles.rentalLabelTop}>ALQUILER</Text>
                                <Text style={styles.rentalPriceValue}>
                                    ${effectiveRentalPrice}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Action Buttons Container (List only) */}
                {isList && !selectionMode && (
                    <View style={styles.actionButtonsContainerList}>
                        {/* Stats Button */}
                        <TouchableOpacity
                            style={styles.statsButtonList}
                            onPress={() => setStatsModalVisible(true)}
                        >
                            <Feather name="bar-chart-2" size={18} color={COLORS.textSecondary} />
                        </TouchableOpacity>

                        {/* Quick Action Button */}
                        <TouchableOpacity
                            style={styles.quickActionList}
                            onPress={handleQuickAction}
                        >
                            <Feather name="shopping-cart" size={18} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Options Button (List only) */}
                {isList && !selectionMode && (
                    <TouchableOpacity
                        style={styles.optionsButtonList}
                        onPress={onOptionsPress}
                    >
                        <Feather name="more-vertical" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>

        {/* Quick Action Adjustment Modal */}
        <QuickActionModal
            visible={quickActionModalVisible}
            onClose={() => setQuickActionModalVisible(false)}
            onConfirm={handleQuickActionConfirm}
            transactionType={selectedTransactionType}
            product={product}
        />

        {/* Stats Modal */}
        <ProductStatsModal
            visible={statsModalVisible}
            onClose={() => setStatsModalVisible(false)}
            product={product}
        />
    </>
    );
});

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
        marginBottom: SPACING.lg,
        width: '48%',
        borderWidth: 0,
        borderColor: 'transparent',
        ...SHADOWS.card,
    },
    cardList: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.sm,
    },
    cardSelected: {
        borderColor: COLORS.primaryBorder,
        borderWidth: 1.5,
        backgroundColor: COLORS.primaryLight,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    selectionIndicator: {
        position: 'absolute',
        top: SPACING.sm,
        right: SPACING.sm,
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
        zIndex: 20,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.sm,
    },
    selectionIndicatorActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        borderWidth: 0,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
    },
    imageContainer: {
        height: SIZES.cardImageHeight,
        width: '100%',
        backgroundColor: COLORS.background,
        position: 'relative',
    },
    imageContainerList: {
        width: 80,
        height: 80,
        borderRadius: RADIUS.lg,
        marginRight: SPACING.md,
        aspectRatio: 1,
    },

    optionsButton: {
        position: 'absolute',
        top: SPACING.sm,
        right: SPACING.sm,
        zIndex: 10,
    },
    optionsButtonBackground: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: RADIUS.full,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    content: {
        padding: SPACING.md,
    },
    contentList: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 0,
    },
    textContainerList: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        color: COLORS.text,
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: '700',
        marginBottom: 2,
    },
    nameList: {
        marginBottom: 2,
    },
    description: {
        color: COLORS.textSecondary,
        fontSize: TYPOGRAPHY.size.xs,
        marginBottom: SPACING.xs,
        lineHeight: TYPOGRAPHY.lineHeight.tight,
    },
    pricesContainer: {
        marginTop: SPACING.xs,
        flexDirection: 'column',
    },
    pricesContainerList: {
        marginTop: SPACING.xs,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    priceBlock: {
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    priceItemStacked: {
        marginTop: SPACING.xs,
    },
    priceLabelTop: {
        fontSize: 10,
        color: COLORS.placeholder,
        fontWeight: '600',
        marginBottom: 0,
        textTransform: 'uppercase',
    },
    rentalLabelTop: {
        fontSize: 10,
        color: COLORS.placeholder,
        fontWeight: '600',
        marginBottom: 0,
        textTransform: 'uppercase',
    },
    salePriceValue: {
        color: COLORS.primary,
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: '700',
    },
    rentalPriceValue: {
        color: '#4A90E2',
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: '700',
    },
    priceSeparator: {
        width: 1,
        height: 24,
        backgroundColor: COLORS.border,
        marginHorizontal: SPACING.md,
    },
    optionsButtonList: {
        padding: SPACING.sm,
        marginLeft: SPACING.xs,
    },
    actionButtonsContainerGrid: {
        position: 'absolute',
        bottom: SPACING.sm,
        right: SPACING.sm,
        zIndex: 10,
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8, // Spacing between buttons
    },
    actionButtonGrid: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quickActionGridButton: {
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.full,
        ...SHADOWS.sm,
    },
    // Removidos estilos antiguos: quickActionGrid, statsButton
    statsButtonBackground: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: RADIUS.full,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.sm,
    },
    actionButtonsContainerList: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: SPACING.sm,
        gap: 6,
    },
    statsButtonList: {
        padding: 4, // Reduced padding
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.full,
        width: 32, // Smaller size for list
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quickActionList: {
        padding: 4, // Reduced padding
        backgroundColor: COLORS.primaryLight,
        borderRadius: RADIUS.full,
        width: 32, // Smaller size for list
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ProductCard;
