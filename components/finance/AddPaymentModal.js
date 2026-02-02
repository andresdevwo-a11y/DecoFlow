import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../constants/Theme';

const AddPaymentModal = ({ visible, transaction, onClose, onConfirm }) => {
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calculate pending amount
    const pendingAmount = useMemo(() => {
        if (!transaction) return 0;
        const totalPrice = transaction.totalPrice || transaction.totalAmount || 0;
        const amountPaid = transaction.amountPaid || 0;
        return Math.max(0, totalPrice - amountPaid);
    }, [transaction]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleConfirm = async () => {
        const paymentAmount = parseFloat(amount) || 0;

        if (paymentAmount <= 0) {
            return;
        }

        if (paymentAmount > pendingAmount) {
            return;
        }

        setIsSubmitting(true);
        try {
            await onConfirm(transaction.id, paymentAmount);
            setAmount('');
            onClose();
        } catch (error) {
            console.error('Error adding payment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setAmount('');
        onClose();
    };

    const handlePayFull = () => {
        setAmount(pendingAmount.toString());
    };

    const amountValue = parseFloat(amount) || 0;
    const isValidAmount = amountValue > 0 && amountValue <= pendingAmount;

    if (!transaction) return null;

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Agregar Abono</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Feather name="x" size={24} color={COLORS.textMuted} />
                        </TouchableOpacity>
                    </View>

                    {/* Transaction Info */}
                    <View style={styles.infoSection}>
                        <Text style={styles.productName} numberOfLines={1}>
                            {transaction.productName}
                        </Text>
                        {transaction.customerName && (
                            <Text style={styles.customerName}>
                                Cliente: {transaction.customerName}
                            </Text>
                        )}
                    </View>

                    {/* Balance Info */}
                    <View style={styles.balanceSection}>
                        <View style={styles.balanceRow}>
                            <Text style={styles.balanceLabel}>Precio Total:</Text>
                            <Text style={styles.balanceValue}>
                                {formatCurrency(transaction.totalPrice || transaction.totalAmount)}
                            </Text>
                        </View>
                        <View style={styles.balanceRow}>
                            <Text style={styles.balanceLabel}>Pagado:</Text>
                            <Text style={[styles.balanceValue, { color: '#22C55E' }]}>
                                {formatCurrency(transaction.amountPaid || 0)}
                            </Text>
                        </View>
                        <View style={[styles.balanceRow, styles.pendingRow]}>
                            <Text style={styles.pendingLabel}>Saldo Pendiente:</Text>
                            <Text style={styles.pendingValue}>
                                {formatCurrency(pendingAmount)}
                            </Text>
                        </View>
                    </View>

                    {/* Amount Input */}
                    <View style={styles.inputSection}>
                        <View style={styles.inputRow}>
                            <Text style={styles.label}>Monto del Abono</Text>
                            <TouchableOpacity onPress={handlePayFull}>
                                <Text style={styles.payFullButton}>Pagar todo</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.currencyInput}>
                            <Text style={styles.currencySymbol}>$</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="0"
                                placeholderTextColor={COLORS.textMuted}
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                                autoFocus
                            />
                        </View>
                        {amountValue > pendingAmount && (
                            <Text style={styles.errorText}>
                                El abono no puede ser mayor al saldo pendiente
                            </Text>
                        )}
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleClose}
                        >
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.confirmButton,
                                (!isValidAmount || isSubmitting) && styles.confirmButtonDisabled
                            ]}
                            onPress={handleConfirm}
                            disabled={!isValidAmount || isSubmitting}
                        >
                            <Feather name="plus" size={18} color="#FFF" />
                            <Text style={styles.confirmButtonText}>
                                {isSubmitting ? 'Agregando...' : 'Agregar Abono'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default AddPaymentModal;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: SPACING.xl,
    },
    content: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        padding: SPACING.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    title: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
    },
    infoSection: {
        marginBottom: SPACING.md,
    },
    productName: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.text,
    },
    customerName: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    balanceSection: {
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    balanceLabel: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
    },
    balanceValue: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.text,
    },
    pendingRow: {
        marginTop: SPACING.sm,
        paddingTop: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        marginBottom: 0,
    },
    pendingLabel: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.text,
    },
    pendingValue: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: '#8B5CF6',
    },
    inputSection: {
        marginBottom: SPACING.lg,
    },
    inputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    label: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.textSecondary,
    },
    payFullButton: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: '#8B5CF6',
    },
    currencyInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.lg,
        paddingHorizontal: SPACING.md,
        borderWidth: 2,
        borderColor: '#8B5CF6',
    },
    currencySymbol: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: '#8B5CF6',
        marginRight: SPACING.sm,
    },
    textInput: {
        flex: 1,
        paddingVertical: SPACING.md,
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
    },
    errorText: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.error,
        marginTop: SPACING.xs,
    },
    actions: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    cancelButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.lg,
        paddingVertical: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cancelButtonText: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.textSecondary,
    },
    confirmButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#8B5CF6',
        borderRadius: RADIUS.lg,
        paddingVertical: SPACING.md,
        gap: SPACING.xs,
    },
    confirmButtonDisabled: {
        opacity: 0.5,
    },
    confirmButtonText: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: '#FFF',
    },
});
