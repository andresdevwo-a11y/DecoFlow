import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TextInput, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SIZES, SHADOWS } from '../constants/Theme';
import { useFinance } from '../context/FinanceContext';
import Header from '../components/Header';
import BalanceCard from '../components/finance/BalanceCard';
import TransactionCard from '../components/finance/TransactionCard';
import AddPaymentModal from '../components/finance/AddPaymentModal';
import FinanceActionsModal from '../components/finance/FinanceActionsModal';
import { useAlert } from '../context/AlertContext';

// New Components
import FinanceFAB from '../components/finance/FinanceFAB';
import QuickNavigationGrid from '../components/finance/QuickNavigationGrid';

const FinancesScreen = ({
    onCreateSale,
    onCreateRental,
    onCreateDecoration,
    onCreateExpense,
    onCreateQuotation,
    onViewReports,
    onViewQuotations,
    onViewAllTransactions,
    onTransactionPress
}) => {
    const insets = useSafeAreaInsets();
    const {
        summary,
        transactions, // Changed from recentTransactions
        expenses,
        isLoading,
        refresh,
        updateInstallmentPayment,
        resetBalance,
        deleteDataByType
    } = useFinance();
    const { showAlert } = useAlert();

    const [refreshing, setRefreshing] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState('ingresos');
    const [searchQuery, setSearchQuery] = React.useState('');
    const [filterType, setFilterType] = React.useState('all');

    // Payment Modal State
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    // Actions Modal State
    const [actionsModalVisible, setActionsModalVisible] = useState(false);

    const handleAddPayment = useCallback((transaction) => {
        setSelectedTransaction(transaction);
        setPaymentModalVisible(true);
    }, []);

    const handleConfirmPayment = useCallback(async (transactionId, amount) => {
        await updateInstallmentPayment(transactionId, amount);
    }, [updateInstallmentPayment]);

    const handleResetBalance = async () => {
        try {
            await resetBalance();
            showAlert('success', 'Balance Limpiado', 'El balance visible se ha restablecido a cero.');
        } catch (error) {
            console.error(error);
            showAlert('error', 'Error', 'No se pudo limpiar el balance.');
        }
    };

    const handleDeleteData = async (type) => {
        try {
            await deleteDataByType(type);
            showAlert('success', 'Datos Eliminados', 'La información seleccionada ha sido eliminada correctamente.');
        } catch (error) {
            console.error(error);
            showAlert('error', 'Error', 'No se pudieron eliminar los datos.');
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSearchQuery('');
        setFilterType('all');
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    }, [refresh]);

    // Filter transactions for Ingresos (Sales + Rentals + Decorations)
    const ingresosData = React.useMemo(() => {
        return transactions // Changed from recentTransactions
            .filter(t => t.type === 'sale' || t.type === 'rental' || t.type === 'decoration')
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [transactions]);

    // Filter expenses for Egresos
    const egresosData = React.useMemo(() => {
        return expenses
            .map(e => ({
                ...e,
                type: 'expense',
                productName: e.description,
                totalAmount: e.amount
            }))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [expenses]);

    // Unified filtering logic
    const filteredData = React.useMemo(() => {
        let data = activeTab === 'ingresos' ? ingresosData : egresosData;

        // 1. Text Search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            data = data.filter(item => {
                const productMatch = item.productName && item.productName.toLowerCase().includes(query);
                const customerMatch = item.customerName && item.customerName.toLowerCase().includes(query);
                return productMatch || customerMatch;
            });
        }

        // 2. Type Filter (only for Ingresos)
        if (activeTab === 'ingresos' && filterType !== 'all') {
            data = data.filter(item => item.type === filterType);
        }

        return data;
    }, [ingresosData, egresosData, activeTab, searchQuery, filterType]);

    // Limit to 5 transactions for Dashboard view (or 10 if searching)
    const displayedData = React.useMemo(() => {
        if (searchQuery.trim()) {
            return filteredData.slice(0, 10);
        }
        return filteredData.slice(0, 5);
    }, [filteredData, searchQuery]);

    // Filter chips configuration
    const filterOptions = [
        { id: 'all', label: 'Todos' },
        { id: 'sale', label: 'Ventas' },
        { id: 'rental', label: 'Alquileres' },
        { id: 'decoration', label: 'Decoraciones' },
    ];

    return (
        <View style={styles.container}>
            <Header title="Finanzas" />

            <View style={{ flex: 1 }}>
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={[
                        styles.content,
                        { paddingTop: SPACING.md }
                    ]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[COLORS.primary]}
                            tintColor={COLORS.primary}
                        />
                    }
                >

                    {/* Balance Card */}
                    <BalanceCard summary={summary} />

                    {/* New Compact Navigation Grid */}
                    <QuickNavigationGrid
                        onViewReports={onViewReports}
                        onViewQuotations={onViewQuotations}
                        onViewDataManagement={() => setActionsModalVisible(true)}
                    />

                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'ingresos' && styles.tabActive]}
                            onPress={() => handleTabChange('ingresos')}
                        >
                            <Text style={[styles.tabText, activeTab === 'ingresos' && styles.tabTextActive]}>
                                Ingresos
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'egresos' && styles.tabActive]}
                            onPress={() => handleTabChange('egresos')}
                        >
                            <Text style={[styles.tabText, activeTab === 'egresos' && styles.tabTextActive]}>
                                Egresos
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <Feather name="search" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar por nombre o cliente..."
                            placeholderTextColor={COLORS.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Feather name="x" size={18} color={COLORS.textMuted} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Filter Chips (Only for Ingresos) */}
                    {activeTab === 'ingresos' && (
                        <View style={styles.filterWrapper}>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.filterContainer}
                            >
                                {filterOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option.id}
                                        style={[
                                            styles.filterChip,
                                            filterType === option.id && styles.filterChipActive
                                        ]}
                                        onPress={() => setFilterType(option.id)}
                                    >
                                        <Text
                                            style={[
                                                styles.filterLabel,
                                                filterType === option.id && styles.filterLabelActive
                                            ]}
                                        >
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Tab Content */}
                    <View style={styles.tabContent}>
                        {filteredData.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Feather name="inbox" size={48} color={COLORS.textMuted} />
                                <Text style={styles.emptyStateText}>
                                    No hay {activeTab === 'ingresos' ? 'ingresos' : 'egresos'} registrados
                                </Text>
                                <Text style={styles.emptyStateSubtext}>
                                    {activeTab === 'ingresos'
                                        ? 'Usa el botón + para registrar operaciones'
                                        : 'Registra tus gastos operativos'}
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.transactionsList}>
                                {displayedData.map((item) => (
                                    <TransactionCard
                                        key={item.id}
                                        transaction={item}
                                        onPress={() => onTransactionPress && onTransactionPress(item)}
                                        onAddPayment={handleAddPayment}
                                    />
                                ))}

                                {/* View All Button */}
                                {(filteredData.length > displayedData.length || (!searchQuery.trim() && filteredData.length >= 5)) && (
                                    <TouchableOpacity
                                        style={styles.viewAllButton}
                                        onPress={() => onViewAllTransactions && onViewAllTransactions(activeTab, searchQuery)}
                                    >
                                        <Text style={styles.viewAllText}>
                                            {searchQuery.trim()
                                                ? `Ver los ${filteredData.length - displayedData.length} resultados restantes`
                                                : 'Ver todas las transacciones'
                                            }
                                        </Text>
                                        <Feather name="arrow-right" size={16} color={COLORS.primary} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Bottom Spacing for FAB and Scroll */}
                    <View style={{ height: SIZES.navBarHeight + insets.bottom + 80 }} />
                </ScrollView>

                {/* New Expandable FAB */}
                <FinanceFAB
                    onCreateSale={onCreateSale}
                    onCreateRental={onCreateRental}
                    onCreateDecoration={onCreateDecoration}
                    onCreateExpense={onCreateExpense}
                    onCreateQuotation={onCreateQuotation}
                />
            </View>

            {/* Add Payment Modal for Installments */}
            <AddPaymentModal
                visible={paymentModalVisible}
                transaction={selectedTransaction}
                onClose={() => setPaymentModalVisible(false)}
                onConfirm={handleConfirmPayment}
            />

            {/* Actions Modal */}
            <FinanceActionsModal
                visible={actionsModalVisible}
                onClose={() => setActionsModalVisible(false)}
                onResetBalance={handleResetBalance}
                onDeleteData={handleDeleteData}
                balance={summary.balance}
            />
        </View>
    );
};

export default FinancesScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        paddingBottom: SPACING.xl,
    },
    // Tab Styles
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: SPACING.md,
        marginTop: SPACING.xl,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border || '#E5E7EB',
    },
    tab: {
        flex: 1,
        paddingVertical: SPACING.md,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: COLORS.primary || '#000',
        marginBottom: -1.5,
    },
    tabText: {
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.textMuted,
        fontWeight: TYPOGRAPHY.weight.medium,
    },
    tabTextActive: {
        color: COLORS.text,
        fontWeight: TYPOGRAPHY.weight.bold,
    },
    tabContent: {
        paddingTop: SPACING.md,
        paddingHorizontal: SPACING.md,
        minHeight: 200,
    },
    transactionsList: {
        gap: SPACING.sm,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.xxl,
        marginTop: SPACING.sm,
    },
    emptyStateText: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.textSecondary,
        marginTop: SPACING.md,
    },
    emptyStateSubtext: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textMuted,
        marginTop: SPACING.xs,
        textAlign: 'center',
    },
    // Search Styles
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        marginHorizontal: SPACING.md,
        marginTop: SPACING.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: 12,
        borderRadius: 12,
        ...SHADOWS.small,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchIcon: {
        marginRight: SPACING.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.text,
        padding: 0,
    },
    // Filter Styles
    filterWrapper: {
        marginTop: 12,
        height: 44, // Fixed height to prevent layout jumps
    },
    filterContainer: {
        paddingHorizontal: SPACING.md,
        paddingBottom: 4, // Visual adjust
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'center',
    },
    filterChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterLabel: {
        fontSize: 13,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.text,
    },
    filterLabelActive: {
        color: '#FFFFFF',
        fontWeight: TYPOGRAPHY.weight.semibold,
    },
    // View All Button
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        marginTop: SPACING.xs,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.primary + '30',
        borderStyle: 'dashed',
    },
    viewAllText: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.primary,
        marginRight: SPACING.xs,
    },
});
