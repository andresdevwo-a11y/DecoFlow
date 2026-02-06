import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/Theme';
import { useFinance } from '../context/FinanceContext';
import { useAlert } from '../context/AlertContext';

// Forms
import QuotationSaleForm from '../components/finance/forms/QuotationSaleForm';
import QuotationRentalForm from '../components/finance/forms/QuotationRentalForm';
import QuotationDecorationForm from '../components/finance/forms/QuotationDecorationForm';

const CreateQuotationScreen = ({ onBack }) => {
    const insets = useSafeAreaInsets();
    const { addQuotation } = useFinance();
    const { showAlert } = useAlert();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [transactionType, setTransactionType] = useState('sale'); // sale, rental, decoration

    const handleSubmit = async (formData) => {
        setIsSubmitting(true);
        try {
            await addQuotation({
                ...formData,
                type: transactionType
            });
            // Show toast and navigate immediately (Fire and forget)
            showAlert("success", "Éxito", "Cotización registrada correctamente");
            onBack();
        } catch (error) {
            console.error("Error saving quotation:", error);
            showAlert("error", "Error", "No se pudo registrar la cotización. Inténtalo de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'sale': return 'Venta';
            case 'rental': return 'Alquiler';
            case 'decoration': return 'Decoración';
            default: return 'Venta';
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Nueva Cotización</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Type Selector */}
            <View style={styles.typeSelectorContainer}>
                <Text style={styles.typeSelectorLabel}>Tipo de Transacción:</Text>
                <View style={styles.typeSelector}>
                    <TouchableOpacity
                        style={[
                            styles.typeOption,
                            transactionType === 'sale' && styles.typeOptionActive
                        ]}
                        onPress={() => setTransactionType('sale')}
                    >
                        <Feather
                            name="shopping-cart"
                            size={18}
                            color={transactionType === 'sale' ? '#FFF' : COLORS.textMuted}
                        />
                        <Text style={[
                            styles.typeOptionText,
                            transactionType === 'sale' && styles.typeOptionTextActive
                        ]}>Venta</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.typeOption,
                            transactionType === 'rental' && styles.typeOptionActive
                        ]}
                        onPress={() => setTransactionType('rental')}
                    >
                        <Feather
                            name="package"
                            size={18}
                            color={transactionType === 'rental' ? '#FFF' : COLORS.textMuted}
                        />
                        <Text style={[
                            styles.typeOptionText,
                            transactionType === 'rental' && styles.typeOptionTextActive
                        ]}>Alquiler</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.typeOption,
                            transactionType === 'decoration' && styles.typeOptionActive
                        ]}
                        onPress={() => setTransactionType('decoration')}
                    >
                        <Feather
                            name="gift"
                            size={18}
                            color={transactionType === 'decoration' ? '#FFF' : COLORS.textMuted}
                        />
                        <Text style={[
                            styles.typeOptionText,
                            transactionType === 'decoration' && styles.typeOptionTextActive
                        ]}>Decoración</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Form Container */}
            <View style={styles.formContainer}>
                {transactionType === 'sale' && (
                    <QuotationSaleForm
                        onSubmit={handleSubmit}
                        submitLabel="Guardar Cotización"
                        isSubmitting={isSubmitting}
                        onCancel={onBack}
                    />
                )}
                {transactionType === 'rental' && (
                    <QuotationRentalForm
                        onSubmit={handleSubmit}
                        submitLabel="Guardar Cotización"
                        isSubmitting={isSubmitting}
                        onCancel={onBack}
                    />
                )}
                {transactionType === 'decoration' && (
                    <QuotationDecorationForm
                        onSubmit={handleSubmit}
                        submitLabel="Guardar Cotización"
                        isSubmitting={isSubmitting}
                        onCancel={onBack}
                    />
                )}
            </View>
        </View>
    );
};

export default CreateQuotationScreen;

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
        zIndex: 10
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
    typeSelectorContainer: {
        padding: SPACING.md,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    typeSelectorLabel: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textMuted,
        marginBottom: SPACING.sm,
        fontWeight: TYPOGRAPHY.weight.medium,
    },
    typeSelector: {
        flexDirection: 'row',
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    typeOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6
    },
    typeOptionActive: {
        backgroundColor: COLORS.primary,
    },
    typeOptionText: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.textMuted,
    },
    typeOptionTextActive: {
        color: '#FFFFFF',
        fontWeight: TYPOGRAPHY.weight.semibold,
    },
    formContainer: {
        flex: 1,
    }
});
