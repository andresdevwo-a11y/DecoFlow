import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Keyboard
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, SIZES } from '../../../constants/Theme';
import { EXPENSE_CATEGORIES } from '../../../context/FinanceContext';
import { useAlert } from '../../../context/AlertContext';
import { getLocalDateString } from '../../../utils/dateHelpers';
import CustomDatePicker from '../CustomDatePicker';

const ExpenseForm = ({ initialValues, onSubmit, onCancel, submitLabel = 'Guardar Gasto', isSubmitting = false }) => {
    const insets = useSafeAreaInsets();
    const { showAlert } = useAlert();
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [category, setCategory] = useState('other');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(getLocalDateString());
    const [notes, setNotes] = useState('');

    // Load initial values if provided (Edit Mode)
    useEffect(() => {
        if (initialValues) {
            setCategory(initialValues.category || 'other');
            setDescription(initialValues.description || '');
            setAmount(initialValues.amount?.toString() || '');
            setDate(initialValues.date || getLocalDateString());
            setNotes(initialValues.notes || '');
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

    // Auto-fill description when category changes
    useEffect(() => {
        // Only update if we are not in editing mode (initialValues.id check could be useful, but logic says "Si el usuario decide escribir... debe guardarse").
        // Requirement: "Cuando el usuario seleccione una categoría... el nombre... debe colocarse automáticamente".
        // This implies an explicit action of selecting. 
        // We can just rely on this effect running when 'category' changes.
        // But we must be careful not to overwrite if it's the initial load of an existing expense?
        // If initialValues exist, category is set in the other useEffect.
        // We should probably check if the current description was auto-filled or empty.
        // Simplest interpretation: selection overrides description.
        // But we want to avoid overwriting on initial load if we are editing.

        if (initialValues && initialValues.category === category && initialValues.description === description) {
            // It's the initial load, don't change
            return;
        }

        if (EXPENSE_CATEGORIES[category]) {
            setDescription(EXPENSE_CATEGORIES[category].label);
        }
    }, [category]);

    const formatCurrency = (value) => {
        const numValue = parseFloat(value) || 0;
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(numValue);
    };

    const handleSubmit = () => {
        if (!description.trim()) {
            showAlert("error", "Error", "Por favor ingresa una descripción del gasto");
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            showAlert("error", "Error", "Por favor ingresa un monto válido");
            return;
        }

        onSubmit({
            category: category,
            description: description.trim(),
            amount: parseFloat(amount),
            date: date,
            notes: notes.trim() || null
        });
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
                    {/* SECCIÓN 1: DETALLE DEL GASTO */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>1. Detalle del Gasto</Text>

                        <View style={{ marginBottom: SPACING.md }}>
                            <Text style={styles.label}>Categoría</Text>
                            <View style={styles.categoryGrid}>
                                {Object.entries(EXPENSE_CATEGORIES).map(([key, { label, icon }]) => (
                                    <TouchableOpacity
                                        key={key}
                                        style={[
                                            styles.categoryOption,
                                            category === key && styles.categoryOptionSelected
                                        ]}
                                        onPress={() => setCategory(key)}
                                    >
                                        <Feather
                                            name={icon}
                                            size={20}
                                            color={category === key ? COLORS.primary : COLORS.textMuted}
                                        />
                                        <Text style={[
                                            styles.categoryLabel,
                                            category === key && styles.categoryLabelSelected
                                        ]}>
                                            {label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <Text style={styles.label}>Descripción *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: Combustible, Papelería..."
                            placeholderTextColor={COLORS.textMuted}
                            value={description}
                            onChangeText={setDescription}
                        />
                    </View>

                    {/* SECCIÓN 2: DATOS FINANCIEROS */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>2. Datos Financieros</Text>

                        <View style={styles.section}>
                            <Text style={styles.label}>Monto *</Text>
                            <View style={styles.currencyInput}>
                                <Text style={styles.currencySymbol}>$</Text>
                                <TextInput
                                    style={styles.currencyTextInput}
                                    placeholder="0"
                                    placeholderTextColor={COLORS.textMuted}
                                    value={amount}
                                    onChangeText={setAmount}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <CustomDatePicker
                            label="Fecha del Gasto"
                            date={date}
                            onDateChange={(newDate) => setDate(newDate.toISOString().split('T')[0])}
                        />
                    </View>

                    {/* SECCIÓN 3: CIERRE */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>3. Cierre</Text>

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

                        {/* Amount Display */}
                        {amount && parseFloat(amount) > 0 && (
                            <View style={[styles.amountDisplay, { marginBottom: 0 }]}>
                                <Text style={styles.amountDisplayLabel}>Total del Gasto</Text>
                                <Text style={styles.amountDisplayValue}>-{formatCurrency(amount)}</Text>
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
        </View>
    );
};

export default ExpenseForm;

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
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    categoryOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: SPACING.xs,
    },
    categoryOptionSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '15',
    },
    categoryLabel: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
    },
    categoryLabelSelected: {
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.weight.medium,
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
    amountDisplay: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#EF444420',
        borderRadius: 12,
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
        borderWidth: 2,
        borderColor: '#EF4444',
    },
    amountDisplayLabel: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
    },
    amountDisplayValue: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: '#EF4444',
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
        backgroundColor: '#EF4444',
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
});
