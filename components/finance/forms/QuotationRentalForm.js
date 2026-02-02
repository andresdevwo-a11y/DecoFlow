import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Modal,
    Keyboard,
    Switch
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, SIZES, RADIUS } from '../../../constants/Theme';
import { useAlert } from '../../../context/AlertContext';
import { getLocalDateString } from '../../../utils/dateHelpers';
import CustomDatePicker from '../CustomDatePicker';
import ProductSelectorModal from '../ProductSelectorModal';
import ClientSelectorModal from '../ClientSelectorModal';
import ClientForm from './ClientForm';
import { upsertClient } from '../../../services/Database';

// Helper to sanitize currency values to pure numbers
const parseCurrencyToNumber = (value) => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    // Remove all non-numeric characters (points, commas, symbols)
    return Number(String(value).replace(/\D/g, ''));
};

const QuotationRentalForm = ({ initialValues, onSubmit, onCancel, submitLabel = 'Guardar Cotización', isSubmitting = false }) => {
    const insets = useSafeAreaInsets();
    const { showAlert } = useAlert();
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [rentalDescription, setRentalDescription] = useState('');
    const [clientData, setClientData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        documentId: ''
    });
    const [notes, setNotes] = useState('');
const [startDate, setStartDate] = useState(getLocalDateString());
    const [endDate, setEndDate] = useState('');

    // Memoizar minDate para evitar re-renders innecesarios
    const minEndDate = useMemo(() => {
        return startDate ? new Date(startDate) : undefined;
    }, [startDate]);

    const [modalVisible, setModalVisible] = useState(false); // Inventory Modal

    // Client Selection
    const [clientSelectorVisible, setClientSelectorVisible] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState(null);

    // Items State
    const [items, setItems] = useState([]);
    const [itemModalVisible, setItemModalVisible] = useState(false);
    const [editingItemId, setEditingItemId] = useState(null);
    const [tempItem, setTempItem] = useState({
        name: '',
        quantity: '1',
        price: '',
        source: 'manual',
        originalProductId: null
    });

    const THEME_COLOR = '#3B82F6'; // Blue for Rental

// Load initial values
    useEffect(() => {
        if (initialValues) {
            // Batch all state updates to prevent race conditions
            const newRentalDescription = initialValues.productName || '';
            let newClientData;
            
            if (initialValues.clientData) {
                try {
                    newClientData = typeof initialValues.clientData === 'string'
                        ? JSON.parse(initialValues.clientData)
                        : initialValues.clientData;
                } catch (e) {
                    console.error("Error parsing clientData in QuotationRentalForm:", e);
                    // Fallback
                    newClientData = { ...clientData, name: initialValues.customerName || '' };
                }
            } else {
                newClientData = { ...clientData, name: initialValues.customerName || '' };
            }

            const newNotes = initialValues.notes || '';
            const newStartDate = initialValues.startDate || initialValues.date || getLocalDateString();
            const newEndDate = initialValues.rentalEndDate || initialValues.endDate || '';

            // Update basic form fields
            setRentalDescription(newRentalDescription);
            setClientData(newClientData);
            setNotes(newNotes);
            setStartDate(newStartDate);
            setEndDate(newEndDate);

            // Handle items separately to avoid conflicts
            if (initialValues.items && Array.isArray(initialValues.items) && initialValues.items.length > 0) {
                // Ensure each item has a unique id for React keys
                const itemsWithIds = initialValues.items.map((item, index) => ({
                    ...item,
                    id: item.id || `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`
                }));
                setItems(itemsWithIds);
            } else if (initialValues.quantity && initialValues.unitPrice) {
                // Legacy support
                setItems([{
                    id: Date.now().toString(),
                    productName: initialValues.productName || 'Producto',
                    quantity: initialValues.quantity,
                    unitPrice: initialValues.unitPrice,
                    total: initialValues.quantity * initialValues.unitPrice,
                    source: initialValues.productId ? 'inventory' : 'manual',
                    productId: initialValues.productId
                }]);
            }
        }
    }, [initialValues]);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                setIsKeyboardVisible(true);
            }
        );
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => {
                setIsKeyboardVisible(false);
            }
        );

        return () => {
            keyboardDidHideListener.remove();
            keyboardDidShowListener.remove();
        };
    }, []);

    // Handlers
    const handleConfirmProductsFromInventory = (products) => {
        let addedCount = 0;
        let skippedCount = 0;

        products.forEach(product => {
            // Check for duplicates by productId
            const isDuplicate = items.some(item =>
                item.source === 'inventory' && item.productId === product.id
            );

            if (isDuplicate) {
                skippedCount++;
                return;
            }

            const price = parseCurrencyToNumber(product.price);
            const quantity = product.quantity || 1;
            const newItem = {
                id: Date.now().toString() + Math.random().toString(),
                productName: product.name,
                quantity: quantity,
                unitPrice: price,
                total: price * quantity,
                source: 'inventory',
                productId: product.id
            };

            setItems(prev => [...prev, newItem]);
            addedCount++;
        });

        // Show warning if duplicates were skipped
        if (skippedCount > 0) {
            showAlert("warning", "Productos duplicados",
                `${skippedCount} producto(s) ya estaban en la lista y fueron omitidos.`);
        }

        setModalVisible(false);
        setItemModalVisible(false); // Close manual entry modal if open
    };

    const handleAddNewItem = () => {
        setEditingItemId(null);
        setTempItem({ name: '', quantity: '1', price: '', source: 'manual', originalProductId: null });
        setItemModalVisible(true);
    };

    const handleEditItem = (item) => {
        setEditingItemId(item.id);
        setTempItem({
            name: item.productName,
            quantity: item.quantity.toString(),
            price: item.unitPrice.toString(),
            source: item.source || 'manual',
            originalProductId: item.productId || null
        });
        setItemModalVisible(true);
    };

    const handleDeleteItem = (id) => {
        Alert.alert(
            "Eliminar producto",
            "¿Estás seguro de eliminar este producto?",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Eliminar", style: "destructive", onPress: () => setItems(prev => prev.filter(i => i.id !== id)) }
            ]
        );
    };

    const saveItem = () => {
        if (!tempItem.name.trim()) {
            showAlert("error", "Error", "El nombre es obligatorio");
            return;
        }
        if (!tempItem.price || isNaN(parseFloat(tempItem.price)) || parseFloat(tempItem.price) < 0) {
            showAlert("error", "Error", "Precio inválido");
            return;
        }
        const qty = parseInt(tempItem.quantity);
        if (!qty || qty <= 0) {
            showAlert("error", "Error", "Cantidad inválida");
            return;
        }

        const price = parseFloat(tempItem.price);
        const newItem = {
            id: editingItemId || Date.now().toString() + Math.random().toString(),
            productName: tempItem.name.trim(),
            quantity: qty,
            unitPrice: price,
            total: qty * price,
            source: tempItem.source,
            productId: tempItem.originalProductId
        };

        if (editingItemId) {
            setItems(prev => prev.map(i => i.id === editingItemId ? newItem : i));
        } else {
            setItems(prev => [...prev, newItem]);
        }
        setItemModalVisible(false);
    };

    const calculateTotal = useCallback(() => {
        return items.reduce((sum, item) => sum + Number(item.total), 0);
    }, [items]);

    const totalAmount = calculateTotal();

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleSubmit = async () => {
        if (items.length === 0) {
            showAlert("error", "Error", "Debes agregar al menos un producto");
            return;
        }

        const title = rentalDescription.trim() || items[0].productName;

        const formData = {
            productName: title,
            items: items,
            discount: 0,
            totalAmount: totalAmount,
            customerName: clientData.name.trim(),
            clientData: clientData,
            notes: notes.trim() || null,
            startDate: startDate,
            endDate: endDate || null,
            // Quotation specifics
            isInstallment: false,
            totalPrice: totalAmount,
            amountPaid: 0
        };

        try {
            // Upsert client to dedicated table OR use selected existing client
            if (!selectedClientId) {
                if (clientData.name.trim()) {
                    const savedClient = await upsertClient(clientData);
                    onSubmit({
                        ...formData,
                        clientId: savedClient.id
                    });
                } else {
                    onSubmit({
                        ...formData,
                        clientId: null
                    });
                }
            } else {
                onSubmit({
                    ...formData,
                    clientId: selectedClientId
                });
            }
        } catch (error) {
            console.error("Error saving client:", error);
            onSubmit({
                ...formData,
                clientId: selectedClientId || null
            });
        }
    };

    // Client Handlers
    const handleSelectClient = (client) => {
        setClientData({
            name: client.name,
            phone: client.phone || '',
            email: client.email || '',
            address: client.address || '',
            documentId: client.documentId || ''
        });
        setSelectedClientId(client.id);
    };

    const handleClearSelection = () => {
        setSelectedClientId(null);
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 180 : 0}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* SECCIÓN 1: GENERAL */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>1. General</Text>
                        <Text style={styles.label}>Descripción de la Cotización (Opcional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: Cotización de Equipo..."
                            placeholderTextColor={COLORS.textMuted}
                            value={rentalDescription}
                            onChangeText={setRentalDescription}
                        />
                    </View>

                    {/* SECCIÓN 2: DATOS DEL CLIENTE */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>2. Datos del Cliente</Text>
                        <ClientForm
                            values={clientData}
                            onChange={setClientData}
                            selectedClientId={selectedClientId}
                            onOpenSelector={() => setClientSelectorVisible(true)}
                            onClearSelection={handleClearSelection}
                        />
                    </View>

                    {/* SECCIÓN 3: TEMPORALIDAD */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>3. Temporalidad</Text>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: SPACING.sm }}>
<CustomDatePicker
                                    label="Fecha inicio"
                                    date={startDate}
                                    onDateChange={setStartDate}
                                />
                            </View>

                            <View style={{ flex: 1 }}>
<CustomDatePicker
                                    label="Fecha Entrega (opcional)"
                                    date={endDate}
                                    placeholder="Sin definir"
                                    minDate={minEndDate}
                                    onDateChange={setEndDate}
                                />
                            </View>
                        </View>
                    </View>

                    {/* SECCIÓN 4: INVENTARIO */}
                    <View style={styles.sectionContainer}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md }}>
                            <Text style={[styles.sectionTitle, { marginBottom: 0, borderBottomWidth: 0 }]}>4. Inventario ({items.length})</Text>
                            <TouchableOpacity onPress={handleAddNewItem}>
                                <Text style={{ color: THEME_COLOR, fontWeight: TYPOGRAPHY.weight.bold }}>
                                    + Agregar
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {items.length === 0 ? (
                            <View style={styles.emptyItemsContainer}>
                                <Text style={styles.emptyItemsText}>No has agregado productos</Text>
                            </View>
                        ) : (
                            <View style={styles.itemsContainer}>
                                <ScrollView nestedScrollEnabled={true}>
                                    {items.map((item) => (
                                        <View key={item.id} style={styles.itemCard}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.itemName}>{item.productName}</Text>
                                                <Text style={styles.itemDetails}>
                                                    {item.quantity} x {formatCurrency(item.unitPrice)}
                                                </Text>
                                            </View>
                                            <View style={{ alignItems: 'flex-end', marginRight: SPACING.md }}>
                                                <Text style={styles.itemTotal}>{formatCurrency(item.total)}</Text>
                                            </View>
                                            <View style={styles.itemActions}>
                                                <TouchableOpacity onPress={() => handleEditItem(item)} style={{ padding: 4 }}>
                                                    <Feather name="edit-2" size={18} color={COLORS.textMuted} />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => handleDeleteItem(item.id)} style={{ padding: 4, marginLeft: 8 }}>
                                                    <Feather name="trash-2" size={18} color={COLORS.error} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>

                    {/* SECCIÓN 5: CIERRE */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>5. Cierre</Text>

                        <Text style={styles.label}>Notas (opcional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Notas adicionales..."
                            placeholderTextColor={COLORS.textMuted}
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            numberOfLines={3}
                        />

                        <View style={{ height: SPACING.lg }} />

                        <View style={[styles.totalContainer, { backgroundColor: '#3B82F620', borderColor: '#3B82F6', marginBottom: 0 }]}>
                            <View>
                                <Text style={styles.totalLabel}>Total Cotizado</Text>
                            </View>
                            <Text style={styles.totalAmount}>{formatCurrency(totalAmount)}</Text>
                        </View>
                    </View>

                    {/* Spacing for bottom button */}
                    <View style={{ height: 180 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer */}
            {!isKeyboardVisible && (
                <View style={[
                    styles.footer,
                    {
                        height: SIZES.navBarHeight + insets.bottom,
                        paddingBottom: insets.bottom,
                        paddingHorizontal: SPACING.lg,
                    }
                ]}>
                    {onCancel && (
                        <TouchableOpacity
                            style={[styles.cancelButton]}
                            onPress={onCancel}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            isSubmitting && styles.submitButtonDisabled,
                            onCancel ? { flex: 1, marginLeft: SPACING.md } : { width: '100%' }
                        ]}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        <Feather name="check" size={20} color="#FFF" />
                        <Text style={styles.submitButtonText}>
                            {isSubmitting ? 'Guardando...' : submitLabel}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            <ProductSelectorModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onConfirm={handleConfirmProductsFromInventory}
                context="rental"
            />

            <ClientSelectorModal
                visible={clientSelectorVisible}
                onClose={() => setClientSelectorVisible(false)}
                onSelect={handleSelectClient}
            />

            {/* Add/Edit Item Modal */}
            <Modal
                visible={itemModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setItemModalVisible(false)}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingItemId ? 'Editar Producto' : 'Agregar Producto'}</Text>
                            <TouchableOpacity onPress={() => setItemModalVisible(false)}>
                                <Feather name="x" size={24} color={COLORS.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 400 }}>
                            <View style={styles.section}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs }}>
                                    <Text style={styles.label}>Producto *</Text>
                                    <TouchableOpacity onPress={() => setModalVisible(true)}>
                                        <Text style={{ color: THEME_COLOR, fontWeight: '600' }}>Buscar en Inventario</Text>
                                    </TouchableOpacity>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    value={tempItem.name}
                                    onChangeText={(t) => setTempItem(prev => ({ ...prev, name: t, source: 'manual' }))}
                                    placeholder="Nombre del producto"
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.section, { flex: 1, marginRight: SPACING.md }]}>
                                    <Text style={styles.label}>Cantidad *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={tempItem.quantity}
                                        onChangeText={(t) => setTempItem(prev => ({ ...prev, quantity: t }))}
                                        placeholder="1"
                                        keyboardType="number-pad"
                                    />
                                </View>
                                <View style={[styles.section, { flex: 1 }]}>
                                    <Text style={styles.label}>Precio Alquiler *</Text>
                                    <View style={styles.currencyInput}>
                                        <Text style={styles.currencySymbol}>$</Text>
                                        <TextInput
                                            style={styles.currencyTextInput}
                                            value={tempItem.price}
                                            onChangeText={(t) => setTempItem(prev => ({ ...prev, price: t }))}
                                            placeholder="0"
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: THEME_COLOR, marginTop: SPACING.md }]}
                            onPress={saveItem}
                        >
                            <Text style={styles.submitButtonText}>{editingItemId ? 'Actualizar' : 'Agregar'}</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

export default QuotationRentalForm;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: SPACING.lg,
    },
    section: {
        marginBottom: SPACING.lg,
    },
    label: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
    },
    input: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: SPACING.md,
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    currencyInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        paddingHorizontal: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    currencySymbol: {
        fontSize: TYPOGRAPHY.size.lg,
        color: COLORS.textMuted,
        marginRight: SPACING.xs,
    },
    currencyTextInput: {
        flex: 1,
        paddingVertical: SPACING.md,
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.text,
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#3B82F620',
        borderRadius: 12,
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
        borderWidth: 2,
        borderColor: '#3B82F6',
    },
    totalLabel: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
    },
    totalAmount: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: '#3B82F6',
    },
    row: {
        flexDirection: 'row',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.navBar,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: SPACING.xl,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: '#FFF',
        marginLeft: SPACING.sm,
    },
    cancelButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 14,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cancelButtonText: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.bind,
        color: COLORS.textSecondary,
    },
    sectionContainer: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.size.base,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        marginBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: SPACING.xs
    },
    emptyItemsContainer: {
        backgroundColor: COLORS.surface,
        padding: SPACING.lg,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed'
    },
    emptyItemsText: {
        color: COLORS.textMuted,
        fontSize: TYPOGRAPHY.size.md
    },
    itemsContainer: {
        maxHeight: 250,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden'
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.surface
    },
    itemName: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2
    },
    itemDetails: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textMuted
    },
    itemTotal: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: '700',
        color: COLORS.text
    },
    itemActions: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: SPACING.xl,
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        padding: SPACING.lg,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    modalTitle: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
    },
});
