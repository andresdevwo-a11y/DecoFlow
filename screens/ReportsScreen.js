import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, SIZES, RADIUS } from '../constants/Theme';
import { useFinance, EXPENSE_CATEGORIES } from '../context/FinanceContext';
import { useAlert } from '../context/AlertContext';
import CustomDatePicker from '../components/finance/CustomDatePicker';
import ExpandableIncomeSection from '../components/ExpandableIncomeSection';
import { exportReportToPDF, exportReportToExcel } from '../services/reportExportService';

const ReportsScreen = ({ onBack }) => {
    const insets = useSafeAreaInsets();
    const {
        generateReportByPeriod,
        saveReport,
        savedReports,
        deleteReport,
        updateReportName
    } = useFinance();

    const { showAlert, showConfirm, showActionSheet } = useAlert();

    // Tabs state
    const [activeTab, setActiveTab] = useState('create'); // 'create' | 'saved'

    // Create Report state
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [includeFilters, setIncludeFilters] = useState({
        sales: true,
        rentals: true,
        decorations: true,
        expenses: true
    });

    // Saved Reports state
    const [viewingReport, setViewingReport] = useState(null);

    // Rename Modal State
    const [renameModalVisible, setRenameModalVisible] = useState(false);
    const [renameText, setRenameText] = useState('');
    const [reportToRename, setReportToRename] = useState(null);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const handleExportPDF = async (reportData) => {
        try {
            await exportReportToPDF(reportData);
        } catch (error) {
            showAlert("error", "Error", error.message || "Fallo al exportar PDF");
        }
    };

    const handleExportExcel = async (reportData) => {
        try {
            await exportReportToExcel(reportData);
        } catch (error) {
            showAlert("error", "Error", error.message || "Fallo al exportar Excel");
        }
    };

    const showExportOptions = (reportData) => {
        showActionSheet({
            title: "Exportar Reporte",
            message: "Selecciona el formato deseado:",
            actions: [
                {
                    text: "Archivo Excel (XLSX)",
                    icon: "file-text",
                    onPress: () => handleExportExcel(reportData)
                },
                {
                    text: "Documento PDF",
                    icon: "file",
                    onPress: () => handleExportPDF(reportData)
                }
            ],
            cancelText: "Cancelar"
        });
    };

    const generateReport = useCallback(async () => {
        setIsLoading(true);
        try {
            if (selectedPeriod === 'custom') {
                if (!startDate || !endDate) {
                    showAlert("error", "Error", "Selecciona fecha de inicio y fin");
                    setIsLoading(false);
                    return;
                }
                if (new Date(startDate) > new Date(endDate)) {
                    showAlert("error", "Error", "La fecha de inicio no puede ser mayor a la fecha fin");
                    setIsLoading(false);
                    return;
                }
            }

            // Use unified function
            const result = await generateReportByPeriod(selectedPeriod, {
                startDate,
                endDate,
                filters: includeFilters
            });

            // Add metadata for saving (some might be redundant now as context handles it, but keeping for safety)
            if (result) {
                // Name generation is better handled here based on the result
                result.name = `Reporte ${result.period.label}`;
            }

            setReport(result);
        } catch (error) {
            // Show validation error to user without logging to terminal if it's just a validation message
            if (error.message && !error.message.includes('Selecciona al menos')) {
                console.error("Error generating report:", error);
            }
            showAlert("error", "Error", error.message || "No se pudo generar el reporte");
        } finally {
            setIsLoading(false);
        }
    }, [selectedPeriod, startDate, endDate, includeFilters, generateReportByPeriod]);

    const handleSaveReport = async () => {
        if (!report) return;

        showConfirm({
            title: "Guardar Reporte",
            message: "Se guardará con el nombre por defecto. Podrás renombrarlo después.",
            confirmText: "Guardar",
            onConfirm: async () => {
                try {
                    const reportToSave = {
                        ...report,
                        name: report.name || `Reporte ${report.period.label}`,
                        startDate: report.period.startDate,
                        endDate: report.period.endDate
                    };
                    await saveReport(reportToSave);
                    showAlert("success", "Éxito", "Reporte guardado correctamente");
                } catch (error) {
                    showAlert("error", "Error", "No se pudo guardar el reporte");
                }
            }
        });
    };

    const confirmSave = async () => {
        if (!report) return;
        try {
            const reportToSave = {
                ...report,
                name: `Reporte ${new Date().toLocaleDateString()}`, // Default name
                startDate: report.period.startDate,
                endDate: report.period.endDate
            };
            await saveReport(reportToSave);
            showAlert("success", "Éxito", "Reporte guardado correctamente");
        } catch (error) {
            showAlert("error", "Error", "No se pudo guardar el reporte");
        }
    };

    const handleDeleteReport = (report) => {
        showConfirm({
            title: "Eliminar Reporte",
            message: "¿Estás seguro de que deseas eliminar este reporte permanentemente?",
            confirmText: "Eliminar",
            isDestructive: true,
            onConfirm: async () => {
                try {
                    await deleteReport(report.id);
                    if (viewingReport?.id === report.id) {
                        setViewingReport(null);
                    }
                } catch (error) {
                    showAlert("error", "Error", "No se pudo eliminar el reporte");
                }
            }
        });
    };

    const openRenameModal = (report) => {
        setReportToRename(report);
        setRenameText(report.name);
        setRenameModalVisible(true);
    };

    const handleRenameSubmit = async () => {
        if (!reportToRename || !renameText.trim()) return;

        try {
            await updateReportName(reportToRename.id, renameText.trim());
            setRenameModalVisible(false);

            setViewingReport(prev => ({ ...prev, name: renameText.trim() }));
        } catch (error) {
            showAlert("error", "Error", "No se pudo renombrar el reporte");
        }
    };

    const formatPeriodLabel = (reportData) => {
        if (!reportData) return '';
        const startDate = reportData.period?.startDate || reportData.startDate;
        const endDate = reportData.period?.endDate || reportData.endDate;

        if (!startDate || !endDate) return '';

        if (startDate === endDate) {
            return new Date(startDate).toLocaleDateString('es-CO', {
                day: 'numeric', month: 'short'
            });
        }
        return `${new Date(startDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} - ${new Date(endDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}`;
    };

    const periodButtons = [
        { key: 'today', label: 'Hoy' },
        { key: 'week', label: 'Semana' },
        { key: 'month', label: 'Mes' },
        { key: 'year', label: 'Año' },
    ];

    const renderReportContent = (data, isSaved = false) => (
        <View style={styles.reportContainer}>
            <View style={styles.reportHeader}>
                <Text style={styles.reportTitle}>{isSaved ? data.name : 'Resultado del Reporte'}</Text>
                <Text style={styles.reportPeriod}>{formatPeriodLabel(data)}</Text>
                {isSaved && (
                    <Text style={styles.savedDate}>Creado el: {new Date(data.createdAt).toLocaleDateString()}</Text>
                )}
            </View>

            {/* Income Section */}
            <View style={styles.reportSection}>
                <Text style={styles.reportSectionTitle}>Ingresos</Text>
                {data.summary?.sales && (
                    <ExpandableIncomeSection
                        icon="trending-up"
                        iconColor="#22C55E"
                        label="Ventas"
                        count={data.summary.sales.count}
                        total={data.summary.sales.total}
                        transactions={data.transactions?.filter(t => t.type === 'sale') || []}
                        formatCurrency={formatCurrency}
                    />
                )}
                {data.summary?.rentals && (
                    <ExpandableIncomeSection
                        icon="package"
                        iconColor="#3B82F6"
                        label="Alquileres"
                        count={data.summary.rentals.count}
                        total={data.summary.rentals.total}
                        transactions={data.transactions?.filter(t => t.type === 'rental') || []}
                        formatCurrency={formatCurrency}
                    />
                )}
                {data.summary?.decorations && (
                    <ExpandableIncomeSection
                        icon="gift"
                        iconColor="#F97316"
                        label="Decoraciones"
                        count={data.summary.decorations.count}
                        total={data.summary.decorations.total}
                        transactions={data.transactions?.filter(t => t.type === 'decoration') || []}
                        formatCurrency={formatCurrency}
                    />
                )}
                <View style={styles.reportDivider} />
                <View style={styles.reportRow}>
                    <Text style={styles.reportSubtotalLabel}>Total Ingresos</Text>
                    <Text style={styles.reportSubtotalValue}>
                        {formatCurrency(data.summary?.totalIncome)}
                    </Text>
                </View>
            </View>

            {/* Expenses Section */}
            {data.expensesByCategory && (
                <View style={styles.reportSection}>
                    <Text style={styles.reportSectionTitle}>Gastos por Categoría</Text>
                    {data.expensesByCategory.length > 0 ? (
                        data.expensesByCategory.map((item) => (
                            <View key={item.category} style={styles.reportRow}>
                                <View style={styles.reportRowLeft}>
                                    <Feather
                                        name={EXPENSE_CATEGORIES[item.category]?.icon || 'minus'}
                                        size={16}
                                        color="#EF4444"
                                    />
                                    <Text style={styles.reportRowLabel}>
                                        {EXPENSE_CATEGORIES[item.category]?.label || item.category}
                                    </Text>
                                </View>
                                <Text style={[styles.reportRowValue, { color: '#EF4444' }]}>
                                    -{formatCurrency(item.total)}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noDataText}>Sin gastos en este período</Text>
                    )}
                    <View style={styles.reportDivider} />
                    <View style={styles.reportRow}>
                        <Text style={styles.reportSubtotalLabel}>Total Gastos</Text>
                        <Text style={[styles.reportSubtotalValue, { color: '#EF4444' }]}>
                            -{formatCurrency(data.summary?.expenses?.total)}
                        </Text>
                    </View>
                </View>
            )}

            {/* Balance */}
            <View style={styles.balanceSection}>
                <Text style={styles.balanceLabel}>BALANCE NETO</Text>
                <Text style={[
                    styles.balanceValue,
                    data.summary?.balance >= 0 ? styles.positiveBalance : styles.negativeBalance
                ]}>
                    {formatCurrency(data.summary?.balance)}
                </Text>
            </View>

            {/* Actions (Only when creating) */}
            {!isSaved && (
                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.saveButton} onPress={confirmSave}>
                        <Feather name="save" size={18} color={COLORS.primary} />
                        <Text style={styles.saveButtonText}>Guardar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.exportButton, { flex: 1 }]}
                        onPress={() => showExportOptions(data)}
                    >
                        <Feather name="download" size={18} color="#FFF" />
                        <Text style={[styles.exportButtonText, { color: '#FFF' }]}>
                            Exportar
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
                <TouchableOpacity onPress={viewingReport ? () => setViewingReport(null) : onBack} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {viewingReport ? 'Detalle Reporte' : 'Reportes'}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Tabs (only if not viewing detailed report) */}
            {!viewingReport && (
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'create' && styles.tabActive]}
                        onPress={() => setActiveTab('create')}
                    >
                        <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>
                            Crear reporte
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
                        onPress={() => setActiveTab('saved')}
                    >
                        <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
                            Reportes guardados
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* VIEW DETAIL */}
                {viewingReport ? (
                    renderReportContent(viewingReport, true)
                ) : (
                    <>
                        {/* CREATE TAB */}
                        {activeTab === 'create' && (
                            <>
                                {/* Period Selection */}
                                <View style={styles.section}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm }}>
                                        <Text style={styles.sectionTitle}>Período Rápido</Text>
                                        {selectedPeriod === 'custom' && (
                                            <View style={styles.customBadge}>
                                                <Text style={styles.customBadgeText}>Rango personalizado activo</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={[
                                        styles.periodButtons,
                                        selectedPeriod === 'custom' && styles.periodButtonsDisabled
                                    ]}>
                                        {periodButtons.map(({ key, label }) => (
                                            <TouchableOpacity
                                                key={key}
                                                style={[
                                                    styles.periodButton,
                                                    selectedPeriod === key && styles.periodButtonSelected,
                                                    // Visual feedback for disabled state
                                                    selectedPeriod === 'custom' && styles.periodButtonDimmed
                                                ]}
                                                onPress={() => setSelectedPeriod(key)}
                                            >
                                                <Text style={[
                                                    styles.periodButtonText,
                                                    selectedPeriod === key && styles.periodButtonTextSelected
                                                ]}>
                                                    {label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Custom Date Range */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Rango Personalizado</Text>
                                    <View style={styles.dateRow}>
                                        <View style={{ flex: 1 }}>
                                            <CustomDatePicker
                                                placeholder="Desde"
                                                date={startDate}
                                                onDateChange={(newDate) => {
                                                    setStartDate(newDate);
                                                    setSelectedPeriod('custom');
                                                }}
                                            />
                                        </View>
                                        <Feather name="arrow-right" size={16} color={COLORS.textMuted} style={{ marginHorizontal: SPACING.xs }} />
                                        <View style={{ flex: 1 }}>
                                            <CustomDatePicker
                                                placeholder="Hasta"
                                                date={endDate}
                                                minDate={startDate ? new Date(startDate) : undefined}
                                                onDateChange={(newDate) => {
                                                    setEndDate(newDate);
                                                    setSelectedPeriod('custom');
                                                }}
                                            />
                                        </View>
                                    </View>
                                </View>

                                {/* Filters */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Incluir en Reporte</Text>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.filters}
                                    >
                                        <TouchableOpacity
                                            style={[styles.filterChip, includeFilters.sales && styles.filterChipActive]}
                                            onPress={() => setIncludeFilters(prev => ({ ...prev, sales: !prev.sales }))}
                                        >
                                            <Feather name={includeFilters.sales ? "check-square" : "square"} size={18} color={includeFilters.sales ? '#22C55E' : COLORS.textMuted} />
                                            <Text style={[styles.filterText, includeFilters.sales && { color: '#22C55E' }]}>Ventas</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.filterChip, includeFilters.rentals && styles.filterChipActive]}
                                            onPress={() => setIncludeFilters(prev => ({ ...prev, rentals: !prev.rentals }))}
                                        >
                                            <Feather name={includeFilters.rentals ? "check-square" : "square"} size={18} color={includeFilters.rentals ? '#3B82F6' : COLORS.textMuted} />
                                            <Text style={[styles.filterText, includeFilters.rentals && { color: '#3B82F6' }]}>Alquileres</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.filterChip, includeFilters.decorations && styles.filterChipActive]}
                                            onPress={() => setIncludeFilters(prev => ({ ...prev, decorations: !prev.decorations }))}
                                        >
                                            <Feather name={includeFilters.decorations ? "check-square" : "square"} size={18} color={includeFilters.decorations ? '#F97316' : COLORS.textMuted} />
                                            <Text style={[styles.filterText, includeFilters.decorations && { color: '#F97316' }]}>Decoraciones</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.filterChip, includeFilters.expenses && styles.filterChipActive]}
                                            onPress={() => setIncludeFilters(prev => ({ ...prev, expenses: !prev.expenses }))}
                                        >
                                            <Feather name={includeFilters.expenses ? "check-square" : "square"} size={18} color={includeFilters.expenses ? '#EF4444' : COLORS.textMuted} />
                                            <Text style={[styles.filterText, includeFilters.expenses && { color: '#EF4444' }]}>Gastos</Text>
                                        </TouchableOpacity>
                                    </ScrollView>
                                </View>

                                {/* Generate Button */}
                                <TouchableOpacity
                                    style={styles.generateButton}
                                    onPress={generateReport}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <>
                                            <Feather name="bar-chart-2" size={20} color="#FFF" />
                                            <Text style={styles.generateButtonText}>Generar Reporte</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                {/* Generated Report Result */}
                                {report && renderReportContent(report, false)}
                            </>
                        )}

                        {/* SAVED TAB */}
                        {activeTab === 'saved' && (
                            <View style={styles.savedList}>
                                {savedReports.length === 0 ? (
                                    <View style={styles.emptyState}>
                                        <Feather name="archive" size={48} color={COLORS.textMuted} />
                                        <Text style={styles.emptyStateText}>No tienes reportes guardados</Text>
                                        <Text style={styles.emptyStateSubtext}>Genera un reporte y guárdalo para verlo aquí.</Text>
                                    </View>
                                ) : (
                                    savedReports.map((saved) => (
                                        <TouchableOpacity
                                            key={saved.id}
                                            style={styles.savedCard}
                                            onPress={() => setViewingReport(saved)}
                                        >
                                            <View style={styles.savedCardHeader}>
                                                <View>
                                                    <Text style={styles.savedCardTitle}>{saved.name}</Text>
                                                    <Text style={styles.savedCardDate}>{formatPeriodLabel(saved)}</Text>
                                                </View>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                    <TouchableOpacity
                                                        onPress={(e) => {
                                                            // Stop propagation isn't always reliable in RN without direct event handling, 
                                                            // but putting it in a separate view helping spacing.
                                                            // We'll trust the layout. 
                                                            // Note: OnPress in RN doesn't bubble like Web DOM in all cases.
                                                            // To be safe, we rely on this touchable capturing the press.
                                                            handleDeleteReport(saved);
                                                        }}
                                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                    >
                                                        <Feather name="trash-2" size={20} color="#EF4444" />
                                                    </TouchableOpacity>
                                                    <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
                                                </View>
                                            </View>
                                            <View style={styles.savedCardFooter}>
                                                <Text style={styles.savedCardBalanceLabel}>Balance:</Text>
                                                <Text style={[
                                                    styles.savedCardBalanceValue,
                                                    saved.summary.balance >= 0 ? styles.positiveBalance : styles.negativeBalance
                                                ]}>
                                                    {formatCurrency(saved.summary.balance)}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </View>
                        )}
                    </>
                )}

                <View style={{ height: insets.bottom + SPACING.xl + (viewingReport ? SIZES.navBarHeight : 0) }} />
            </ScrollView>

            {/* Fixed Bottom Action Bar for Saved Reports */}
            {viewingReport && (
                <View style={[
                    styles.detailFooter,
                    {
                        height: SIZES.navBarHeight + insets.bottom,
                        paddingBottom: insets.bottom,
                    }
                ]}>
                    <TouchableOpacity style={styles.detailActionButton} onPress={() => showExportOptions(viewingReport)}>
                        <Feather name="download" size={20} color={COLORS.primary} style={styles.detailActionIcon} />
                        <Text style={styles.detailActionLabel}>Exportar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.detailActionButton} onPress={() => handleExportPDF(viewingReport)}>
                        <Feather name="share-2" size={20} color={COLORS.primary} style={styles.detailActionIcon} />
                        <Text style={styles.detailActionLabel}>Compartir</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.detailActionButton} onPress={() => openRenameModal(viewingReport)}>
                        <Feather name="edit-3" size={20} color={COLORS.primary} style={styles.detailActionIcon} />
                        <Text style={styles.detailActionLabel}>Editar nombre</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.detailActionButton} onPress={() => handleDeleteReport(viewingReport)}>
                        <Feather name="trash-2" size={20} color="#EF4444" style={styles.detailActionIcon} />
                        <Text style={[styles.detailActionLabel, styles.detailActionLabelDestructive]}>Eliminar</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Rename Modal */}
            <Modal
                visible={renameModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setRenameModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <TouchableWithoutFeedback onPress={() => setRenameModalVisible(false)}>
                        <View style={styles.modalBackdrop} />
                    </TouchableWithoutFeedback>

                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Renombrar Reporte</Text>
                        <Text style={styles.modalSubtitle}>Ingresa el nuevo nombre para este reporte</Text>

                        <TextInput
                            style={styles.modalInput}
                            value={renameText}
                            onChangeText={setRenameText}
                            placeholder="Nombre del reporte"
                            placeholderTextColor={COLORS.textMuted}
                            autoFocus
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={() => setRenameModalVisible(false)}
                            >
                                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonConfirm]}
                                onPress={handleRenameSubmit}
                            >
                                <Text style={styles.modalButtonTextConfirm}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

export default ReportsScreen;

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
    // TABS
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: COLORS.primary,
    },
    tabText: {
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.textMuted,
        fontWeight: TYPOGRAPHY.weight.medium,
    },
    tabTextActive: {
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.weight.semibold,
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
    sectionTitle: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    periodButtons: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    periodButton: {
        flex: 1,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.sm,
        borderRadius: 10,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    periodButtonSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    periodButtonText: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.textSecondary,
    },
    periodButtonTextSelected: {
        color: '#FFF',
    },
    // New styles for custom period improvements
    periodButtonsDisabled: {
        opacity: 0.8,
    },
    periodButtonDimmed: {
        backgroundColor: COLORS.background,
        borderColor: COLORS.border,
        opacity: 0.6
    },
    customBadge: {
        backgroundColor: COLORS.primaryLight || '#DBEAFE', // Fallback if primaryLight not defined
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: 12,
    },
    customBadgeText: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.weight.bold,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    filters: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: SPACING.xs,
    },
    filterChipActive: {
        backgroundColor: COLORS.surface,
    },
    filterText: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
    },
    generateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        padding: SPACING.lg,
        marginBottom: SPACING.xl,
        gap: SPACING.sm,
        ...SHADOWS.medium,
    },
    generateButtonText: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: '#FFF',
    },
    reportContainer: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: SPACING.lg,
        ...SHADOWS.medium,
    },
    reportHeader: {
        marginBottom: SPACING.lg,
    },
    reportTitle: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
    },
    reportPeriod: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textMuted,
        marginTop: SPACING.xs,
    },
    savedDate: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.textMuted,
        marginTop: 4
    },
    reportSection: {
        marginBottom: SPACING.lg,
    },
    reportSectionTitle: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.textSecondary,
        marginBottom: SPACING.md,
    },
    reportRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
    },
    reportRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    reportRowLabel: {
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.text,
    },
    reportRowValue: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.semibold,
    },
    reportDivider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: SPACING.sm,
    },
    reportSubtotalLabel: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.text,
    },
    reportSubtotalValue: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
    },
    noDataText: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textMuted,
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: SPACING.md,
    },
    balanceSection: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: SPACING.lg,
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    balanceLabel: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.textSecondary,
        letterSpacing: 1,
        marginBottom: SPACING.xs,
    },
    balanceValue: {
        fontSize: TYPOGRAPHY.size.xxl,
        fontWeight: TYPOGRAPHY.weight.bold,
    },
    positiveBalance: {
        color: '#22C55E',
    },
    negativeBalance: {
        color: '#EF4444',
    },
    // New Action Buttons
    actionButtons: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginTop: SPACING.sm
    },
    saveButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        borderRadius: 10,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.primary,
        gap: SPACING.sm
    },
    saveButtonText: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.primary
    },
    exportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.sm,
        borderRadius: 10,
        backgroundColor: COLORS.primary, // Changed to fill for visibility or keep outline if preferred
        gap: SPACING.sm,
    },
    exportButtonText: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: '#FFF',
    },
    // Saved List Styles
    savedList: {
        gap: SPACING.md,
    },
    savedCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: SPACING.md,
        ...SHADOWS.small,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    savedCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    savedCardTitle: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
    },
    savedCardDate: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textMuted,
    },
    savedCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    savedCardBalanceLabel: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
    },
    savedCardBalanceValue: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.bold,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
        marginTop: SPACING.xl
    },
    emptyStateText: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.textSecondary,
        marginTop: SPACING.md
    },
    emptyStateSubtext: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginTop: SPACING.xs
    },
    // Footer Action Bar
    detailFooter: {
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
    detailActionButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    detailActionIcon: {
        marginBottom: 4,
    },
    detailActionLabel: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.text,
        fontWeight: TYPOGRAPHY.weight.medium,
    },
    detailActionLabelDestructive: {
        color: '#EF4444',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '85%',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        ...SHADOWS.modal,
        zIndex: 1001,
    },
    modalTitle: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        marginBottom: SPACING.xs,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textMuted,
        marginBottom: SPACING.lg,
        textAlign: 'center',
    },
    modalInput: {
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
        marginBottom: SPACING.xl,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    modalButton: {
        flex: 1,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonCancel: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    modalButtonConfirm: {
        backgroundColor: COLORS.primary,
    },
    modalButtonTextCancel: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.textSecondary,
    },
    modalButtonTextConfirm: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: '#FFF',
    }
});
