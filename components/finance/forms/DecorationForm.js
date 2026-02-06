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

const DecorationForm = ({ initialValues, onSubmit, onCancel, submitLabel = 'Guardar Decoración', isSubmitting = false }) => {
    const insets = useSafeAreaInsets();
    const { showAlert } = useAlert();
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [modalVisible, setModalVisible] = useState(false); // For inventory selection

    // Main Form State
    const [decorationName, setDecorationName] = useState('');
    const [clientData, setClientData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        documentId: ''
    });
    const [startDate, setStartDate] = useState(getLocalDateString());
    const [endDate, setEndDate] = useState('');

    // Memoizar minDate para evitar re-renders innecesarios
    const minEndDate = useMemo(() => {
        return startDate ? new Date(startDate) : undefined;
    }, [startDate]);
    const [decorationPrice, setDecorationPrice] = useState(''); // New field for fixed decoration price
    const [notes, setNotes] = useState('');

    // Client Selection
    const [clientSelectorVisible, setClientSelectorVisible] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState(null);

    // Installment payment state
    const [isInstallment, setIsInstallment] = useState(false);
    const [installmentAmount, setInstallmentAmount] = useState('0');

    // Items State
    const [items, setItems] = useState([]);

    // Add/Edit Item Modal State
    const [itemModalVisible, setItemModalVisible] = useState(false);
    const [editingItemId, setEditingItemId] = useState(null);
    const [tempItem, setTempItem] = useState({
        name: '',
        // quantity and price removed from UI, keeping internal defaults
    });

    // Theme Colors
    const THEME_COLOR = COLORS.decoration;
    const THEME_COLOR_LIGHT = COLORS.decoration + '20';

    // Load initial values (Edit Mode)
    useEffect(() => {
        if (initialValues) {
            // Batch all state updates to prevent race conditions
            const newDecorationName = initialValues.productName || '';
            const newClientData = initialValues.clientData || { ...clientData, name: initialValues.customerName || '' };
            const newStartDate = initialValues.startDate || initialValues.date || getLocalDateString();
            const newEndDate = initialValues.rentalEndDate || initialValues.endDate || '';
            // Helper to get initial price. In legacy, maybe it was unitPrice or totalAmount.
            // If we have items but no explicit decorationPrice, maybe we sum them? 
            // The user says "Mantener compatibilidad".
            // If it's a new field, old records won't have it distinct.
            // We can assume old records having items used the sum as total.
            // But if we want to allow editing, maybe we default to totalAmount from the record.
            const initialPrice = initialValues.unitPrice || initialValues.totalAmount || initialValues.price || '0';
            const newDecorationPrice = parseCurrencyToNumber(initialPrice).toString();
            const newNotes = initialValues.notes || '';

            // Update basic form fields
            setDecorationName(newDecorationName);
            setClientData(newClientData);
            setStartDate(newStartDate);
            setEndDate(newEndDate);
            setDecorationPrice(newDecorationPrice);
            setNotes(newNotes);

            // Cargar campos de abonos
            if (initialValues.isInstallment) {
                setIsInstallment(true);
                setInstallmentAmount(String(initialValues.amountPaid || 0));
            }

            // Handle items separately to avoid conflicts
            if (initialValues.items && Array.isArray(initialValues.items)) {
                setItems(initialValues.items);
            } else if (initialValues.quantity && initialValues.unitPrice) {
                // Legacy: convert single item to list
                setItems([{
                    id: Date.now().toString(),
                    productName: initialValues.productName || 'Decoración Principal',
                    quantity: initialValues.quantity,
                    unitPrice: initialValues.unitPrice,
                    total: initialValues.quantity * initialValues.unitPrice
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

    // Product Selector Handler
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

            // Decoration items are now informational only (no price/qty effect)
            const newItem = {
                id: Date.now().toString() + Math.random().toString(),
                productName: product.name,
                quantity: 1, // Default for schema compatibility
                unitPrice: 0, // Default for schema compatibility
                total: 0,
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

    // Item Management Parts
    const handleAddNewItem = () => {
        setEditingItemId(null);
        setTempItem({ name: '' });
        setItemModalVisible(true);
    };

    const handleEditItem = (item) => {
        setEditingItemId(item.id);
        setTempItem({
            name: item.productName
        });
        setItemModalVisible(true);
    };

    const handleDeleteItem = (id) => {
        Alert.alert(
            "Eliminar producto",
            "¿Estás seguro de que quieres eliminar este producto de la decoración?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: () => setItems(prev => prev.filter(i => i.id !== id))
                }
            ]
        );
    };

    const saveItem = () => {
        if (!tempItem.name.trim()) {
            showAlert("error", "Error", "El nombre del producto es obligatorio");
            return;
        }

        // Defaults for schema compatibility
        const qty = 1;
        const price = 0;

        const newItem = {
            id: editingItemId || Date.now().toString() + Math.random().toString(),
            productName: tempItem.name.trim(),
            quantity: qty,
            unitPrice: price,
            total: 0
        };

        if (editingItemId) {
            setItems(prev => prev.map(i => i.id === editingItemId ? newItem : i));
        } else {
            setItems(prev => [...prev, newItem]);
        }
        setItemModalVisible(false);
    };

    // Calculation
    // Total is primarily based on decorationPrice. Items are optional/reference.
    const totalAmount = parseCurrencyToNumber(decorationPrice);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleSubmit = async () => {
        if (!decorationName.trim()) {
            showAlert("error", "Error", "Por favor ingresa el nombre de la decoración");
            return;
        }

        if (!decorationPrice || isNaN(parseCurrencyToNumber(decorationPrice)) || parseCurrencyToNumber(decorationPrice) < 0) {
            showAlert("error", "Error", "El precio de la decoración es inválido");
            return;
        }

        // Client name is optional now


        // Validate installment amount
        const installmentAmountNum = parseFloat(installmentAmount) || 0;
        if (isInstallment && installmentAmountNum > totalAmount) {
            showAlert("error", "Error", "El abono no puede ser mayor al valor total de la decoración");
            return;
        }

        // Calculate the actual amount to register as income
        const amountToRegister = isInstallment ? installmentAmountNum : totalAmount;

        const formData = {
            productName: decorationName.trim(),
            customerName: clientData.name.trim(),
            clientData: clientData,
            startDate: startDate,
            endDate: endDate || null,
            notes: notes.trim() || null,
            quantity: 1,
            unitPrice: totalAmount,
            totalAmount: amountToRegister, // This is what gets added to income
            items: items,
            // Installment fields
            isInstallment: isInstallment,
            totalPrice: totalAmount, // Store the full price for reference
            amountPaid: amountToRegister // Track how much has been paid
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
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* SECCIÓN 1: EL EVENTO */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>1. El Evento</Text>

                        <View style={{ marginBottom: SPACING.md }}>
                            <Text style={styles.label}>Nombre de la Decoración *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej: Boda Civil..."
                                placeholderTextColor={COLORS.textMuted}
                                value={decorationName}
                                onChangeText={setDecorationName}
                            />
                        </View>

                        <Text style={styles.label}>Precio Base (Mano de Obra) *</Text>
                        <View style={styles.currencyInput}>
                            <Text style={styles.currencySymbol}>$</Text>
                            <TextInput
                                style={styles.currencyTextInput}
                                placeholder="0"
                                placeholderTextColor={COLORS.textMuted}
                                value={decorationPrice}
                                onChangeText={setDecorationPrice}
                                keyboardType="numeric"
                            />
                        </View>
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

                    {/* SECCIÓN 3: LOGÍSTICA */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>3. Logística del Evento</Text>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: SPACING.sm }}>
                                <CustomDatePicker
                                    label="Fecha evento"
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

                    {/* SECCIÓN 4: ELEMENTOS DE INVENTARIO */}
                    <View style={styles.sectionContainer}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md }}>
                            <Text style={[styles.sectionTitle, { marginBottom: 0, borderBottomWidth: 0 }]}>4. Elementos Usados ({items.length})</Text>
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
                                                {/* Details removed as requested */}
                                            </View>
                                            <View style={{ alignItems: 'flex-end', marginRight: SPACING.md }}>
                                                {/* Total removed as requested */}
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

                    {/* SECCIÓN 5: FINALIZACIÓN */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>5. Finalización</Text>

                        <Text style={styles.label}>Notas (opcional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Detalles sobre el servicio..."
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

                        <View style={[styles.totalContainer, { backgroundColor: THEME_COLOR_LIGHT, borderColor: THEME_COLOR, marginBottom: 0 }]}>
                            <View>
                                <Text style={styles.totalLabel}>{isInstallment ? 'Total Decoración' : 'Total Decoración'}</Text>
                                <Text style={[styles.statusBadge, { color: THEME_COLOR }]}>Estado: Activo</Text>
                            </View>
                            <Text style={[styles.totalAmount, { color: THEME_COLOR }]}>{formatCurrency(totalAmount)}</Text>
                        </View>

                        {isInstallment && (
                            <View style={[styles.totalContainer, { marginTop: SPACING.sm, backgroundColor: '#8B5CF6' + '15', borderColor: '#8B5CF6' }]}>
                                <Text style={[styles.totalLabel, { fontSize: TYPOGRAPHY.size.md }]}>Abono Actual</Text>
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
                            { backgroundColor: THEME_COLOR },
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

            {/* Add Item Modal */}
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
                                    <TouchableOpacity onPress={() => {
                                        setModalVisible(true);
                                    }}>
                                        <Text style={{ color: THEME_COLOR, fontWeight: '600' }}>Buscar en Inventario</Text>
                                    </TouchableOpacity>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    value={tempItem.name}
                                    onChangeText={(t) => setTempItem(prev => ({ ...prev, name: t }))}
                                    placeholder="Nombre del producto o elemento"
                                />
                            </View>
                            {/* Quantity and Price inputs removed */}
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

            <ProductSelectorModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onConfirm={handleConfirmProductsFromInventory}
                context="decoration"
            />

            <ClientSelectorModal
                visible={clientSelectorVisible}
                onClose={() => setClientSelectorVisible(false)}
                onSelect={handleSelectClient}
            />
        </View>
    );
};

export default DecorationForm;

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
        borderRadius: 12,
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
        borderWidth: 2,
    },
    totalLabel: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
    },
    statusBadge: {
        fontSize: TYPOGRAPHY.size.xs,
        marginTop: 4,
    },
    totalAmount: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.bold,
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
