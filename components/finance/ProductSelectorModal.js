import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    Image,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, RADIUS } from '../../constants/Theme';
import { useData } from '../../context/DataContext';

const ProductSelectorModal = ({ visible, onClose, onConfirm, context = 'sale' }) => {
    const insets = useSafeAreaInsets();
    const { getAllInventoryProducts, sections } = useData(); // Get sections from context
    const [allProducts, setAllProducts] = useState([]);
    const [viewMode, setViewMode] = useState('sections'); // 'sections' | 'products'
    const [activeSectionId, setActiveSectionId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Multi-select state: { [id]: product }
    const [selectedProducts, setSelectedProducts] = useState({});

    // Dynamic Color Logic
    const CONTEXT_COLORS = {
        sale: '#22C55E',       // Green
        rental: '#3B82F6',     // Blue
        decoration: '#F97316', // Orange
        default: COLORS.primary
    };
    const accentColor = CONTEXT_COLORS[context] || CONTEXT_COLORS.default;

    const [isSearchFocused, setIsSearchFocused] = useState(false);

    useEffect(() => {
        if (visible) {
            loadProducts();
            setSearchQuery('');
            setViewMode('sections');
            setActiveSectionId(null);
            setSelectedProducts({}); // Reset selection on open
        }
    }, [visible]);

    const loadProducts = async () => {
        setIsLoading(true);
        try {
            const products = await getAllInventoryProducts();
            setAllProducts(products);
        } catch (error) {
            console.error("Error loading products:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Derived Data
    const displayedData = useMemo(() => {
        // 1. Search Mode: Global Search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            return allProducts.filter(p =>
                p.name.toLowerCase().includes(query) ||
                (p.description && p.description.toLowerCase().includes(query))
            );
        }

        // 2. Sections Mode
        if (viewMode === 'sections') {
            return sections;
        }

        // 3. Products in Section Mode
        if (viewMode === 'products' && activeSectionId) {
            return allProducts.filter(p => p.sectionId === activeSectionId);
        }

        return [];
    }, [searchQuery, viewMode, activeSectionId, allProducts, sections]);


    const getEffectivePrice = (item, localState = null) => {
        // If we have a local state with priceMode, use it
        if (localState && localState.priceMode) {
            return localState.priceMode === 'rent'
                ? (item.rentalPrice || item.rentPrice || 0)
                : (item.salePrice || item.price || 0);
        }

        // Fallback to context default
        if (context === 'sale') {
            return item.salePrice || item.price || 0;
        } else {
            // Rental or Decoration
            return item.rentalPrice || item.rentPrice || item.salePrice || item.price || 0;
        }
    };

    const handleSearch = (text) => {
        setSearchQuery(text);
        // If search is cleared, revert to sections view (or current view logic)
        // logic handled in displayedData useMemo
    };

    const handleSectionPress = (sectionId) => {
        setActiveSectionId(sectionId);
        setViewMode('products');
    };

    const handleBack = () => {
        if (searchQuery) {
            setSearchQuery('');
        } else {
            setViewMode('sections');
            setActiveSectionId(null);
        }
    };

    const toggleSelection = (product) => {
        setSelectedProducts(prev => {
            const newState = { ...prev };
            if (newState[product.id]) {
                delete newState[product.id];
            } else {
                // Initialize with default mode based on context
                const initialMode = context === 'rental' ? 'rent' : 'sale';
                newState[product.id] = {
                    ...product,
                    quantity: 1,
                    priceMode: initialMode
                };
            }
            return newState;
        });
    };

    const togglePriceMode = (productId) => {
        setSelectedProducts(prev => {
            const productState = prev[productId];
            if (!productState) return prev;

            const newMode = productState.priceMode === 'sale' ? 'rent' : 'sale';
            return {
                ...prev,
                [productId]: { ...productState, priceMode: newMode }
            };
        });
    };

    const updateQuantity = (productId, delta) => {
        setSelectedProducts(prev => {
            const product = prev[productId];
            if (!product) return prev;

            const newQuantity = (product.quantity || 1) + delta;
            if (newQuantity < 1) return prev; // Prevent going below 1

            return {
                ...prev,
                [productId]: { ...product, quantity: newQuantity }
            };
        });
    };

    const handleConfirm = () => {
        const selectedList = Object.values(selectedProducts).map(p => ({
            ...p,
            price: getEffectivePrice(p, p) // Pass the full object as localState to use priceMode
        }));

        if (selectedList.length > 0) {
            if (onConfirm) onConfirm(selectedList);
            onClose();
        }
    };

    const selectedCount = Object.keys(selectedProducts).length;

    // --- Render Items ---

    const renderSectionItem = ({ item }) => {
        // Calculate how many selected items are in this section
        const selectedInSection = Object.values(selectedProducts).filter(p => p.sectionId === item.id).length;

        return (
            <TouchableOpacity
                style={styles.sectionItem}
                onPress={() => handleSectionPress(item.id)}
                activeOpacity={0.7}
            >
                <View style={[styles.sectionImageContainer, { borderColor: selectedInSection > 0 ? accentColor : COLORS.border }]}>
                    {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.sectionImage} />
                    ) : (
                        <View style={styles.sectionPlaceholder}>
                            <Feather name="grid" size={24} color={COLORS.textMuted} />
                        </View>
                    )}
                </View>
                <View style={styles.sectionInfo}>
                    <Text style={styles.sectionName}>{item.name}</Text>
                    <Text style={styles.sectionCount}>{item.productCount || 0} productos</Text>
                </View>
                {selectedInSection > 0 ? (
                    <View style={[styles.sectionBadge, { backgroundColor: accentColor }]}>
                        <Text style={styles.sectionBadgeText}>{selectedInSection}</Text>
                    </View>
                ) : (
                    <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
                )}
            </TouchableOpacity>
        );
    };

    const renderProductItem = ({ item }) => {
        const selectedItem = selectedProducts[item.id];
        const isSelected = !!selectedItem;
        const quantity = selectedItem ? (selectedItem.quantity || 1) : 0;

        // Check availability of rent price
        const rentPrice = item.rentalPrice || item.rentPrice;
        const hasRentPrice = rentPrice && parseFloat(rentPrice) > 0;

        // Helper to check currently effective price for display
        const displayPrice = getEffectivePrice(item, selectedItem);

        // Current mode for this item
        const currentMode = selectedItem?.priceMode || (context === 'rental' ? 'rent' : 'sale');

        return (
            <TouchableOpacity
                style={[
                    styles.productItem,
                    isSelected && styles.productItemSelected,
                    isSelected && {
                        borderColor: accentColor,
                        backgroundColor: accentColor + '10'
                    }
                ]}
                onPress={() => toggleSelection(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.imageContainer, isSelected && { borderColor: accentColor }]}>
                    {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.productImage} />
                    ) : (
                        <View style={styles.placeholderImage}>
                            <Feather name="box" size={24} color={isSelected ? accentColor : COLORS.textMuted} />
                        </View>
                    )}
                </View>
                <View style={styles.productInfo}>
                    <Text style={[
                        styles.productName,
                        isSelected && { color: accentColor, fontWeight: 'bold' }
                    ]} numberOfLines={1}>{item.name}</Text>

                    {displayPrice ? (
                        <Text style={styles.productPrice}>
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(displayPrice)}
                            {isSelected && (
                                <Text style={styles.priceLabel}> ({currentMode === 'sale' ? 'Venta' : 'Alquiler'})</Text>
                            )}
                        </Text>
                    ) : (
                        <Text style={styles.noPrice}>Sin precio</Text>
                    )}

                    {/* Toggle Switch for Price Mode */}
                    {isSelected && hasRentPrice && (
                        <TouchableOpacity
                            style={styles.modeToggle}
                            onPress={(e) => {
                                e.stopPropagation();
                                togglePriceMode(item.id);
                            }}
                        >
                            <View style={[styles.modeOption, currentMode === 'sale' && styles.modeOptionActive]}>
                                <Text style={[styles.modeText, currentMode === 'sale' && styles.modeTextActive]}>Venta</Text>
                            </View>
                            <View style={[styles.modeOption, currentMode === 'rent' && styles.modeOptionActive]}>
                                <Text style={[styles.modeText, currentMode === 'rent' && styles.modeTextActive]}>Alquiler</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                {isSelected && (
                    <View style={styles.rightColumn}>
                        <View style={[styles.quantityControl, { backgroundColor: accentColor + '15' }]}>
                            <TouchableOpacity
                                style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(item.id, -1);
                                }}
                                disabled={quantity <= 1}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Feather name="minus" size={14} color={quantity <= 1 ? accentColor + '50' : accentColor} />
                            </TouchableOpacity>

                            <Text style={[styles.quantityText, { color: accentColor }]}>{quantity}</Text>

                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(item.id, 1);
                                }}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Feather name="plus" size={14} color={accentColor} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet" // iOS style
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    {(viewMode === 'products' && !searchQuery) ? (
                        <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
                            <Feather name="arrow-left" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 24 }} /> // Spacer
                    )}

                    <Text style={styles.title}>
                        {searchQuery ? 'Resultados' : (viewMode === 'sections' ? 'Categorías' : 'Productos')}
                    </Text>

                    <TouchableOpacity onPress={onClose} style={styles.iconButton}>
                        <Feather name="x" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                </View>

                <View style={[
                    styles.searchContainer,
                    isSearchFocused && { borderColor: accentColor }
                ]}>
                    <Feather name="search" size={20} color={accentColor} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar producto globalmente..."
                        placeholderTextColor={COLORS.textMuted}
                        value={searchQuery}
                        onChangeText={handleSearch}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        autoFocus={false}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => handleSearch('')}>
                            <Feather name="x-circle" size={16} color={COLORS.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>

                {isLoading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={accentColor} />
                    </View>
                ) : (
                    <FlatList
                        data={displayedData}
                        renderItem={(!searchQuery && viewMode === 'sections') ? renderSectionItem : renderProductItem}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.centerContainer}>
                                <Text style={styles.emptyText}>
                                    {searchQuery ? 'No se encontraron productos' : 'No hay elementos disponibles'}
                                </Text>
                            </View>
                        }
                    />
                )}

                {/* Footer with Confirm Button */}
                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                    <TouchableOpacity
                        style={[
                            styles.confirmButton,
                            { backgroundColor: selectedCount > 0 ? accentColor : COLORS.textMuted + '50' }, // Dynamic bg
                            selectedCount === 0 && styles.confirmButtonDisabled
                        ]}
                        onPress={handleConfirm}
                        disabled={selectedCount === 0}
                    >
                        <Text style={styles.confirmButtonText}>
                            {selectedCount > 0 ? `Agregar Seleccionados (${selectedCount})` : 'Selecciona productos'}
                        </Text>
                        {selectedCount > 0 && (
                            <View style={styles.countBadge}>
                                <Feather name="check" size={18} color="#FFF" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    title: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
    },
    iconButton: {
        padding: SPACING.xs,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        margin: SPACING.md,
        paddingHorizontal: SPACING.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        height: 48,
    },
    searchIcon: {
        marginRight: SPACING.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.text,
        height: '100%',
    },
    listContent: {
        padding: SPACING.md,
        paddingBottom: 100, // Space for footer
    },
    // Section Item Styles
    sectionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        marginBottom: SPACING.md,
        ...SHADOWS.small,
    },
    sectionImageContainer: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: COLORS.background,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
        borderWidth: 2,
    },
    sectionImage: {
        width: '100%',
        height: '100%',
    },
    sectionPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    sectionInfo: {
        flex: 1,
    },
    sectionName: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    sectionCount: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
    },
    sectionBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionBadgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    // Product Item Styles (unchanged mostly)
    productItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.small,
    },
    productItemSelected: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    imageContainer: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: COLORS.background,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    productInfo: {
        flex: 1,
        marginRight: SPACING.sm,
    },
    productName: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.text,
        marginBottom: 4,
    },
    productPrice: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.weight.medium,
    },
    noPrice: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textMuted,
        fontStyle: 'italic',
    },
    priceLabel: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.textMuted,
        fontWeight: 'normal',
    },
    modeToggle: {
        flexDirection: 'row',
        backgroundColor: COLORS.background,
        borderRadius: 16,
        padding: 2,
        marginTop: 6,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    modeOption: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 14,
    },
    modeOptionActive: {
        backgroundColor: COLORS.surface,
        borderRadius: 14, // Explicitly enforce radius for elevation/shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    modeText: {
        fontSize: 10,
        color: COLORS.textMuted,
        fontWeight: '600',
    },
    modeTextActive: {
        color: COLORS.primary,
    },
    rightColumn: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    emptyText: {
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    // Quantity Controls
    quantityControl: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '15', // Soft background (~10-15%)
        borderRadius: 24, // Pill shape
        paddingVertical: 4,
        paddingHorizontal: 6,
    },
    quantityButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
        ...SHADOWS.small,
    },
    quantityButtonDisabled: {
        opacity: 0.3, // Visual feedback for disabled state
        shadowOpacity: 0,
        elevation: 0,
    },
    quantityText: {
        fontSize: TYPOGRAPHY.size.base,
        fontWeight: 'bold',
        color: COLORS.primary,
        minWidth: 20,
        textAlign: 'center',
        marginHorizontal: 8,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: SPACING.lg,
        // paddingBottom is handled dynamically
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        ...SHADOWS.medium,
    },
    confirmButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        paddingHorizontal: SPACING.lg,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButtonDisabled: {
        backgroundColor: COLORS.textMuted, // Or a lighter gray
        opacity: 0.5,
        shadowOpacity: 0,
    },
    confirmButtonText: {
        color: '#FFF',
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.bold,
        marginRight: SPACING.xs,
    },
    countBadge: {
        marginLeft: 8,
    }
});

export default ProductSelectorModal;
