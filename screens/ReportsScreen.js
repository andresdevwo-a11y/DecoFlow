
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
import Header from '../components/Header';

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
            <View style={styles.reportHeaderCard}>
                <View style={styles.reportHeaderTop}>
                    <Text style={styles.reportTitle} numberOfLines={1}>
                        {isSaved ? data.name : 'Resultado'}
                    </Text>
                    {isSaved && (
                        <View style={styles.savedDateBadge}>
                            <Feather name="calendar" size={12} color={COLORS.textSecondary} />
                            <Text style={styles.savedDateText}>
                                {new Date(data.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                    )}
                </View>
                <Text style={styles.reportPeriodText}>{formatPeriodLabel(data)}</Text>
            </View>

            {/* Income Section */}
            <View style={styles.sectionCard}>
                <Text style={styles.cardSectionTitle}>INGRESOS</Text>
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
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Ingresos</Text>
                    <Text style={styles.summaryValuePositive}>
                        {formatCurrency(data.summary?.totalIncome)}
                    </Text>
                </View>
            </View>

            {/* Expenses Section */}
            {data.expensesByCategory && (
                <View style={styles.sectionCard}>
                    <Text style={styles.cardSectionTitle}>GASTOS</Text>
                    {data.expensesByCategory.length > 0 ? (
                        data.expensesByCategory.map((item) => (
                            <View key={item.category} style={styles.expenseRow}>
                                <View style={styles.expenseInfo}>
                                    <View style={styles.categoryIcon}>
                                        <Feather
                                            name={EXPENSE_CATEGORIES[item.category]?.icon || 'minus'}
                                            size={14}
                                            color="#EF4444"
                                        />
                                    </View>
                                    <Text style={styles.expenseLabel}>
                                        {EXPENSE_CATEGORIES[item.category]?.label || item.category}
                                    </Text>
                                </View>
                                <Text style={styles.expenseCategoryValue}>
                                    -{formatCurrency(item.total)}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyExpenses}>
                            <Feather name="check-circle" size={24} color={COLORS.success} opacity={0.5} />
                            <Text style={styles.emptyExpensesText}>Sin gastos registrados</Text>
                        </View>
                    )}
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Gastos</Text>
                        <Text style={styles.summaryValueNegative}>
                            -{formatCurrency(data.summary?.expenses?.total)}
                        </Text>
                    </View>
                </View>
            )}

            {/* Balance */}
            <View style={styles.balanceCard}>
                <View style={[
                    styles.balanceIconContainer,
                    data.summary?.balance >= 0 ? styles.balanceIconPositive : styles.balanceIconNegative
                ]}>
                    <Feather
                        name={data.summary?.balance >= 0 ? "trending-up" : "trending-down"}
                        size={24}
                        color={data.summary?.balance >= 0 ? "#22C55E" : "#EF4444"}
                    />
                </View>
                <View style={styles.balanceInfo}>
                    <Text style={styles.balanceLabel}>BALANCE NETO</Text>
                    <Text style={[
                        styles.balanceValue,
                        data.summary?.balance >= 0 ? styles.positiveText : styles.negativeText
                    ]}>
                        {formatCurrency(data.summary?.balance)}
                    </Text>
                </View>
            </View>

            {/* Actions (Only when creating) */}
            {!isSaved && (
                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.saveButton} onPress={confirmSave}>
                        <Feather name="save" size={20} color={COLORS.primary} />
                        <Text style={styles.saveButtonText}>Guardar Reporte</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.exportButton}
                        onPress={() => showExportOptions(data)}
                    >
                        <Feather name="download" size={20} color="#FFF" />
                        <Text style={styles.exportButtonText}>Exportar</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            {!viewingReport && (
                <Header title="Reportes" onBack={onBack} />
            )}

            {viewingReport && (
                <Header title="Detalle del Reporte" onBack={() => setViewingReport(null)} />
            )}

            {/* Tabs (only if not viewing detailed report) */}
            {!viewingReport && (
                <View style={styles.tabsWrapper}>
                    <View style={styles.segmentedControl}>
                        <TouchableOpacity
                            style={[styles.segment, activeTab === 'create' && styles.segmentActive]}
                            onPress={() => setActiveTab('create')}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.segmentText, activeTab === 'create' && styles.segmentTextActive]}>
                                Generar
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.segment, activeTab === 'saved' && styles.segmentActive]}
                            onPress={() => setActiveTab('saved')}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.segmentText, activeTab === 'saved' && styles.segmentTextActive]}>
                                Guardados
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.content,
                    { paddingBottom: viewingReport ? 100 : 40 }
                ]}
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
                                <View style={styles.inputGroup}>
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionTitle}>Período</Text>
                                        {selectedPeriod === 'custom' && (
                                            <View style={styles.badge}>
                                                <Text style={styles.badgeText}>Personalizado</Text>
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.periodGrid}>
                                        {periodButtons.map(({ key, label }) => (
                                            <TouchableOpacity
                                                key={key}
                                                style={[
                                                    styles.periodCard,
                                                    selectedPeriod === key && styles.periodCardSelected,
                                                    selectedPeriod === 'custom' && styles.periodCardDimmed
                                                ]}
                                                onPress={() => setSelectedPeriod(key)}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[
                                                    styles.periodCardText,
                                                    selectedPeriod === key && styles.periodCardTextSelected
                                                ]}>
                                                    {label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Custom Date Range */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Rango de Fechas</Text>
                                    <View style={styles.dateRow}>
                                        <View style={{ flex: 1 }}>
                                            <CustomDatePicker
                                                placeholder="Inicio"
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
                                                placeholder="Fin"
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
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Incluir</Text>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.filterContainer}
                                    >
                                        <TouchableOpacity
                                            style={[styles.filterChip, includeFilters.sales && styles.filterChipActive]}
                                            onPress={() => setIncludeFilters(prev => ({ ...prev, sales: !prev.sales }))}
                                        >
                                            <Feather name={includeFilters.sales ? "check" : "circle"} size={14} color={includeFilters.sales ? '#22C55E' : COLORS.textMuted} />
                                            <Text style={[styles.filterText, includeFilters.sales && { color: '#22C55E' }]}>Ventas</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.filterChip, includeFilters.rentals && styles.filterChipActive]}
                                            onPress={() => setIncludeFilters(prev => ({ ...prev, rentals: !prev.rentals }))}
                                        >
                                            <Feather name={includeFilters.rentals ? "check" : "circle"} size={14} color={includeFilters.rentals ? '#3B82F6' : COLORS.textMuted} />
                                            <Text style={[styles.filterText, includeFilters.rentals && { color: '#3B82F6' }]}>Alquileres</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.filterChip, includeFilters.decorations && styles.filterChipActive]}
                                            onPress={() => setIncludeFilters(prev => ({ ...prev, decorations: !prev.decorations }))}
                                        >
                                            <Feather name={includeFilters.decorations ? "check" : "circle"} size={14} color={includeFilters.decorations ? '#F97316' : COLORS.textMuted} />
                                            <Text style={[styles.filterText, includeFilters.decorations && { color: '#F97316' }]}>Deco</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.filterChip, includeFilters.expenses && styles.filterChipActive]}
                                            onPress={() => setIncludeFilters(prev => ({ ...prev, expenses: !prev.expenses }))}
                                        >
                                            <Feather name={includeFilters.expenses ? "check" : "circle"} size={14} color={includeFilters.expenses ? '#EF4444' : COLORS.textMuted} />
                                            <Text style={[styles.filterText, includeFilters.expenses && { color: '#EF4444' }]}>Gastos</Text>
                                        </TouchableOpacity>
                                    </ScrollView>
                                </View>

                                {/* Generate Button */}
                                <TouchableOpacity
                                    style={styles.mainButton}
                                    onPress={generateReport}
                                    disabled={isLoading}
                                    activeOpacity={0.8}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <>
                                            <Text style={styles.mainButtonText}>Generar Reporte</Text>
                                            <Feather name="bar-chart-2" size={20} color="#FFF" />
                                        </>
                                    )}
                                </TouchableOpacity>

                                {/* Generated Report Result */}
                                {report && (
                                    <View style={styles.resultContainer}>
                                        {renderReportContent(report, false)}
                                    </View>
                                )}
                            </>
                        )}

                        {/* SAVED TAB */}
                        {activeTab === 'saved' && (
                            <View style={styles.savedList}>
                                {savedReports.length === 0 ? (
                                    <View style={styles.emptyState}>
                                        <View style={styles.emptyIconBg}>
                                            <Feather name="archive" size={32} color={COLORS.primary} />
                                        </View>
                                        <Text style={styles.emptyStateText}>Sin reportes guardados</Text>
                                        <Text style={styles.emptyStateSubtext}>Los reportes que guardes aparecerán aquí</Text>
                                    </View>
                                ) : (
                                    savedReports.map((saved) => (
                                        <TouchableOpacity
                                            key={saved.id}
                                            style={styles.savedCard}
                                            onPress={() => setViewingReport(saved)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.savedCardLeft}>
                                                <View style={styles.savedCardIcon}>
                                                    <Feather name="file-text" size={20} color={COLORS.primary} />
                                                </View>
                                                <View style={styles.savedCardInfo}>
                                                    <Text style={styles.savedCardTitle} numberOfLines={1}>{saved.name}</Text>
                                                    <Text style={styles.savedCardDate}>{formatPeriodLabel(saved)}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.savedCardRight}>
                                                <Text style={[
                                                    styles.savedBalance,
                                                    saved.summary.balance >= 0 ? styles.positiveText : styles.negativeText
                                                ]}>
                                                    {formatCurrency(saved.summary.balance)}
                                                </Text>
                                                <Feather name="chevron-right" size={16} color={COLORS.textMuted} />
                                            </View>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            {/* Fixed Bottom Action Bar for Saved Reports */}
            {viewingReport && (
                <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
                    <TouchableOpacity style={styles.actionItem} onPress={() => showExportOptions(viewingReport)}>
                        <View style={styles.actionIconBg}>
                            <Feather name="download" size={20} color={COLORS.primary} />
                        </View>
                        <Text style={styles.actionLabel}>Exportar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionItem} onPress={() => openRenameModal(viewingReport)}>
                        <View style={styles.actionIconBg}>
                            <Feather name="edit-2" size={20} color={COLORS.primary} />
                        </View>
                        <Text style={styles.actionLabel}>Renombrar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionItem} onPress={() => handleDeleteReport(viewingReport)}>
                        <View style={[styles.actionIconBg, { backgroundColor: '#FEE2E2' }]}>
                            <Feather name="trash-2" size={20} color="#EF4444" />
                        </View>
                        <Text style={[styles.actionLabel, { color: '#EF4444' }]}>Eliminar</Text>
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
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Renombrar Reporte</Text>
                            <TouchableOpacity onPress={() => setRenameModalVisible(false)}>
                                <Feather name="x" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>Ingresa un nuevo nombre para identificar este reporte.</Text>

                        <TextInput
                            style={styles.modalInput}
                            value={renameText}
                            onChangeText={setRenameText}
                            placeholder="Nombre del reporte"
                            placeholderTextColor={COLORS.textMuted}
                            autoFocus
                            returnKeyType="done"
                            onSubmitEditing={handleRenameSubmit}
                        />

                        <TouchableOpacity
                            style={styles.modalButtonConfirm}
                            onPress={handleRenameSubmit}
                        >
                            <Text style={styles.modalButtonTextConfirm}>Guardar Cambios</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
            <View style={{ height: insets.bottom, backgroundColor: '#FFF' }} />
        </View>
    );
};

export default ReportsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.md,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        ...SHADOWS.sm,
        zIndex: 10,
    },
    detailHeaderTitle: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RADIUS.full,
    },

    // TABS - SEGMENTED CONTROL
    tabsWrapper: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.background,
    },
    segmentedControl: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.full,
        padding: 4,
        ...SHADOWS.sm,
    },
    segment: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RADIUS.full,
    },
    segmentActive: {
        backgroundColor: COLORS.primary,
        ...SHADOWS.sm,
    },
    segmentText: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.textSecondary,
    },
    segmentTextActive: {
        color: '#FFF',
        fontWeight: TYPOGRAPHY.weight.bold,
    },

    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.sm,
    },

    // FORM STYLES
    inputGroup: {
        marginBottom: SPACING.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
    },
    badge: {
        backgroundColor: COLORS.primary + '20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: RADIUS.sm,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.primary,
    },
    inputLabel: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
    },

    // PERIOD GRID
    periodGrid: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    periodCard: {
        flex: 1,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.sm,
    },
    periodCardSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '10',
    },
    periodCardDimmed: {
        opacity: 0.5,
        backgroundColor: COLORS.background,
    },
    periodCardText: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.textSecondary,
    },
    periodCardTextSelected: {
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.weight.bold,
    },

    // DATE ROW
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },

    // FILTERS
    filterContainer: {
        flexDirection: 'row',
        gap: SPACING.sm,
        paddingBottom: 4,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 6,
    },
    filterChipActive: {
        borderColor: COLORS.border, // Or specific color if needed, but cleaner with just icon color
        backgroundColor: COLORS.surface,
        ...SHADOWS.sm,
    },
    filterText: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.textSecondary,
    },

    // MAIN BUTTON
    mainButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.lg,
        borderRadius: RADIUS.xl,
        gap: SPACING.sm,
        ...SHADOWS.md,
        marginTop: SPACING.sm,
    },
    mainButtonText: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: '#FFF',
    },

    // RESULT STYLES
    resultContainer: {
        marginTop: SPACING.xl,
        marginBottom: SPACING.xl,
    },
    reportContainer: {
        gap: SPACING.lg,
    },
    reportHeaderCard: {
        marginBottom: SPACING.xs,
    },
    reportHeaderTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    reportTitle: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        flex: 1,
    },
    reportPeriodText: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textMuted,
    },
    savedDateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: RADIUS.sm,
        gap: 4,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    savedDateText: {
        fontSize: 10,
        color: COLORS.textSecondary,
        fontWeight: TYPOGRAPHY.weight.medium,
    },

    // SECTION CARDS (Income/Expenses)
    sectionCard: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        ...SHADOWS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardSectionTitle: {
        fontSize: 11,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.textMuted,
        marginBottom: SPACING.md,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: SPACING.md,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: TYPOGRAPHY.size.base,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.text,
    },
    summaryValuePositive: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text, // Cleaner look than green everywhere
    },
    summaryValueNegative: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: '#EF4444',
    },

    // EXPENSE ROWS
    expenseRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    expenseInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    categoryIcon: {
        width: 28,
        height: 28,
        borderRadius: RADIUS.full,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    expenseLabel: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.text,
    },
    expenseCategoryValue: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: '#EF4444',
    },
    emptyExpenses: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        gap: SPACING.sm,
        opacity: 0.7,
    },
    emptyExpensesText: {
        color: COLORS.textMuted,
        fontSize: TYPOGRAPHY.size.sm,
    },

    // BALANCE CARD
    balanceCard: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        padding: SPACING.lg,
        ...SHADOWS.card,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    balanceIconContainer: {
        width: 48,
        height: 48,
        borderRadius: RADIUS.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    balanceIconPositive: {
        backgroundColor: '#DCFCE7', // Light green
    },
    balanceIconNegative: {
        backgroundColor: '#FEE2E2', // Light red
    },
    balanceInfo: {
        flex: 1,
    },
    balanceLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
        fontWeight: TYPOGRAPHY.weight.bold,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    balanceValue: {
        fontSize: TYPOGRAPHY.size['2xl'],
        fontWeight: TYPOGRAPHY.weight.bold,
    },
    positiveText: {
        color: '#15803D', // darker green
    },
    negativeText: {
        color: '#B91C1C', // darker red
    },

    // ACTION BUTTONS (Create flow)
    actionButtons: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginTop: SPACING.sm,
    },
    saveButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.primary,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.lg,
        gap: SPACING.sm,
    },
    saveButtonText: {
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.weight.bold,
        fontSize: TYPOGRAPHY.size.sm,
    },
    exportButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.text,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.lg,
        gap: SPACING.sm,
    },
    exportButtonText: {
        color: '#FFF',
        fontWeight: TYPOGRAPHY.weight.bold,
        fontSize: TYPOGRAPHY.size.sm,
    },

    // SAVED LIST
    savedList: {
        gap: SPACING.md,
        paddingBottom: 100,
    },
    savedCard: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...SHADOWS.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    savedCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        flex: 1,
    },
    savedCardIcon: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
    },
    savedCardInfo: {
        flex: 1,
    },
    savedCardTitle: {
        fontSize: TYPOGRAPHY.size.base,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        marginBottom: 2,
    },
    savedCardDate: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.textMuted,
    },
    savedCardRight: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 4,
    },
    savedBalance: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: TYPOGRAPHY.weight.bold,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING['3xl'],
        opacity: 0.8,
    },
    emptyIconBg: {
        width: 64,
        height: 64,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
        ...SHADOWS.sm,
    },
    emptyStateText: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        marginBottom: 4,
    },
    emptyStateSubtext: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
    },

    // ACTION BAR (Bottom)
    actionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: SPACING.md,
        ...SHADOWS.sheet, // Using sheet shadow for upward shadow
    },
    actionItem: {
        alignItems: 'center',
        gap: 4,
    },
    actionIconBg: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionLabel: {
        fontSize: 10,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.textSecondary,
    },

    // MODAL
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '85%',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        padding: SPACING.xl,
        ...SHADOWS.md,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    modalTitle: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
    },
    modalSubtitle: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
        marginBottom: SPACING.lg,
    },
    modalInput: {
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.lg,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.lg,
    },
    modalButtonConfirm: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.lg,
        alignItems: 'center',
    },
    modalButtonTextConfirm: {
        color: '#FFF',
        fontWeight: TYPOGRAPHY.weight.bold,
        fontSize: TYPOGRAPHY.size.md,
    },
});
