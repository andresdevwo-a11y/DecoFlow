import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, SIZES } from '../constants/Theme';
import { useFinance } from '../context/FinanceContext';
import { useAlert } from '../context/AlertContext';
import QuickActionModal from './QuickActionModal';
import ProductStatsModal from './ProductStatsModal';

const ProductCard = React.memo(({ product, onPress, onOptionsPress, onQuickAction, viewMode = 'Grid', isSelected, selectionMode, onLongPress }) => {
    const isList = viewMode === 'Lista';
    const effectiveRentalPrice = product.rentalPrice || product.rentPrice;
    const hasRentalPrice = Boolean(effectiveRentalPrice && parseFloat(effectiveRentalPrice) > 0);

    const [quickActionModalVisible, setQuickActionModalVisible] = React.useState(false);
    const [statsModalVisible, setStatsModalVisible] = React.useState(false);
    const [selectedTransactionType, setSelectedTransactionType] = React.useState(null);

    let addSale, addRental;
    try {
        const finance = useFinance();
        addSale = finance.addSale;
        addRental = finance.addRental;
    } catch (e) {
        // Fallback
    }

    let showActionSheet, showAlert;
    try {
        const alert = useAlert();
        showActionSheet = alert.showActionSheet;
        showAlert = alert.showAlert;
    } catch (e) {
        // Fallback
    }

    const generateTransactionRef = (type, adjustedValues = null) => {
        const now = new Date();
        const unitPrice = adjustedValues
            ? adjustedValues.price
            : (type === 'sale'
                ? (parseFloat(product.price) || 0)
                : (parseFloat(effectiveRentalPrice) || 0));

        const quantity = adjustedValues ? adjustedValues.quantity : 1;
        const total = adjustedValues ? adjustedValues.total : (unitPrice * quantity);

        const productItem = {
            productId: product.id,
            productName: product.name,
            quantity: quantity,
            unitPrice: unitPrice,
            total: total,
            image: product.image || null
        };

        const isInstallment = adjustedValues && adjustedValues.isInstallment;
        const installmentAmount = adjustedValues && adjustedValues.installmentAmount;

        return {
            type,
            productName: product.name,
            productId: product.id,
            quantity: quantity,
            unitPrice: unitPrice,
            totalAmount: isInstallment ? (installmentAmount || 0) : total,
            date: now.toISOString().split('T')[0],
            items: [productItem],
            startDate: now.toISOString().split('T')[0],
            status: 'active',
            isInstallment: !!isInstallment,
            totalPrice: total,
            amountPaid: isInstallment ? (installmentAmount || 0) : total,
        };
    };

    const handleQuickActionConfirm = async (values) => {
        if (!selectedTransactionType) return;
        const transactionData = generateTransactionRef(selectedTransactionType, values);

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
            showActionSheet({
                title: "Acción Rápida",
                message: `¿Generar registro para ${product.name}?`,
                actions: [
                    {
                        text: "Venta",
                        icon: "shopping-cart",
                        onPress: () => {
                            setSelectedTransactionType('sale');
                            setTimeout(() => setQuickActionModalVisible(true), 300);
                        }
                    },
                    {
                        text: "Alquiler",
                        icon: "package",
                        onPress: () => {
                            setSelectedTransactionType('rental');
                            setTimeout(() => setQuickActionModalVisible(true), 300);
                        }
                    }
                ],
                cancelText: "Cancelar"
            });
        }
    };

    const formatPrice = (price) => {
        if (!price) return '$0';
        return price.toString().startsWith('$') ? price : `$${price}`;
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
            activeOpacity={0.7}
        >
            {/* Selection Checkbox/Indicator */}
            {selectionMode && (
                <View style={[styles.selectionIndicator, isSelected && styles.selectionIndicatorActive]}>
                    {isSelected && <Feather name="check" size={12} color="#FFFFFF" />}
                </View>
            )}

            {/* Image Section */}
            <View style={[styles.imageContainer, isList && styles.imageContainerList]}>
                {product.image ? (
                    <Image source={{ uri: product.image }} style={styles.image} />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Feather name="image" size={isList ? 24 : 36} color={COLORS.primary + '40'} />
                    </View>
                )}

                {/* Grid Mode Gradient Overlay for better text readability if we were putting text over image, 
                    but here we use it for buttons contrast */}
                {!isList && (
                    <View style={styles.imageOverlay} />
                )}

                {/* Floating Actions (Grid only) */}
                {!isList && !selectionMode && (
                    <View style={styles.floatingActions}>
                        <TouchableOpacity
                            style={styles.floatingOptionsButton}
                            onPress={() => setStatsModalVisible(true)}
                        >
                            <Feather name="bar-chart-2" size={16} color={COLORS.text} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.floatingActionButton}
                            onPress={handleQuickAction}
                        >
                            <Feather name="shopping-bag" size={16} color={COLORS.surface} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.floatingOptionsButton}
                            onPress={onOptionsPress}
                        >
                            <Feather name="more-horizontal" size={18} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Content Section */}
            <View style={[styles.content, isList && styles.contentList]}>
                <View style={isList ? styles.textContainerList : styles.textContainerGrid}>
                    <Text style={[styles.name, isList && styles.nameList]} numberOfLines={1}>
                        {product.name}
                    </Text>

                    {/* Price Config */}
                    <View style={[styles.pricesContainer, isList && styles.pricesContainerList]}>
                        <View style={styles.priceItem}>
                            <Text style={styles.priceLabel}>VENTA</Text>
                            <Text style={styles.salePrice}>
                                {formatPrice(product.price)}
                            </Text>
                        </View>

                        {hasRentalPrice && (
                            <>
                                {isList && <View style={styles.priceDivider} />}
                                <View style={[styles.priceItem, !isList && styles.priceItemMargin]}>
                                    <Text style={styles.priceLabel}>ALQUILER</Text>
                                    <Text style={styles.rentalPrice}>
                                        {formatPrice(effectiveRentalPrice)}
                                    </Text>
                                </View>
                            </>
                        )}
                    </View>
                </View>

                {/* List Actions */}
                {isList && !selectionMode && (
                    <View style={styles.actionsList}>
                        <View style={styles.actionColumn}>
                            <TouchableOpacity
                                style={styles.actionButtonList}
                                onPress={() => setStatsModalVisible(true)}
                            >
                                <Feather name="bar-chart-2" size={16} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.actionButtonList}
                                onPress={handleQuickAction}
                            >
                                <Feather name="shopping-bag" size={16} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={styles.actionButtonOptions}
                            onPress={onOptionsPress}
                        >
                            <Feather name="more-vertical" size={20} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </TouchableOpacity>

        <QuickActionModal
            visible={quickActionModalVisible}
            onClose={() => setQuickActionModalVisible(false)}
            onConfirm={handleQuickActionConfirm}
            transactionType={selectedTransactionType}
            product={product}
        />

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
        borderRadius: RADIUS.xl, // 24px
        marginBottom: SPACING.lg,
        width: '48%',
        borderWidth: 1.5, // Consistent width to prevent jump
        borderColor: 'transparent', // Hidden by default
        ...SHADOWS.card,
        elevation: 2, // Softer native shadow
        shadowOpacity: 0.06, // Softer iOS shadow
        shadowRadius: 10,
    },
    cardList: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.sm,
    },
    cardSelected: {
        backgroundColor: COLORS.primary + '05', // Match NotesScreen
        borderColor: COLORS.primary,
        borderWidth: 1.5,
        // Match NotesScreen shadow removal
        shadowColor: 'transparent',
        shadowOpacity: 0,
        elevation: 0,
    },
    selectionIndicator: {
        position: 'absolute',
        top: SPACING.md,
        right: SPACING.md,
        width: 20, // Match NotesScreen size
        height: 20, // Match NotesScreen size
        borderRadius: 4, // Match NotesScreen (Square)
        borderWidth: 2,
        borderColor: COLORS.textMuted, // Match NotesScreen unselected border
        backgroundColor: 'rgba(255,255,255,0.9)', // High contrast background
        zIndex: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectionIndicatorActive: {
        backgroundColor: COLORS.primary, // Match NotesScreen
        borderColor: COLORS.primary, // Match NotesScreen
        opacity: 1,
    },
    imageContainer: {
        height: 145, // Slightly taller
        width: '100%',
        backgroundColor: COLORS.background,
        position: 'relative',
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        overflow: 'hidden',
    },
    imageContainerList: {
        width: 80,
        height: 80,
        borderRadius: RADIUS.lg,
        // Explicitly set all corners to override Grid style inheritance
        borderTopLeftRadius: RADIUS.lg,
        borderTopRightRadius: RADIUS.lg,
        borderBottomLeftRadius: RADIUS.lg,
        borderBottomRightRadius: RADIUS.lg,
        marginRight: SPACING.md,
        aspectRatio: 1,
        overflow: 'hidden',
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
        backgroundColor: '#F8FAFC',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'linear-gradient(180deg, rgba(0,0,0,0) 70%, rgba(0,0,0,0.05) 100%)', // Subtle finish
    },
    floatingActions: {
        position: 'absolute',
        top: SPACING.sm,
        right: SPACING.sm,
        flexDirection: 'column',
        gap: 8,
    },
    floatingActionButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    floatingOptionsButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#FFFFFF', // Solid white
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08, // Very subtle
        shadowRadius: 2,
        elevation: 2,
    },
    content: {
        padding: SPACING.md,
        paddingTop: SPACING.sm + 4,
    },
    contentList: {
        flex: 1,
        padding: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: SPACING.sm,
    },
    textContainerGrid: {
        flexDirection: 'column',
    },
    textContainerList: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        color: COLORS.text,
        fontSize: TYPOGRAPHY.size.base,
        fontWeight: 'bold', // Stronger name
        marginBottom: SPACING.xs,
        letterSpacing: -0.2, // Tighter modern implementation
    },
    nameList: {
        fontSize: TYPOGRAPHY.size.lg,
        marginBottom: 4,
    },
    pricesContainer: {
        flexDirection: 'column',
        marginTop: 4,
    },
    pricesContainerList: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    priceItem: {
        flexDirection: 'column',
    },
    priceItemMargin: {
        marginTop: 6,
    },
    priceLabel: {
        fontSize: 9, // Small concise label
        color: COLORS.textMuted,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    salePrice: {
        color: COLORS.text, // Darker for high contrast
        fontSize: 15,
        fontWeight: '800',
    },
    rentalPrice: {
        color: COLORS.primary, // Color for rental
        fontSize: 15,
        fontWeight: '700',
    },
    priceDivider: {
        width: 1,
        height: 24,
        backgroundColor: COLORS.border,
        marginHorizontal: SPACING.lg,
    },
    actionsList: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm, // Add explicit gap between column and options button
        height: '100%', // Ensure it takes full height for centering
        justifyContent: 'center',
    },
    actionColumn: {
        flexDirection: 'column',
        gap: 8, // Increase vertical gap effectively
        marginRight: 2, // Slight extra breathing room
        justifyContent: 'center', // Center buttons vertically in column
        alignItems: 'center', // Center buttons horizontally in column
    },
    actionButtonList: {
        padding: 6,
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.full,
    },
    actionButtonOptions: {
        padding: 6,
        backgroundColor: 'transparent', // No background
        borderRadius: RADIUS.full,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default ProductCard;
