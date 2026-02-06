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
import { upsertClient } from '../../../services/Database';
import { getLocalDateString } from '../../../utils/dateHelpers';
import CustomDatePicker from '../CustomDatePicker';
import ProductSelectorModal from '../ProductSelectorModal';
import ClientSelectorModal from '../ClientSelectorModal';
import ClientForm from './ClientForm';

// Helper to sanitize currency values to pure numbers
const parseCurrencyToNumber = (value) => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    // Remove all non-numeric characters (points, commas, symbols)
    // This assumes prices are integers as per CO currency format
    return Number(String(value).replace(/\D/g, ''));
};

const SaleForm = ({ initialValues, onSubmit, onCancel, submitLabel = 'Guardar Venta', isSubmitting = false }) => {
    const insets = useSafeAreaInsets();
    const { showAlert } = useAlert();
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [saleDescription, setSaleDescription] = useState('');
    const [clientData, setClientData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        documentId: ''
    });
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(getLocalDateString());
    const [deliveryDate, setDeliveryDate] = useState('');

    // Memoizar minDate para evitar re-renders innecesarios
    const minDeliveryDate = useMemo(() => {
        return date ? new Date(date) : undefined;
    }, [date]);


    // Installment payment state
    const [isInstallment, setIsInstallment] = useState(false);
    const [installmentAmount, setInstallmentAmount] = useState('0');

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
        source: 'manual', // 'manual' | 'inventory'
        originalProductId: null // if from inventory
    });

    // Theme Colors
    const THEME_COLOR = COLORS.sale; // Green for Sale

    // Load initial values
    useEffect(() => {
        if (initialValues) {
            // Batch all state updates to prevent race conditions
            const newSaleDescription = initialValues.productName || '';
            const newClientData = initialValues.clientData || { ...clientData, name: initialValues.customerName || '' };
            const newNotes = initialValues.notes || '';
            const newDate = initialValues.date || getLocalDateString();
            const newDeliveryDate = initialValues.deliveryDate || '';

            // Update basic form fields
            setSaleDescription(newSaleDescription);
            setClientData(newClientData);
            setNotes(newNotes);
            setDate(newDate);
            setDeliveryDate(newDeliveryDate);

            // Cargar campos de abonos
            if (initialValues.isInstallment) {
                setIsInstallment(true);
                // Si hay amountPaid y totalPrice, el abono actual es amountPaid
                // En modo edición, queremos mostrar lo que el usuario puede abonar nuevamente
                setInstallmentAmount(String(initialValues.amountPaid || 0));
            }

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
                id: Date.now().toString() + Math.random().toString(), // Ensure unique ID
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
        const subtotal = items.reduce((sum, item) => sum + Number(item.total), 0);
        return Math.max(0, subtotal);
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

        // Validate client name only if we plan to create a client?
        // Requirement: Client name is NOT mandatory.
        // If not provided, we just don't save a client reference or we save a null customerName?
        // Let's allow empty name.


        // Validate installment amount
        const installmentAmountNum = parseFloat(installmentAmount) || 0;
        if (isInstallment && installmentAmountNum > totalAmount) {
            showAlert("error", "Error", "El abono no puede ser mayor al valor total del producto");
            return;
        }

        const title = saleDescription.trim() || items[0].productName;

        // Calculate the actual amount to register as income
        const amountToRegister = isInstallment ? installmentAmountNum : totalAmount;

        const formData = {
            productName: title,
            items: items,
            discount: 0,
            totalAmount: amountToRegister, // This is what gets added to income
            customerName: clientData.name.trim() || null,
            clientData: clientData,
            notes: notes.trim() || null,
            date: date,
            deliveryDate: deliveryDate || null,
            // Installment fields
            isInstallment: isInstallment,
            totalPrice: totalAmount, // Store the full price for reference
            amountPaid: amountToRegister // Track how much has been paid
        };


        try {
            // Upsert client to dedicated table OR use selected existing client
            // Upsert client to dedicated table OR use selected existing client
            if (!selectedClientId) {
                // CASE A: New client (or manual entry)
                // Only upsert if name is provided
                if (clientData.name.trim()) {
                    const savedClient = await upsertClient(clientData);
                    onSubmit({
                        ...formData,
                        clientId: savedClient.id
                    });
                } else {
                    // No client to save
                    onSubmit({
                        ...formData,
                        clientId: null
                    });
                }
            } else {

                // CASE B: Existing client selected -> Use selectedClientId
                onSubmit({
                    ...formData,
                    clientId: selectedClientId
                });
            }
        } catch (error) {
            console.error("Error saving client:", error);
            // Fallback for safety - submit without clientId if DB fails?
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
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* SECCIÓN 1: IDENTIFICACIÓN */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>1. Identificación</Text>
                        <Text style={styles.label}>Descripción de la Venta (Opcional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: Venta de Equipos..."
                            placeholderTextColor={COLORS.textMuted}
                            value={saleDescription}
                            onChangeText={setSaleDescription}
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

                    {/* SECCIÓN 3: ÍTEMS DE VENTA */}
                    <View style={styles.sectionContainer}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md }}>
                            <Text style={[styles.sectionTitle, { marginBottom: 0, borderBottomWidth: 0 }]}>3. Ítems de Venta ({items.length})</Text>
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

                    {/* SECCIÓN 4: RESUMEN FINANCIERO Y CIERRE */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>4. Cierre de Venta</Text>

                        {/* Fecha y Descuento en Fila -> Ahora Fecha de Venta y Fecha de Entrega */}
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: SPACING.md }}>
                                <CustomDatePicker
                                    label="Fecha de Venta"
                                    date={date}
                                    onDateChange={setDate}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <CustomDatePicker
                                    label="Fecha de Entrega"
                                    date={deliveryDate}
                                    onDateChange={setDeliveryDate}
                                    placeholder="Sin definir"
                                    minDate={minDeliveryDate}
                                />
                            </View>
                        </View>

                        <View style={{ height: SPACING.lg }} />

                        {/* Notas */}
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

                        {/* Installment Payment Toggle */}
                        <View style={styles.installmentContainer}>
                            <View style={styles.installmentToggleRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.installmentLabel}>Pago por Abonos</Text>
                                    <Text style={styles.installmentHint}>Activa si el cliente pagará en cuotas</Text>
                                </View>
                                <Switch
                                    value={isInstallment}
                                    onValueChange={setIsInstallment}
                                    trackColor={{ false: COLORS.border, true: THEME_COLOR + '50' }}
                                    thumbColor={isInstallment ? THEME_COLOR : COLORS.textMuted}
                                />
                            </View>

                            {isInstallment && (
                                <View style={styles.installmentAmountContainer}>
                                    <Text style={styles.label}>Monto Abonado</Text>
                                    <View style={[styles.currencyInput, { borderColor: THEME_COLOR }]}>
                                        <Text style={[styles.currencySymbol, { color: THEME_COLOR }]}>$</Text>
                                        <TextInput
                                            style={styles.currencyTextInput}
                                            placeholder="0"
                                            placeholderTextColor={COLORS.textMuted}
                                            value={installmentAmount}
                                            onChangeText={setInstallmentAmount}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <Text style={styles.installmentBalanceText}>
                                        Saldo pendiente: {formatCurrency(Math.max(0, totalAmount - (parseFloat(installmentAmount) || 0)))}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={{ height: SPACING.lg }} />

                        {/* Total */}
                        <View style={[styles.totalContainer, { marginBottom: 0, backgroundColor: THEME_COLOR + '15', borderColor: THEME_COLOR }]}>
                            <Text style={styles.totalLabel}>{isInstallment ? 'Total del Producto' : 'Total a Pagar'}</Text>
                            <Text style={[styles.totalAmount, { color: THEME_COLOR }]}>{formatCurrency(totalAmount)}</Text>
                        </View>

                        {isInstallment && (
                            <View style={[styles.totalContainer, { marginTop: SPACING.sm, backgroundColor: '#8B5CF6' + '15', borderColor: '#8B5CF6' }]}>
                                <Text style={styles.totalLabel}>Abono Actual</Text>
                                <Text style={[styles.totalAmount, { color: '#8B5CF6' }]}>{formatCurrency(parseFloat(installmentAmount) || 0)}</Text>
                            </View>
                        )}
                    </View>

                    {/* Spacing for bottom button */}
                    <View style={{ height: 100 }} />
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
                context="sale"
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
                                    <Text style={styles.label}>Precio Unitario *</Text>
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

export default SaleForm;

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
    radioGroup: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    radioOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    radioOptionSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '10',
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.textMuted,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.sm,
    },
    radioSelected: {
        borderColor: COLORS.primary,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
    },
    radioLabel: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.text,
    },
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    selectorText: {
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.text,
    },
    selectorPlaceholder: {
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.textMuted,
    },
    row: {
        flexDirection: 'row',
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
        backgroundColor: COLORS.primary + '15',
        borderRadius: 12,
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    totalLabel: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
    },
    totalAmount: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.primary,
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
        backgroundColor: COLORS.sale,
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

    // New Styles
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
        backgroundColor: COLORS.background,
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
    itemsList: {
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
        borderBottomColor: COLORS.border
    },
    itemName: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.text
    },
    itemDetails: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textMuted,
        marginTop: 2
    },
    itemTotal: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text
    },
    itemActions: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    // Modal Styles
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
        maxHeight: '90%'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg
    },
    modalTitle: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text
    },
    // Installment Styles
    installmentContainer: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    installmentToggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    installmentLabel: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.text,
    },
    installmentHint: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    installmentAmountContainer: {
        marginTop: SPACING.md,
        paddingTop: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    installmentBalanceText: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textMuted,
        marginTop: SPACING.xs,
        fontStyle: 'italic',
    }
});
