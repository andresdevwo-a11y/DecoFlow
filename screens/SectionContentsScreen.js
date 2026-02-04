import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SIZES } from '../constants/Theme';
import { useSettings } from '../context/SettingsContext';
import { useAlert } from '../context/AlertContext';
import Header from '../components/Header';
import SearchHeader from '../components/SearchHeader';

import ProductCard from '../components/ProductCard';
import ProductOptionsModal from '../components/ProductOptionsModal';
import ProductDetailsModal from '../components/ProductDetailsModal';

import FloatingActionButton from '../components/FloatingActionButton'; // Import FAB
import SelectionActionBar from '../components/SelectionActionBar';

export default function SectionContentsScreen({ section, products = [], onBack, onEditProduct, onDuplicateProduct, onDeleteProduct, onCreateProduct, onUpdateProduct }) {
    const { productViewMode, productSortBy, confirmProductDelete } = useSettings();
    const { showAlert, showDelete } = useAlert();

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isOptionsVisible, setOptionsVisible] = useState(false);
    const [isDetailsVisible, setDetailsVisible] = useState(false);

    // Removed local delete modals state (isDeleteModalVisible, isBatchDeleteVisible, isDeleteLoading)
    const [searchText, setSearchText] = useState('');

    // --- Selection Mode State ---
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedProductIds, setSelectedProductIds] = useState(new Set());
    // Removed isBatchDeleteVisible state

    // Sync selectedProduct with products updates to reflect changes in Modal immediately
    React.useEffect(() => {
        if (selectedProduct && products) {
            const updated = products.find(p => p.id === selectedProduct.id);
            if (updated && updated !== selectedProduct) {
                setSelectedProduct(updated);
            }
        }
    }, [products, selectedProduct]);

    const handleOptionsPress = useCallback((product) => {
        if (isSelectionMode) return;
        setSelectedProduct(product);
        setOptionsVisible(true);
    }, [isSelectionMode]);

    const closeOptions = useCallback(() => {
        setOptionsVisible(false);
        setSelectedProduct(null);
    }, []);

    const handleViewDetails = useCallback(() => {
        setOptionsVisible(false);
        setTimeout(() => {
            setDetailsVisible(true);
        }, 300);
    }, []);

    const handleEdit = useCallback(() => {
        setOptionsVisible(false);
        if (selectedProduct) {
            onEditProduct(selectedProduct);
        }
    }, [selectedProduct, onEditProduct]);

    // --- Batch Selection Handlers ---

    const toggleSelectionMode = useCallback((productId) => {
        setIsSelectionMode(true);
        setSelectedProductIds(new Set([productId]));
    }, []);

    const toggleSelection = useCallback((productId) => {
        setSelectedProductIds(prev => {
            const next = new Set(prev);
            if (next.has(productId)) {
                next.delete(productId);
            } else {
                next.add(productId);
            }
            if (next.size === 0) {
                setIsSelectionMode(false);
            }
            return next;
        });
    }, []);

    const cancelSelection = useCallback(() => {
        setIsSelectionMode(false);
        setSelectedProductIds(new Set());
    }, []);

    const handleBatchDeleteRequest = useCallback(() => {
        showDelete({
            title: `¿Eliminar ${selectedProductIds.size} productos?`,
            message: `Estás a punto de eliminar ${selectedProductIds.size} productos seleccionados. Esta acción no se puede deshacer.`,
            onConfirm: async () => {
                try {
                    const ids = Array.from(selectedProductIds);
                    for (const id of ids) {
                        await onDeleteProduct(id);
                    }
                    cancelSelection();
                } catch (error) {
                    showAlert("error", "Error", "No se pudieron eliminar algunos productos.");
                }
            }
        });
    }, [selectedProductIds, onDeleteProduct, cancelSelection, showDelete, showAlert]);


    const handleDuplicate = () => {
        if (selectedProduct) {
            onDuplicateProduct(selectedProduct);
        }
        closeOptions();
    };

    const handleDelete = useCallback(() => {
        setOptionsVisible(false);
        if (confirmProductDelete) {
            setTimeout(() => {
                showDelete({
                    title: "¿Eliminar producto?",
                    message: `¿Estás seguro de que quieres eliminar "${selectedProduct?.name}"? Esta acción no se puede deshacer.`,
                    onConfirm: async () => {
                        try {
                            if (selectedProduct) {
                                await onDeleteProduct(selectedProduct.id);
                                setSelectedProduct(null);
                            }
                        } catch (error) {
                            showAlert("error", "Error", "No se pudo eliminar el producto.");
                        }
                    }
                });
            }, 300);
        } else {
            if (selectedProduct) {
                onDeleteProduct(selectedProduct.id).catch(e => showAlert("error", "Error", "Fallo al eliminar"));
            }
            setSelectedProduct(null);
        }
    }, [confirmProductDelete, selectedProduct, onDeleteProduct, showDelete, showAlert]);
    const filteredProducts = useMemo(() => {
        let result = products.filter(product =>
            product.name.toLowerCase().includes(searchText.toLowerCase())
        );

        return result.sort((a, b) => {
            switch (productSortBy) {
                case 'Nombre':
                    return a.name.localeCompare(b.name);
                case 'Fecha':
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                case 'Modificación':
                    return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
                default:
                    return 0;
            }
        });
    }, [products, searchText, productSortBy]);

    const handleSearchChange = useCallback((text) => {
        setSearchText(text);
    }, []);

    const renderItem = useCallback(({ item }) => {
        const isSelected = selectedProductIds.has(item.id);

        return (
            <ProductCard
                product={item}
                onPress={() => {
                    if (isSelectionMode) {
                        toggleSelection(item.id);
                    } else {
                        setSelectedProduct(item);
                        setDetailsVisible(true);
                    }
                }}
                onLongPress={() => {
                    if (!isSelectionMode) {
                        toggleSelectionMode(item.id);
                    } else {
                        toggleSelection(item.id);
                    }
                }}
                onOptionsPress={() => handleOptionsPress(item)}
                viewMode={productViewMode}
                // Selection props
                selectionMode={isSelectionMode}
                isSelected={isSelected}
            />
        );
    }, [handleOptionsPress, productViewMode, isSelectionMode, selectedProductIds, toggleSelection, toggleSelectionMode]);

    const renderEmptyState = useCallback(() => (
        <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
                <Feather name={searchText ? "search" : "folder"} size={SIZES.iconEmpty} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>
                {searchText ? "No se encontraron productos" : "Esta sección está vacía"}
            </Text>
            <Text style={styles.emptySubtitle}>
                {searchText ? "Intenta con otro nombre" : "No hay archivos aquí todavía"}
            </Text>
        </View>
    ), [searchText]);

    return (
        <View style={styles.container}>
            <Header title={section?.name || 'Sección'} onBack={onBack} />

            <View style={styles.content}>
                <FlatList
                    data={filteredProducts}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    key={productViewMode}
                    numColumns={productViewMode === 'Grid' ? 2 : 1}
                    columnWrapperStyle={productViewMode === 'Grid' ? styles.row : null}
                    contentContainerStyle={[
                        styles.listContent,
                        filteredProducts.length === 0 && { flexGrow: 1 }
                    ]}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={8}
                    maxToRenderPerBatch={8}
                    windowSize={5}
                    extraData={{ isSelectionMode, selectedProductIds }}
                    ListHeaderComponent={
                        products.length > 0 ? (
                            <SearchHeader
                                title="Productos"
                                placeholder="Buscar producto..."
                                showSearch={!isSelectionMode}
                                searchText={searchText}
                                onSearchChange={handleSearchChange}
                            />
                        ) : null
                    }
                    ListEmptyComponent={renderEmptyState}
                />
            </View>

            {/* Selection Action Bar */}
            {isSelectionMode ? (
                <SelectionActionBar
                    selectedCount={selectedProductIds.size}
                    onClear={cancelSelection}
                    onDelete={handleBatchDeleteRequest}
                />
            ) : (
                <FloatingActionButton
                    label="Crear producto"
                    onPress={onCreateProduct}
                />
            )}

            <ProductOptionsModal
                visible={isOptionsVisible}
                onClose={closeOptions}
                productName={selectedProduct?.name}
                onViewDetails={handleViewDetails}
                onEdit={handleEdit}

                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
            />

            <ProductDetailsModal
                visible={isDetailsVisible}
                onClose={() => setDetailsVisible(false)}
                product={selectedProduct}
                onUpdateProduct={onUpdateProduct}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        width: '100%',
    },
    content: {
        flex: 1,
    },
    listContent: {
        padding: SPACING.xl,
        paddingBottom: 120,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    emptyIconContainer: {
        width: SIZES.iconContainerEmpty,
        height: SIZES.iconContainerEmpty,
        borderRadius: SIZES.iconContainerEmpty / 2,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
    },
    emptyTitle: {
        fontSize: TYPOGRAPHY.size['3xl'],
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        marginBottom: SPACING.sm + 2,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: TYPOGRAPHY.size.xl,
        color: COLORS.textSecondary,
        textAlign: 'center',
        maxWidth: 280,
        lineHeight: TYPOGRAPHY.lineHeight.normal,
    },
    row: {
        justifyContent: 'space-between',
    },
});
