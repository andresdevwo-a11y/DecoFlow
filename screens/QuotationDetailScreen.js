import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, SIZES, RADIUS } from '../constants/Theme';
import { useFinance } from '../context/FinanceContext';
import { useAlert } from '../context/AlertContext';
import { useSettings } from '../context/SettingsContext';
import { generateInvoiceHTML } from '../utils/invoiceGenerator';
import { parseLocalDate } from '../utils/dateHelpers';

// Forms for Editing
import QuotationSaleForm from '../components/finance/forms/QuotationSaleForm';
import QuotationRentalForm from '../components/finance/forms/QuotationRentalForm';
import QuotationDecorationForm from '../components/finance/forms/QuotationDecorationForm';
import ConvertQuotationModal from '../components/finance/ConvertQuotationModal';

const QuotationDetailScreen = ({ quotation, onBack, onConvert }) => {
    const insets = useSafeAreaInsets();
    const { updateQuotation, deleteQuotation, convertQuotation, quotations } = useFinance();
    const { showAlert, showConfirm } = useAlert();
    const { businessInfo } = useSettings();

    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConvertModal, setShowConvertModal] = useState(false);

    // Derive the latest data from context, fallback to prop if not found yet
    const activeQuotation = quotations.find(q => q.id === quotation?.id) || quotation;

    if (!activeQuotation) return null;

    const {
        id,
        type,
        quotationNumber,
        productName, // Sometimes used as single item description fallback
        customerName,
        clientData, // Ensure this is handled if present
        totalAmount,
        date,
        items = [],
        notes,
        status, // 'pending' | 'converted'
        startDate,
        endDate,
        deposit,
        discount,
        unitPrice
    } = activeQuotation;

    const isSale = type === 'sale';
    const isRental = type === 'rental';
    const isDecoration = type === 'decoration';

    // --- Helpers ---

    const getColors = () => {
        if (isSale) return { main: '#22C55E', bg: '#22C55E15' }; // Green
        if (isRental) return { main: '#3B82F6', bg: '#3B82F615' }; // Blue
        if (isDecoration) return { main: COLORS.primary, bg: COLORS.primary + '15' }; // Primary (Blue)
        return { main: COLORS.primary, bg: COLORS.primary + '15' };
    };

    const colors = getColors();

    const getIcon = () => {
        if (isSale) return 'shopping-cart';
        if (isRental) return 'package';
        if (isDecoration) return 'gift';
        return 'file-text';
    };

    const getTypeLabel = () => {
        if (isSale) return 'COTIZACIÓN VENTA';
        if (isRental) return 'COTIZACIÓN ALQUILER';
        if (isDecoration) return 'COTIZACIÓN DECORACIÓN';
        return 'COTIZACIÓN';
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    const formatDateComplete = (dateString) => {
        if (!dateString) return 'N/A';
        const dateObj = parseLocalDate(dateString);
        return dateObj.toLocaleDateString('es-CO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // --- Actions ---

    const handleEditSave = async (formData) => {
        setIsSubmitting(true);
        try {
            await updateQuotation({
                ...activeQuotation, // Preserve all original fields (id, type, date, status, etc.)
                ...formData,  // Overwrite with modified fields from the form
                id: activeQuotation.id, // Ensure ID is never overwritten
                updatedAt: new Date().toISOString() // Update timestamp
            });
            setIsEditing(false);
            showAlert("success", "Éxito", "Cotización actualizada");
        } catch (error) {
            console.error(error);
            showAlert("error", "Error", "No se pudo actualizar la cotización");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = () => {
        showConfirm({
            title: "Eliminar Cotización",
            message: "¿Estás seguro de que deseas eliminar esta cotización? Esta acción no se puede deshacer.",
            isDestructive: true,
            onConfirm: async () => {
                try {
                    await deleteQuotation(activeQuotation.id);
                    onBack(); // Go back to list
                } catch (error) {
                    showAlert("error", "Error", "No se pudo eliminar la cotización");
                }
            }
        });
    };

    const handleConvert = () => {
        setShowConvertModal(true);
    };

    const handleConfirmConvert = async (installmentOptions) => {
        setShowConvertModal(false);
        try {
            await convertQuotation(activeQuotation.id, installmentOptions);
            showAlert(
                "success",
                "Cotización Convertida",
                "La cotización se ha convertido exitosamente en una transacción.",
                () => {
                    if (onConvert) {
                        onBack();
                    }
                }
            );
        } catch (error) {
            console.error(error);
            showAlert("error", "Error", "No se pudo convertir la cotización");
        }
    };

    const handleShare = async () => {
        try {
            // Use businessInfo in PDF if available
            const html = generateInvoiceHTML({
                ...activeQuotation,
                start_date: startDate,
                end_date: endDate,
                items: items || [],
                customer_name: customerName,
                clientData: clientData,
                total_amount: totalAmount,
                type: type,
                isQuotation: true // Use this flag if generator supports it, or rely on type/title override
            }, businessInfo);

            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, {
                mimeType: 'application/pdf',
                dialogTitle: `Cotización #${quotationNumber || id}`,
            });
        } catch (error) {
            console.error("Error sharing PDF:", error);
            showAlert("error", "Error", "No se pudo generar el documento PDF");
        }
    };

    const handleBack = () => {
        if (isEditing) {
            showConfirm({
                title: "Descartar cambios",
                message: "¿Estás seguro de que deseas cancelar la edición? Los cambios no guardados se perderán.",
                onConfirm: () => setIsEditing(false)
            });
        } else {
            onBack();
        }
    };

    // --- Render Helpers ---

    // Reusing the same styling components as TransactionDetailScreen
    const DetailRow = ({ label, value, isBold = false, color = COLORS.text }) => (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={[styles.detailValue, { color, fontWeight: isBold ? '700' : '600' }]}>{value || '-'}</Text>
        </View>
    );

    const Divider = () => <View style={styles.divider} />;

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

    const hasItems = items && Array.isArray(items) && items.length > 0;

    // --- Render ---

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Feather name={isEditing ? "x" : "arrow-left"} size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {isEditing ? 'Editar Cotización' : 'Cotización'}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            {isEditing ? (
                /* Edit Mode: Render Form */
                <View style={{ flex: 1 }}>
                    {isSale && (
                        <QuotationSaleForm
                            initialValues={activeQuotation}
                            onSubmit={handleEditSave}
                            onCancel={() => setIsEditing(false)}
                            submitLabel="Guardar Cambios"
                            isSubmitting={isSubmitting}
                        />
                    )}
                    {isRental && (
                        <QuotationRentalForm
                            initialValues={activeQuotation}
                            onSubmit={handleEditSave}
                            onCancel={() => setIsEditing(false)}
                            submitLabel="Guardar Cambios"
                            isSubmitting={isSubmitting}
                        />
                    )}
                    {isDecoration && (
                        <QuotationDecorationForm
                            initialValues={activeQuotation}
                            onSubmit={handleEditSave}
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
                        {/* Status Banner for Converted Quotations */}
                        {status === 'converted' && (
                            <View style={styles.statusBanner}>
                                <Feather name="check-circle" size={20} color="#15803d" />
                                <Text style={styles.statusText}>Cotización convertida a transacción</Text>
                            </View>
                        )}

                        {/* 1. Encabezado de Resumen */}
                        <View style={styles.summaryCard}>
                            <View style={[styles.summaryIconContainer, { backgroundColor: colors.bg }]}>
                                <Feather name={getIcon()} size={32} color={colors.main} />
                            </View>

                            <Text style={[styles.summaryTypeLabel, { color: colors.main }]}>
                                {getTypeLabel()}
                            </Text>

                            <Text style={[styles.summaryAmount, { color: colors.main }]}>
                                {formatCurrency(totalAmount)}
                            </Text>

                            <Text style={styles.dateText}>
                                {formatDateComplete(date)}
                            </Text>
                        </View>

                        {/* 2. Sección de Cliente */}
                        {(clientData || customerName) && (
                            <View style={styles.sectionContainer}>
                                <View style={styles.sectionHeader}>
                                    <View style={[styles.sectionIcon, { backgroundColor: COLORS.primary + '15' }]}>
                                        <Feather name="user" size={16} color={COLORS.primary} />
                                    </View>
                                    <Text style={styles.sectionTitle}>INFORMACIÓN DEL CLIENTE</Text>
                                </View>

                                {clientData ? (
                                    <>
                                        <InfoRow icon="user" label="Nombre" value={clientData.name} />
                                        {clientData.phone && (
                                            <InfoRow icon="phone" label="Teléfono" value={clientData.phone} />
                                        )}
                                        {clientData.email && (
                                            <InfoRow icon="mail" label="Email" value={clientData.email} />
                                        )}
                                        {clientData.documentId && (
                                            <InfoRow icon="credit-card" label="Documento" value={clientData.documentId} />
                                        )}
                                        {clientData.address && (
                                            <InfoRow icon="map-pin" label="Dirección" value={clientData.address} isLast />
                                        )}
                                        {/* Si no hay más campos, marcar el último como isLast */}
                                        {!clientData.phone && !clientData.email &&
                                            !clientData.documentId && !clientData.address && (
                                                <InfoRow icon="user" label="Nombre" value={clientData.name} isLast />
                                            )}
                                    </>
                                ) : (
                                    <InfoRow icon="user" label="Cliente" value={customerName} isLast />
                                )}
                            </View>
                        )}

                        {/* 3. Sección de Vigencia (Alquiler, Decoración, y Venta con entrega) */}
                        {((isRental || isDecoration) && (startDate || endDate)) ||
                            (isSale && startDate) ? (
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
                                        {date && (
                                            <InfoRow
                                                icon="calendar"
                                                label="Fecha Cotización"
                                                value={formatDateComplete(date)}
                                                isLast={!endDate}
                                            />
                                        )}
                                        {startDate && (
                                            <InfoRow
                                                icon="truck"
                                                label="Fecha Entrega"
                                                value={formatDateComplete(startDate)}
                                                isLast={!endDate}
                                            />
                                        )}
                                    </>
                                )}

                                {/* For Rental and Decoration: show start and end dates */}
                                {!isSale && startDate && (
                                    <InfoRow
                                        icon="calendar"
                                        label={isDecoration ? "Fecha Evento" : "Fecha Inicio"}
                                        value={formatDateComplete(startDate)}
                                        isLast={!endDate}
                                    />
                                )}
                                {!isSale && endDate && (
                                    <InfoRow
                                        icon="calendar"
                                        label={isDecoration ? "Fecha Retorno" : "Fecha Fin"}
                                        value={formatDateComplete(endDate)}
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
                                        {isDecoration ? "ELEMENTOS USADOS" : "ITEMS / PRODUCTOS"}
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
                                            index === items.length - 1 && { borderBottomWidth: 0 }
                                        ]}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.itemName}>{item.productName}</Text>
                                                {/* Mostrar precios solo para venta y alquiler */}
                                                {!isDecoration && (
                                                    <Text style={styles.itemSubtext}>
                                                        {item.quantity} x {formatCurrency(item.unitPrice || item.price)}
                                                    </Text>
                                                )}
                                            </View>
                                            {/* Mostrar total solo para venta y alquiler */}
                                            {!isDecoration && (
                                                <Text style={styles.itemTotal}>
                                                    {formatCurrency((item.total || (item.quantity * (item.unitPrice || item.price))))}
                                                </Text>
                                            )}
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        ) : (
                            <View style={styles.sectionContainer}>
                                <View style={styles.sectionHeader}>
                                    <View style={[styles.sectionIcon, { backgroundColor: '#8B5CF615' }]}>
                                        <Feather name="tag" size={16} color="#8B5CF6" />
                                    </View>
                                    <Text style={styles.sectionTitle}>DETALLE</Text>
                                </View>
                                <InfoRow
                                    icon="tag"
                                    label="Producto/Servicio"
                                    value={productName || 'N/A'}
                                    isLast
                                />
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

                            <View style={[styles.financialRow, { marginBottom: 8 }]}>
                                <Text style={styles.totalLabel}>TOTAL COTIZADO</Text>
                                <Text style={[styles.totalValue, { color: colors.main }]}>
                                    {formatCurrency(totalAmount)}
                                </Text>
                            </View>

                            <View style={styles.divider} />

                            {/* Subtotal Calculation - Different logic for each transaction type */}
                            {hasItems && !isDecoration && (
                                <View style={[styles.financialRow, { marginTop: 4 }]}>
                                    <Text style={styles.financialLabel}>Subtotal Items</Text>
                                    <Text style={styles.financialValue}>
                                        {formatCurrency(items.reduce((sum, i) => sum + (i.total || (i.quantity * (i.unitPrice || i.price))), 0))}
                                    </Text>
                                </View>
                            )}

                            {/* For decorations, show the base price instead of items subtotal */}
                            {isDecoration && (unitPrice || (items.length > 0 && items[0].unitPrice)) > 0 && (
                                <View style={[styles.financialRow, { marginTop: 4 }]}>
                                    <Text style={styles.financialLabel}>Precio Base Decoración</Text>
                                    <Text style={styles.financialValue}>
                                        {formatCurrency(unitPrice || items[0].unitPrice)}
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

                            {Number(discount) > 0 && (
                                <View style={styles.financialRow}>
                                    <Text style={styles.financialLabel}>Descuento</Text>
                                    <Text style={[styles.financialValue, { color: COLORS.error }]}>
                                        -{formatCurrency(discount)}
                                    </Text>
                                </View>
                            )}

                            {Number(deposit) > 0 && (
                                <View style={styles.financialRow}>
                                    <Text style={styles.financialLabel}>Depósito / Garantía</Text>
                                    <Text style={styles.financialValue}>
                                        {formatCurrency(deposit)}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* 6. Información Adicional / Notas */}
                        {notes && (
                            <View style={styles.sectionContainer}>
                                <View style={styles.sectionHeader}>
                                    <View style={[styles.sectionIcon, { backgroundColor: COLORS.textMuted + '15' }]}>
                                        <Feather name="file-text" size={16} color={COLORS.text} />
                                    </View>
                                    <Text style={styles.sectionTitle}>NOTAS</Text>
                                </View>
                                <Text style={styles.notesText}>{notes}</Text>
                            </View>
                        )}

                        <View style={{ height: SIZES.navBarHeight + insets.bottom + 20 }} />
                    </ScrollView>

                    {/* View Mode Footer - 4 Actions */}
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

                        {/* Only show Convert if not already converted */}
                        {status !== 'converted' && (
                            <TouchableOpacity style={styles.footerButton} onPress={handleConvert}>
                                <View style={[styles.convertIconContainer, { backgroundColor: COLORS.primary + '20' }]}>
                                    <Feather name="check-circle" size={22} color={COLORS.primary} />
                                </View>
                                <Text style={[styles.footerLabel, { color: COLORS.primary, fontWeight: '700' }]}>
                                    Convertir
                                </Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={styles.footerButton} onPress={handleShare}>
                            <Feather name="share-2" size={20} color={COLORS.primary} style={styles.footerIcon} />
                            <Text style={styles.footerLabel}>Compartir</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.footerButton} onPress={handleDelete}>
                            <Feather name="trash-2" size={20} color={COLORS.error} style={styles.footerIcon} />
                            <Text style={[styles.footerLabel, { color: COLORS.error }]}>Eliminar</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
            {/* Convert Modal */}
            <ConvertQuotationModal
                visible={showConvertModal}
                quotation={activeQuotation}
                onClose={() => setShowConvertModal(false)}
                onConfirm={handleConfirmConvert}
            />
        </View>
    );
};

export default QuotationDetailScreen;

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
    headerSubtitle: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.textMuted,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: SPACING.lg,
    },
    // Summary Card
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
    dateText: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
    },
    // Sections
    sectionContainer: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
        ...SHADOWS.small,
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
    sectionTitle: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        textTransform: 'uppercase',
        opacity: 0.7
    },
    // Rows
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
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 4,
    },
    // Items
    itemsScrollArea: {
        maxHeight: 250,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        paddingHorizontal: SPACING.sm,
        backgroundColor: COLORS.surface,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
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
    // Financial
    financialRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    totalLabel: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: '700',
        color: COLORS.textSecondary,
    },
    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    financialLabel: {
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.textSecondary,
    },
    financialValue: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: '600',
        color: COLORS.text,
    },
    // Notes
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
    convertIconContainer: {
        padding: 6,
        borderRadius: 8,
        marginBottom: 2,
    },
    // Status
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#dcfce7',
        padding: SPACING.md,
        borderRadius: 12,
        marginBottom: SPACING.lg,
        gap: SPACING.sm,
    },
    statusText: {
        color: '#15803d',
        fontWeight: '600',
        fontSize: TYPOGRAPHY.size.sm,
        flex: 1,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    }
});
