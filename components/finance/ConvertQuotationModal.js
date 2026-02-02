import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    Switch,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../constants/Theme';

const ConvertQuotationModal = ({ visible, quotation, onClose, onConfirm }) => {
    const [isInstallment, setIsInstallment] = useState(false);
    const [installmentAmount, setInstallmentAmount] = useState('');
    const [error, setError] = useState('');

    // Reset state when modal opens
    useEffect(() => {
        if (visible) {
            setIsInstallment(false);
            setInstallmentAmount('');
            setError('');
        }
    }, [visible]);

    const totalAmount = quotation?.totalAmount || 0;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleConfirm = () => {
        if (isInstallment) {
            const amountNum = parseFloat(installmentAmount);
            if (!amountNum || isNaN(amountNum) || amountNum <= 0) {
                setError('Ingresa un monto válido');
                return;
            }
            if (amountNum > totalAmount) {
                setError('El abono no puede ser mayor al total');
                return;
            }
            
            onConfirm({
                isInstallment: true,
                amountPaid: amountNum
            });
        } else {
            // Full payment
            onConfirm({
                isInstallment: false,
                amountPaid: totalAmount
            });
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.overlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.keyboardAvoidingView}
                    >
                        <View style={styles.modalContainer}>
                            {/* Header */}
                            <View style={styles.header}>
                                <View style={styles.iconContainer}>
                                    <Feather name="check-circle" size={24} color={COLORS.primary} />
                                </View>
                                <Text style={styles.title}>Convertir a Transacción</Text>
                                <Text style={styles.subtitle}>
                                    La cotización se guardará como una transacción real.
                                </Text>
                            </View>

                            {/* Content */}
                            <View style={styles.content}>
                                
                                {/* Total Amount Display */}
                                <View style={styles.totalRow}>
                                    <Text style={styles.label}>Valor Total:</Text>
                                    <Text style={styles.totalAmount}>{formatCurrency(totalAmount)}</Text>
                                </View>

                                {/* Installment Toggle */}
                                <View style={styles.optionRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.optionTitle}>Pago por Abonos</Text>
                                        <Text style={styles.optionDescription}>
                                            Activa si el cliente pagará en cuotas
                                        </Text>
                                    </View>
                                    <Switch
                                        value={isInstallment}
                                        onValueChange={setIsInstallment}
                                        trackColor={{ false: COLORS.border, true: COLORS.primary + '50' }}
                                        thumbColor={isInstallment ? COLORS.primary : COLORS.textMuted}
                                    />
                                </View>

                                {/* Installment Input */}
                                {isInstallment && (
                                    <View style={styles.installmentInputContainer}>
                                        <Text style={styles.inputLabel}>Monto Abonado (Ingreso a Caja)</Text>
                                        <View style={[styles.inputWrapper, error && styles.inputError]}>
                                            <Text style={styles.currencySymbol}>$</Text>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="0"
                                                placeholderTextColor={COLORS.textMuted}
                                                keyboardType="numeric"
                                                value={installmentAmount}
                                                onChangeText={(text) => {
                                                    setInstallmentAmount(text);
                                                    setError('');
                                                }}
                                            />
                                        </View>
                                        {error ? (
                                            <Text style={styles.errorText}>{error}</Text>
                                        ) : (
                                            <Text style={styles.balanceText}>
                                                Saldo pendiente: {formatCurrency(Math.max(0, totalAmount - (parseFloat(installmentAmount) || 0)))}
                                            </Text>
                                        )}
                                    </View>
                                )}
                            </View>

                            {/* Actions */}
                            <View style={styles.actions}>
                                <TouchableOpacity 
                                    style={styles.cancelButton} 
                                    onPress={onClose}
                                >
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.confirmButton} 
                                    onPress={handleConfirm}
                                >
                                    <Text style={styles.confirmButtonText}>Convertir</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg
    },
    keyboardAvoidingView: {
        width: '100%',
        alignItems: 'center'
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        ...SHADOWS.medium
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING.lg
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md
    },
    title: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        marginBottom: SPACING.xs
    },
    subtitle: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
        textAlign: 'center'
    },
    content: {
        marginBottom: SPACING.xl
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border
    },
    label: {
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.text
    },
    totalAmount: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.primary
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md
    },
    optionTitle: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.text
    },
    optionDescription: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.textMuted
    },
    installmentInputContainer: {
        marginTop: SPACING.sm,
        backgroundColor: COLORS.background,
        padding: SPACING.md,
        borderRadius: RADIUS.md
    },
    inputLabel: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.sm,
        paddingHorizontal: SPACING.md
    },
    inputError: {
        borderColor: COLORS.error
    },
    currencySymbol: {
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.textMuted,
        marginRight: SPACING.xs
    },
    input: {
        flex: 1,
        paddingVertical: SPACING.sm,
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.text
    },
    errorText: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.error,
        marginTop: SPACING.xs
    },
    balanceText: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.primary,
        marginTop: SPACING.xs,
        fontWeight: '500'
    },
    actions: {
        flexDirection: 'row',
        gap: SPACING.md
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.md
    },
    cancelButtonText: {
        color: COLORS.textSecondary,
        fontWeight: TYPOGRAPHY.weight.medium,
        fontSize: TYPOGRAPHY.size.md
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.md
    },
    confirmButtonText: {
        color: '#FFF',
        fontWeight: TYPOGRAPHY.weight.bold,
        fontSize: TYPOGRAPHY.size.md
    }
});

export default ConvertQuotationModal;
