import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SIZES, SHADOWS } from '../constants/Theme';
import { useFinance } from '../context/FinanceContext';
import TransactionCard from '../components/finance/TransactionCard';
import AddPaymentModal from '../components/finance/AddPaymentModal';

const AllTransactionsScreen = ({ initialTab = 'ingresos', onBack, onTransactionPress }) => {
    const insets = useSafeAreaInsets();
    const { transactions, expenses, updateInstallmentPayment } = useFinance();

    const [activeTab, setActiveTab] = useState(initialTab);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');

    // Payment Modal State
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    const handleAddPayment = useCallback((transaction) => {
        setSelectedTransaction(transaction);
        setPaymentModalVisible(true);
    }, []);

    const handleConfirmPayment = useCallback(async (transactionId, amount) => {
        await updateInstallmentPayment(transactionId, amount);
    }, [updateInstallmentPayment]);

    // Sync with prop if it changes (or on mount/remount)
    React.useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    // Reset filters when tab changes
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSearchQuery('');
        setFilterType('all');
    };

    // Prepare raw data
    const ingresosData = useMemo(() => {
        return transactions
            .filter(t => t.type === 'sale' || t.type === 'rental' || t.type === 'decoration')
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [transactions]);

    const egresosData = useMemo(() => {
        return expenses
            .map(e => ({
                ...e,
                type: 'expense',
                productName: e.description,
                totalAmount: e.amount
            }))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [expenses]);

    // Filter Logic
    const filteredData = useMemo(() => {
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
            if (filterType === 'installment') {
                data = data.filter(item => !!item.isInstallment);
            } else {
                data = data.filter(item => item.type === filterType);
            }
        }

        return data;
    }, [ingresosData, egresosData, activeTab, searchQuery, filterType]);

    // Filter options
    const filterOptions = [
        { id: 'all', label: 'Todos' },
        { id: 'installment', label: 'Por Abonos' },
        { id: 'sale', label: 'Ventas' },
        { id: 'rental', label: 'Alquileres' },
        { id: 'decoration', label: 'Decoraciones' },
    ];

    // Render Items
    const renderItem = useCallback(({ item }) => (
        <View style={{ marginBottom: SPACING.sm }}>
            <TransactionCard
                transaction={item}
                onPress={() => onTransactionPress && onTransactionPress(item)}
                onAddPayment={handleAddPayment}
            />
        </View>
    ), [onTransactionPress, handleAddPayment]);

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Feather name="search" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyStateText}>
                No se encontraron transacciones
            </Text>
            <Text style={styles.emptyStateSubtext}>
                Intenta con otros términos de búsqueda
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Custom Header with Back Button */}
            <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {activeTab === 'ingresos' ? 'Historial de Ingresos' : 'Historial de Egresos'}
                </Text>
                <View style={{ width: 24 }} />
                {/* Spacer to center title */}
            </View>

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
                    placeholder="Buscar..."
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
                <View style={{ height: 50 }}>
                    <FlatList
                        horizontal
                        data={filterOptions}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterContainer}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.filterChip,
                                    filterType === item.id && styles.filterChipActive
                                ]}
                                onPress={() => setFilterType(item.id)}
                            >
                                <Text
                                    style={[
                                        styles.filterLabel,
                                        filterType === item.id && styles.filterLabelActive
                                    ]}
                                >
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            {/* Transaction List */}
            <FlatList
                data={filteredData}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                style={{ flex: 1 }}
                contentContainerStyle={[
                    styles.listContent,
                    { paddingBottom: insets.bottom + SPACING.xl }
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyState}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
            />

            {/* Add Payment Modal for Installments */}
            <AddPaymentModal
                visible={paymentModalVisible}
                transaction={selectedTransaction}
                onClose={() => setPaymentModalVisible(false)}
                onConfirm={handleConfirmPayment}
            />

            {/* Bottom Safe Area Background */}
            <View style={[styles.bottomSafetyBar, { height: insets.bottom }]} />
        </View>
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
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.md,
        backgroundColor: COLORS.background,
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
    },
    backButton: {
        padding: 4,
    },
    // Tabs
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    tab: {
        flex: 1,
        paddingVertical: SPACING.md,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: COLORS.primary,
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
    // Search
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
    // Filters
    filterContainer: {
        paddingHorizontal: SPACING.md,
        paddingVertical: 8,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: 8,
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
    // List
    listContent: {
        padding: SPACING.md,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.xxl * 2,
    },
    emptyStateText: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.textSecondary,
        marginTop: SPACING.md,
    },
    emptyStateSubtext: {
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.textMuted,
        marginTop: SPACING.xs,
    },
    // New Style for Bottom Safe Area
    bottomSafetyBar: {
        width: '100%',
        backgroundColor: COLORS.surface, // Or 'white' for pure white
    },
});

export default AllTransactionsScreen;
