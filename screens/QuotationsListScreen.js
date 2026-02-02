import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/Theme';
import { useFinance } from '../context/FinanceContext';
import QuotationCard from '../components/finance/QuotationCard';

const QuotationsListScreen = ({ onBack, onQuotationPress }) => {
    const insets = useSafeAreaInsets();
    const { quotations, quotationsLoading, refresh } = useFinance();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, sale, rental, decoration

    const filteredQuotations = useMemo(() => {
        let result = quotations || [];

        // 1. Filter by Type
        if (filterType !== 'all') {
            result = result.filter(q => q.type === filterType);
        }

        // 2. Filter by Search Query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(q =>
                (q.productName && q.productName.toLowerCase().includes(query)) ||
                (q.customerName && q.customerName.toLowerCase().includes(query)) ||
                (q.quotationNumber && q.quotationNumber.toLowerCase().includes(query))
            );
        }

        return result;
    }, [quotations, filterType, searchQuery]);

    const filterOptions = [
        { id: 'all', label: 'Todas' },
        { id: 'sale', label: 'Ventas' },
        { id: 'rental', label: 'Alquileres' },
        { id: 'decoration', label: 'Decoraciones' },
    ];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cotizaciones</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Feather name="search" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por cliente, producto o número..."
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

            {/* Filter Chips */}
            <View style={styles.filtersWrapper}>
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
                            <Text style={[
                                styles.filterLabel,
                                filterType === option.id && styles.filterLabelActive
                            ]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {quotationsLoading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Cargando cotizaciones...</Text>
                    </View>
                ) : filteredQuotations.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Feather name="file-text" size={48} color={COLORS.textMuted} />
                        <Text style={styles.emptyStateText}>
                            {searchQuery || filterType !== 'all'
                                ? 'No se encontraron cotizaciones con estos filtros'
                                : 'No hay cotizaciones registradas'}
                        </Text>
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        {filteredQuotations.map((quotation) => (
                            <QuotationCard
                                key={quotation.id}
                                quotation={quotation}
                                onPress={onQuotationPress}
                            />
                        ))}
                    </ScrollView>
                )}
            </View>
        </View>
    );
};

export default QuotationsListScreen;

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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        marginHorizontal: SPACING.md,
        marginTop: SPACING.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: 12,
        borderRadius: 12,
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
    filtersWrapper: {
        paddingVertical: SPACING.sm,
    },
    filterContainer: {
        paddingHorizontal: SPACING.md,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
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
    content: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: SPACING.md,
        color: COLORS.textMuted,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
    },
    emptyStateText: {
        marginTop: SPACING.md,
        textAlign: 'center',
        color: COLORS.textMuted,
        fontSize: TYPOGRAPHY.size.md,
    },
    listContainer: {
        padding: SPACING.md,
        paddingBottom: 40,
    }
});
