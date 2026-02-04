import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, SIZES } from '../constants/Theme';
import { useFinance } from '../context/FinanceContext';
import { useAlert } from '../context/AlertContext';
import { useSettings } from '../context/SettingsContext';
import SaleForm from '../components/finance/forms/SaleForm';
import RentalForm from '../components/finance/forms/RentalForm';
import DecorationForm from '../components/finance/forms/DecorationForm';
import ExpenseForm from '../components/finance/forms/ExpenseForm';
import { generateInvoiceHTML } from '../utils/invoiceGenerator';
import { parseLocalDate } from '../utils/dateHelpers';

const TransactionDetailScreen = ({ transaction, onBack, onDelete }) => {
    const insets = useSafeAreaInsets();
    const { transactions, updateTransaction, activeRentals, getDecorationByTransactionId } = useFinance();
    const { businessInfo } = useSettings();

    // Find the live version of the transaction from context
    const liveTransaction = React.useMemo(() => {
        return transactions.find(t => t.id === transaction.id) || transaction;
    }, [transactions, transaction]);

    // Determine type from live transaction
    const isSale = liveTransaction.type === 'sale';
    const isRental = liveTransaction.type === 'rental';
    const isDecoration = liveTransaction.type === 'decoration';
    const isExpense = liveTransaction.type === 'expense';

    const { showAlert, showConfirm } = useAlert();
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [extraInfo, setExtraInfo] = useState(null); // specific info for rental or decoration

    // Fetch extra info for Decoration
    React.useEffect(() => {
        const loadExtraInfo = async () => {
            if (isDecoration) {
                try {
                    const info = await getDecorationByTransactionId(liveTransaction.id);
                    if (info) setExtraInfo(info);
                } catch (e) {
                    console.error("Failed to load decoration info", e);
                }
            }
        };
        loadExtraInfo();
    }, [liveTransaction.id, isDecoration]);

    // Merged Data
    const fullTransactionData = React.useMemo(() => {
        let data = liveTransaction;
        if (isRental) {
            data = (activeRentals.find(r => r.id === liveTransaction.id) || liveTransaction);
        } else if (isDecoration && extraInfo) {
            data = { ...liveTransaction, ...extraInfo };
        }

        // Defensive parsing for clientData
        if (data.clientData && typeof data.clientData === 'string') {
            try {
                data = { ...data, clientData: JSON.parse(data.clientData) };
            } catch (e) {
                console.error("Error parsing clientData in TransactionDetailScreen:", e);
            }
        }
        return data;
    }, [liveTransaction, activeRentals, extraInfo, isRental, isDecoration]);

    const getColors = () => {
        if (isSale) return { main: '#22C55E', bg: '#22C55E15' }; // Green
        if (isRental) return { main: '#3B82F6', bg: '#3B82F615' }; // Blue
        if (isDecoration) return { main: COLORS.primary, bg: COLORS.primary + '15' }; // Primary (Blue)
        return { main: '#EF4444', bg: '#EF444415' }; // Red
    };

    const colors = getColors();

    const getIcon = () => {
        if (isSale) return 'shopping-cart';
        if (isRental) return 'package';
        if (isDecoration) return 'gift';
        return 'minus-circle';
    };

    const getTypeLabel = () => {
        if (isSale) return 'VENTA';
        if (isRental) return 'ALQUILER';
        if (isDecoration) return 'DECORACIÓN';
        return 'GASTO';
    };

    const getHeaderTitle = () => {
        if (isEditing) {
            if (isSale) return 'Editar Venta';
            if (isRental) return 'Editar Alquiler';
            if (isDecoration) return 'Editar Decoración';
            return 'Editar Gasto';
        }
        if (isSale) return 'Detalle Venta';
        if (isRental) return 'Detalle Alquiler';
        if (isDecoration) return 'Detalle Decoración';
        return 'Detalle Gasto';
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDateComplete = (dateString) => {
        if (!dateString) return '';
        const dateObj = parseLocalDate(dateString);
        return dateObj.toLocaleDateString('es-CO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleDelete = () => {
        showConfirm({
            title: "Eliminar Transacción",
            message: "¿Estás seguro de que deseas eliminar esta transacción permanentemente?",
            confirmText: "Eliminar",
            isDestructive: true,
            onConfirm: () => onDelete && onDelete(transaction)
        });
    };

    const handleShare = async () => {
        try {
            const html = generateInvoiceHTML(fullTransactionData, businessInfo);
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, {
                mimeType: 'application/pdf',
                dialogTitle: 'Compartir Factura',
            });
        } catch (error) {
            console.error('Error sharing PDF:', error);
            showAlert('error', 'Error', 'No se pudo generar el PDF');
        }
    };

    const handleSave = async (formData) => {
        setIsSubmitting(true);
        try {
            await updateTransaction(transaction.id, formData);

            // If it's a decoration, we need to manually refresh the extra info (deposit, etc.) form DB
            // because updateTransaction only updates the main list state, not our local extraInfo.
            if (isDecoration) {
                try {
                    const info = await getDecorationByTransactionId(transaction.id);
                    if (info) setExtraInfo(info);
                } catch (e) {
                    console.error("Failed to refresh decoration details", e);
                }
            }

            showAlert("success", "Éxito", "Transacción actualizada correctamente");
            setIsEditing(false);
        } catch (error) {
            console.error("Update error:", error);
            showAlert("error", "Error", "No se pudo actualizar la transacción");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        if (isEditing) {
            showConfirm({
                title: "Descartar cambios",
                message: "¿Estás seguro de que deseas cancelar la edición? Los cambios no guardados se perderán.",
                confirmText: "Descartar",
                isDestructive: true,
                onConfirm: () => setIsEditing(false)
            });
        } else {
            onBack();
        }
    };

    // Calculate decoration totals if items exist
    const items = React.useMemo(() => {
        // For decorations, prioritize items from extraInfo (from decorations table with items from transactions)
        let rawItems;
        if (isDecoration && extraInfo && extraInfo.items) {
            rawItems = extraInfo.items;
        } else {
            rawItems = fullTransactionData.items;
        }

        // Handle case where items might be a JSON string (from DB persistence)
        if (typeof rawItems === 'string') {
            try {
                rawItems = JSON.parse(rawItems);
            } catch (e) {
                console.error("Error parsing transaction items:", e);
                rawItems = [];
            }
        }

        return Array.isArray(rawItems) ? rawItems : [];
    }, [fullTransactionData.items, extraInfo, isDecoration]);

    const hasItems = items.length > 0;

    // Render Helper Components
    const DetailRow = ({ label, value, isBold = false, color = COLORS.text }) => (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={[styles.detailValue, { color, fontWeight: isBold ? '700' : '600' }]}>{value || '-'}</Text>
        </View>
    );

    const Divider = () => <View style={styles.divider} />;

    // Helper Component for Info Rows
    const InfoRow = ({ icon, label, value, isLast = false, color = COLORS.text }) => (
        <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
            <View style={styles.infoRowIconContainer}>
                <Feather name={icon} size={16} color={COLORS.textSecondary} />
            </View>
            <View style={styles.infoRowContent}>
                <Text style={styles.infoRowLabel}>{label}</Text>
                <Text style={[styles.infoRowValue, { color }]}>{value || '-'}</Text>
            </View>
        </View>
    );

    // Installment Logic
    const isInstallment = !!fullTransactionData.isInstallment;
    const totalDealValue = fullTransactionData.totalPrice || fullTransactionData.totalAmount || 0;
    const amountPaid = fullTransactionData.amountPaid || 0;
    const pendingAmount = Math.max(0, totalDealValue - amountPaid);
    const progressPercent = totalDealValue > 0 ? (amountPaid / totalDealValue) * 100 : 0;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Feather name={isEditing ? "x" : "arrow-left"} size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {getHeaderTitle()}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            {isEditing ? (
                /* Edit Mode: Render Form */
                <View style={{ flex: 1 }}>
                    {isSale && (
                        <SaleForm
                            initialValues={fullTransactionData}
                            onSubmit={handleSave}
                            onCancel={() => setIsEditing(false)}
                            submitLabel="Guardar Cambios"
                            isSubmitting={isSubmitting}
                        />
                    )}
                    {isRental && (
                        <RentalForm
                            initialValues={fullTransactionData}
                            onSubmit={handleSave}
                            onCancel={() => setIsEditing(false)}
                            submitLabel="Guardar Cambios"
                            isSubmitting={isSubmitting}
                        />
                    )}
                    {isDecoration && (
                        <DecorationForm
                            initialValues={fullTransactionData}
                            onSubmit={handleSave}
                            onCancel={() => setIsEditing(false)}
                            submitLabel="Guardar Cambios"
                            isSubmitting={isSubmitting}
                        />
                    )}
                    {isExpense && (
                        <ExpenseForm
                            initialValues={fullTransactionData}
                            onSubmit={handleSave}
                            onCancel={() => setIsEditing(false)}
                            submitLabel="Guardar Cambios"
                            isSubmitting={isSubmitting}
                        />
                    )}
                </View>
            ) : (
                /* View Mode: Render Detail Card */
                <>
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.content}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* 1. Encabezado de Resumen */}
                        <View style={styles.summaryCard}>
                            <View style={[styles.summaryIconContainer, { backgroundColor: colors.bg }]}>
                                <Feather name={getIcon()} size={32} color={colors.main} />
                            </View>

                            <Text style={[styles.summaryTypeLabel, { color: colors.main }]}>
                                {getTypeLabel()}
                            </Text>

                            <Text style={[styles.summaryAmount, { color: colors.main }]}>
                                {isExpense ? '-' : '+'}{formatCurrency(fullTransactionData.totalAmount || fullTransactionData.amount)}
                            </Text>

                            <Text style={styles.dateText}>
                                {formatDateComplete(fullTransactionData.date || fullTransactionData.startDate)}
                            </Text>
                        </View>

                        {/* 2. Sección de Cliente (Mejorada) */}
                        {(fullTransactionData.clientData || fullTransactionData.customerName) && (
                            <View style={styles.sectionContainer}>
                                <View style={styles.sectionHeader}>
                                    <View style={[styles.sectionIcon, { backgroundColor: COLORS.primary + '15' }]}>
                                        <Feather name="user" size={16} color={COLORS.primary} />
                                    </View>
                                    <Text style={styles.sectionTitle}>INFORMACIÓN DEL CLIENTE</Text>
                                </View>

                                {fullTransactionData.clientData ? (
                                    <>
                                        <InfoRow icon="user" label="Nombre" value={fullTransactionData.clientData.name} />
                                        {fullTransactionData.clientData.phone && (
                                            <InfoRow icon="phone" label="Teléfono" value={fullTransactionData.clientData.phone} />
                                        )}
                                        {fullTransactionData.clientData.email && (
                                            <InfoRow icon="mail" label="Email" value={fullTransactionData.clientData.email} />
                                        )}
                                        {fullTransactionData.clientData.documentId && (
                                            <InfoRow icon="credit-card" label="Documento" value={fullTransactionData.clientData.documentId} />
                                        )}
                                        {fullTransactionData.clientData.address && (
                                            <InfoRow icon="map-pin" label="Dirección" value={fullTransactionData.clientData.address} isLast />
                                        )}
                                        {/* Si no hay más campos, marcar el último como isLast */}
                                        {!fullTransactionData.clientData.phone && !fullTransactionData.clientData.email &&
                                            !fullTransactionData.clientData.documentId && !fullTransactionData.clientData.address && (
                                                <InfoRow icon="user" label="Nombre" value={fullTransactionData.clientData.name} isLast />
                                            )}
                                    </>
                                ) : (
                                    <InfoRow icon="user" label="Cliente" value={fullTransactionData.customerName} isLast />
                                )}
                            </View>
                        )}

                        {/* 3. Sección de Vigencia (Alquiler, Decoración, y Venta con entrega) */}
                        {((isRental || isDecoration) && (fullTransactionData.startDate || fullTransactionData.endDate)) ||
                            (isSale && fullTransactionData.deliveryDate) ? (
                            <View style={styles.sectionContainer}>
                                <View style={styles.sectionHeader}>
                                    <View style={[styles.sectionIcon, { backgroundColor: '#3B82F615' }]}>
                                        <Feather name="calendar" size={16} color="#3B82F6" />
                                    </View>
                                    <Text style={styles.sectionTitle}>
                                        {isSale ? "FECHAS" : "VIGENCIA"}
                                    </Text>
                                </View>

                                {/* For Sale: show date and delivery date */}
                                {isSale && (
                                    <>
                                        {fullTransactionData.date && (
                                            <InfoRow
                                                icon="calendar"
                                                label="Fecha Venta"
                                                value={formatDateComplete(fullTransactionData.date)}
                                                isLast={!fullTransactionData.deliveryDate}
                                            />
                                        )}
                                        {fullTransactionData.deliveryDate && (
                                            <InfoRow
                                                icon="truck"
                                                label="Fecha Entrega"
                                                value={formatDateComplete(fullTransactionData.deliveryDate)}
                                                isLast
                                            />
                                        )}
                                    </>
                                )}

                                {/* For Rental and Decoration: show start and end dates */}
                                {!isSale && fullTransactionData.startDate && (
                                    <InfoRow
                                        icon="calendar"
                                        label={isDecoration ? "Fecha Evento" : "Fecha Inicio"}
                                        value={formatDateComplete(fullTransactionData.startDate)}
                                        isLast={!fullTransactionData.endDate}
                                    />
                                )}
                                {!isSale && fullTransactionData.endDate && (
                                    <InfoRow
                                        icon="calendar"
                                        label={isDecoration ? "Fecha Retorno" : "Fecha Fin"}
                                        value={formatDateComplete(fullTransactionData.endDate)}
                                        isLast
                                    />
                                )}
                            </View>
                        ) : null}

                        {/* 4. Sección de Items / Productos */}
                        {hasItems ? (
                            <View style={styles.sectionContainer}>
                                <View style={styles.sectionHeader}>
                                    <View style={[styles.sectionIcon, { backgroundColor: '#8B5CF615' }]}>
                                        <Feather name={isDecoration ? "gift" : "package"} size={16} color="#8B5CF6" />
                                    </View>
                                    <Text style={styles.sectionTitle}>
                                        {isDecoration ? "ELEMENTOS USADOS" : "PRODUCTOS"}
                                    </Text>
                                </View>

                                <ScrollView
                                    style={styles.itemsScrollArea}
                                    nestedScrollEnabled={true}
                                    showsVerticalScrollIndicator={true}
                                >
                                    {items.map((item, index) => (
                                        <View key={index} style={[
                                            styles.itemRow,
                                            index === items.length - 1 && { borderBottomWidth: 0 } // Remove border for last item
                                        ]}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.itemName}>{item.productName}</Text>
                                                {/* Mostrar precios solo para venta y alquiler */}
                                                {!isDecoration && (
                                                    <Text style={styles.itemSubtext}>
                                                        {item.quantity} x {formatCurrency(item.unitPrice)}
                                                    </Text>
                                                )}
                                            </View>
                                            {/* Mostrar total solo para venta y alquiler */}
                                            {!isDecoration && (
                                                <Text style={styles.itemTotal}>
                                                    {formatCurrency(item.total || (item.quantity * item.unitPrice))}
                                                </Text>
                                            )}
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        ) : (
                            // Fallback for legacy single-item transactions
                            <View style={styles.sectionContainer}>
                                <View style={styles.sectionHeader}>
                                    <View style={[styles.sectionIcon, { backgroundColor: '#8B5CF615' }]}>
                                        <Feather name="tag" size={16} color="#8B5CF6" />
                                    </View>
                                    <Text style={styles.sectionTitle}>DETALLE</Text>
                                </View>
                                <InfoRow
                                    icon="tag"
                                    label={isDecoration ? "Evento" : (isExpense ? "Descripción" : "Producto")}
                                    value={fullTransactionData.productName || fullTransactionData.description || 'N/A'}
                                />
                                {fullTransactionData.category && (
                                    <InfoRow icon="grid" label="Categoría" value={fullTransactionData.category} />
                                )}
                                {(fullTransactionData.quantity > 1) && (
                                    <InfoRow icon="hash" label="Cantidad" value={fullTransactionData.quantity} />
                                )}
                                {(fullTransactionData.unitPrice > 0) && (
                                    <InfoRow icon="dollar-sign" label="Precio Unitario" value={formatCurrency(fullTransactionData.unitPrice)} isLast />
                                )}
                            </View>
                        )}

                        {/* Payment Status Section - Only for Installments */}
                        {isInstallment && (
                            <View style={styles.sectionContainer}>
                                <View style={styles.sectionHeader}>
                                    <View style={[styles.sectionIcon, { backgroundColor: '#8B5CF615' }]}>
                                        <Feather name="pie-chart" size={16} color="#8B5CF6" />
                                    </View>
                                    <Text style={[styles.sectionTitle, { color: '#8B5CF6' }]}>ESTADO DEL PAGO</Text>
                                </View>

                                {/* Progress Bar */}
                                <View style={{ marginBottom: 16 }}>
                                    <View style={{
                                        height: 8,
                                        backgroundColor: COLORS.border,
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                        flexDirection: 'row',
                                        marginBottom: 4
                                    }}>
                                        <View style={{
                                            flex: progressPercent / 100,
                                            backgroundColor: '#8B5CF6'
                                        }} />
                                    </View>
                                    <Text style={{
                                        textAlign: 'right',
                                        fontSize: 12,
                                        color: COLORS.textSecondary,
                                        fontWeight: '600'
                                    }}>
                                        {Math.round(progressPercent)}% Completado
                                    </Text>
                                </View>

                                <View style={styles.installmentRow}>
                                    <Text style={styles.detailLabel}>Valor Total Acordado</Text>
                                    <Text style={styles.detailValue}>{formatCurrency(totalDealValue)}</Text>
                                </View>

                                <View style={styles.installmentRow}>
                                    <Text style={styles.detailLabel}>Total Abonado</Text>
                                    <Text style={[styles.detailValue, { color: '#22C55E' }]}>{formatCurrency(amountPaid)}</Text>
                                </View>

                                <View style={styles.divider} />

                                <View style={[styles.installmentRow, { marginTop: 4 }]}>
                                    <Text style={[styles.detailLabel, { fontWeight: '700', color: COLORS.text }]}>SALDO PENDIENTE</Text>
                                    {pendingAmount > 0 ? (
                                        <Text style={[styles.detailValue, {
                                            color: COLORS.error,
                                            fontSize: 20,
                                            fontWeight: 'bold'
                                        }]}>
                                            {formatCurrency(pendingAmount)}
                                        </Text>
                                    ) : (
                                        <View style={[styles.statusBadge, { backgroundColor: '#22C55E20', paddingVertical: 4 }]}>
                                            <Text style={[styles.statusText, { color: '#22C55E', fontSize: 12 }]}>PAGADO</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}

                        {/* 5. Sección de Resumen Financiero */}
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.sectionIcon, { backgroundColor: '#22C55E15' }]}>
                                    <Feather name="dollar-sign" size={16} color="#22C55E" />
                                </View>
                                <Text style={styles.sectionTitle}>RESUMEN FINANCIERO</Text>
                            </View>

                            {/* Total Row Moved to Top */}
                            <View style={[styles.financialRow, { marginBottom: 8 }]}>
                                <Text style={styles.totalLabel}>
                                    {isInstallment ? 'TOTAL INGRESADO A CAJA' : 'TOTAL'}
                                </Text>
                                <Text style={[styles.totalValue, { color: colors.main }]}>
                                    {formatCurrency(fullTransactionData.totalAmount || fullTransactionData.amount)}
                                </Text>
                            </View>

                            {/* Separator */}
                            <View style={styles.divider} />

                            {/* Subtotal Calculation - Different logic for each transaction type */}
                            {items.length > 0 && !isDecoration && (
                                <View style={[styles.financialRow, { marginTop: 4 }]}>
                                    <Text style={styles.financialLabel}>Subtotal Productos</Text>
                                    <Text style={styles.financialValue}>
                                        {formatCurrency(items.reduce((sum, i) => sum + (i.total || (i.quantity * i.unitPrice)), 0))}
                                    </Text>
                                </View>
                            )}

                            {/* For decorations, show the base price instead of items subtotal */}
                            {isDecoration && fullTransactionData.unitPrice > 0 && (
                                <View style={[styles.financialRow, { marginTop: 4 }]}>
                                    <Text style={styles.financialLabel}>Precio Base Decoración</Text>
                                    <Text style={styles.financialValue}>
                                        {formatCurrency(fullTransactionData.unitPrice)}
                                    </Text>
                                </View>
                            )}

                            {/* For decorations with items, show element count */}
                            {isDecoration && items.length > 0 && (
                                <View style={[styles.financialRow, { marginTop: 4 }]}>
                                    <Text style={styles.financialLabel}>Elementos Utilizados</Text>
                                    <Text style={styles.financialValue}>
                                        {items.length} {items.length === 1 ? 'elemento' : 'elementos'}
                                    </Text>
                                </View>
                            )}

                            {fullTransactionData.discount > 0 && (
                                <View style={styles.financialRow}>
                                    <Text style={styles.financialLabel}>Descuento</Text>
                                    <Text style={[styles.financialValue, { color: COLORS.error }]}>
                                        -{formatCurrency(fullTransactionData.discount)}
                                    </Text>
                                </View>
                            )}

                            {fullTransactionData.deposit > 0 && (
                                <View style={styles.financialRow}>
                                    <Text style={styles.financialLabel}>Depósito / Garantía</Text>
                                    <Text style={styles.financialValue}>
                                        {formatCurrency(fullTransactionData.deposit)}
                                    </Text>
                                </View>
                            )}

                            {/* Rental Status */}
                            {isRental && (
                                <View style={[styles.statusBadge, {
                                    backgroundColor: fullTransactionData.status === 'active' ? COLORS.primary + '20' : '#22C55E20',
                                    marginTop: SPACING.md
                                }]}>
                                    <Text style={[styles.statusText, {
                                        color: fullTransactionData.status === 'active' ? COLORS.primary : '#22C55E'
                                    }]}>
                                        {fullTransactionData.status === 'active' ? 'ALQUILER ACTIVO' : 'COMPLETADO'}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* 6. Información Adicional / Notas */}
                        {fullTransactionData.notes && (
                            <View style={styles.sectionContainer}>
                                <View style={styles.sectionHeader}>
                                    <View style={[styles.sectionIcon, { backgroundColor: COLORS.textMuted + '15' }]}>
                                        <Feather name="file-text" size={16} color={COLORS.text} />
                                    </View>
                                    <Text style={styles.sectionTitle}>NOTAS</Text>
                                </View>
                                <Text style={styles.notesText}>{fullTransactionData.notes}</Text>
                            </View>
                        )}

                        <View style={{ height: SIZES.navBarHeight + insets.bottom + 20 }} />
                    </ScrollView>

                    {/* View Mode Footer */}
                    <View style={[
                        styles.footer,
                        {
                            height: SIZES.navBarHeight + insets.bottom,
                            paddingBottom: insets.bottom,
                        }
                    ]}>
                        <TouchableOpacity style={styles.footerButton} onPress={() => setIsEditing(true)}>
                            <Feather name="edit-3" size={20} color={COLORS.primary} style={styles.footerIcon} />
                            <Text style={styles.footerLabel}>Editar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.footerButton} onPress={handleDelete}>
                            <Feather name="trash-2" size={20} color={COLORS.error} style={styles.footerIcon} />
                            <Text style={[styles.footerLabel, { color: COLORS.error }]}>Eliminar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.footerButton} onPress={handleShare}>
                            <Feather name="share-2" size={20} color={COLORS.primary} style={styles.footerIcon} />
                            <Text style={styles.footerLabel}>Compartir</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </View>
    );
};

export default TransactionDetailScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.md,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: SPACING.lg,
    },
    // Summary Card Redesign
    summaryCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: SPACING.xl,
        alignItems: 'center',
        marginBottom: SPACING.lg,
        ...SHADOWS.medium,
    },
    summaryIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
    },
    summaryTypeLabel: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: SPACING.xs,
        letterSpacing: 0.5,
    },
    summaryAmount: {
        fontSize: 36,
        fontWeight: TYPOGRAPHY.weight.bold,
        marginBottom: SPACING.xs,
    },
    // Section Styles
    sectionContainer: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
        ...SHADOWS.small,
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        marginBottom: SPACING.md,
        textTransform: 'uppercase',
        opacity: 0.7
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    detailLabel: {
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.textSecondary,
        flex: 1,
    },
    detailValue: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: '600',
        color: COLORS.text,
        textAlign: 'right',
        flex: 1,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 4,
    },
    // Decoration Item Specifics
    tableHeader: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.textMuted,
        fontWeight: '600',
        textTransform: 'uppercase'
    },
    itemName: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2
    },
    itemSubtext: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textMuted,
    },
    itemTotal: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: '700',
        color: COLORS.text,
    },
    notesText: {
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.text,
        lineHeight: 22,
        fontStyle: 'italic'
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        ...SHADOWS.navBar,
    },
    footerButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    footerIcon: {
        marginBottom: 4,
    },
    footerLabel: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.text,
        fontWeight: TYPOGRAPHY.weight.medium,
    },
    // New Styles
    dateText: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    sectionIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.sm,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    infoRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    infoRowIconContainer: {
        width: 24,
        alignItems: 'center',
        marginRight: SPACING.sm,
    },
    infoRowContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoRowLabel: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
    },
    infoRowValue: {
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.text,
        fontWeight: '500',
        textAlign: 'right',
        flex: 1,
        marginLeft: SPACING.md,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    itemsScrollArea: {
        maxHeight: 250,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        paddingHorizontal: SPACING.sm,
        backgroundColor: COLORS.surface, // Ensure contrasting/clean background if needed
    },
    financialRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    financialLabel: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
    },
    financialValue: {
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.text,
        fontWeight: '600',
    },
    totalLabel: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: '700',
        color: COLORS.text,
    },
    totalValue: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: 'bold',
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        fontSize: TYPOGRAPHY.size.xs,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    installmentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
});
