import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    TouchableWithoutFeedback,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    Switch,
    LayoutAnimation,
    UIManager
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, SIZES } from '../constants/Theme';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export default function QuickActionModal({
    visible,
    onClose,
    onConfirm,
    transactionType, // 'sale' | 'rental'
    product
}) {
    const [quantity, setQuantity] = useState('1');
    const [price, setPrice] = useState('');
    const [total, setTotal] = useState(0);

    // Installment state
    const [isInstallment, setIsInstallment] = useState(false);
    const [installmentAmount, setInstallmentAmount] = useState('0');

    // Initialize/Reset state when modal opens
    useEffect(() => {
        if (visible && product) {
            setQuantity('1');
            const initialPrice = transactionType === 'sale'
                ? (product.price ? product.price.toString() : '0')
                : (product.rentalPrice || product.rentPrice ? (product.rentalPrice || product.rentPrice).toString() : '0');

            setPrice(initialPrice);

            // Reset installment state
            setIsInstallment(false);
            setInstallmentAmount('0');
        }
    }, [visible, product, transactionType]);

    // Calculate total whenever quantity or price changes
    useEffect(() => {
        const qty = parseFloat(quantity) || 0;
        const unitPrice = parseFloat(price) || 0;
        setTotal(qty * unitPrice);
    }, [quantity, price]);

    const toggleInstallment = (value) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsInstallment(value);
    };

    const handleConfirm = () => {
        const qty = parseFloat(quantity);
        const unitPrice = parseFloat(price);

        if (!qty || qty <= 0) {
            // Simple validation could be enhanced
            return;
        }

        // Installment validation
        const instAmount = parseFloat(installmentAmount) || 0;
        if (isInstallment && instAmount > total) {
            alert("El abono no puede ser mayor al total.");
            return;
        }

        onConfirm({
            quantity: qty,
            price: unitPrice,
            total,
            isInstallment,
            installmentAmount: instAmount
        });
        onClose();
    };

    if (!visible) return null;

    const isSale = transactionType === 'sale';
    const title = isSale ? "Registrar Venta" : "Registrar Alquiler";
    const iconName = isSale ? "shopping-cart" : "package";
    const iconColor = isSale ? COLORS.primary : '#4A90E2';
    const confirmButtonColor = isSale ? COLORS.primary : '#4A90E2';

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={styles.overlay}>
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <View style={styles.modalContainer}>

                                {/* Header */}
                                <View style={styles.header}>
                                    <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
                                        <Feather name={iconName} size={24} color={iconColor} />
                                    </View>
                                    <View style={styles.headerTextContainer}>
                                        <Text style={styles.title}>{title}</Text>
                                        <Text style={styles.productName} numberOfLines={1}>{product?.name}</Text>
                                    </View>
                                </View>

                                {/* Inputs */}
                                <View style={styles.inputRow}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Cantidad</Text>
                                        <View style={styles.inputWrapper}>
                                            <TextInput
                                                style={styles.input}
                                                value={quantity}
                                                onChangeText={setQuantity}
                                                keyboardType="numeric"
                                                selectTextOnFocus
                                            />
                                        </View>
                                    </View>

                                    <View style={[styles.inputGroup, { flex: 1.5 }]}>
                                        <Text style={styles.label}>Precio Unitario</Text>
                                        <View style={styles.inputWrapper}>
                                            <Text style={styles.currencyPrefix}>$</Text>
                                            <TextInput
                                                style={[styles.input, { paddingLeft: 24 }]}
                                                value={price}
                                                onChangeText={setPrice}
                                                keyboardType="numeric"
                                                selectTextOnFocus
                                            />
                                        </View>
                                    </View>
                                </View>

                                {/* Installment Toggle & Input */}
                                <View style={[styles.installmentContainer, isInstallment && styles.installmentContainerActive]}>
                                    <View style={styles.installmentToggleRow}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Feather name="credit-card" size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
                                            <Text style={styles.installmentLabel}>Pago por Abonos</Text>
                                        </View>
                                        <Switch
                                            value={isInstallment}
                                            onValueChange={toggleInstallment}
                                            trackColor={{ false: COLORS.border, true: iconColor + '50' }}
                                            thumbColor={isInstallment ? iconColor : COLORS.textMuted}
                                            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                                        />
                                    </View>

                                    {isInstallment && (
                                        <View style={styles.installmentContent}>
                                            <View style={styles.installmentInputWrapper}>
                                                <Text style={[styles.label, { marginBottom: 4 }]}>Monto Abonado</Text>
                                                <View style={styles.inputWrapper}>
                                                    <Text style={[styles.currencyPrefix, { fontSize: 16, top: 12 }]}>$</Text>
                                                    <TextInput
                                                        style={[styles.input, styles.abonoInput]}
                                                        value={installmentAmount}
                                                        onChangeText={setInstallmentAmount}
                                                        keyboardType="numeric"
                                                        selectTextOnFocus
                                                        placeholder="0"
                                                    />
                                                </View>
                                            </View>

                                            <View style={styles.pendingContainer}>
                                                <Text style={styles.pendingLabel}>Pendiente por cobrar</Text>
                                                <Text style={styles.pendingValue}>
                                                    ${(Math.max(0, total - (parseFloat(installmentAmount) || 0))).toLocaleString()}
                                                </Text>
                                            </View>
                                        </View>
                                    )}
                                </View>

                                {/* Total Calculation */}
                                <View style={styles.divider} />
                                <View style={styles.totalContainer}>
                                    <Text style={styles.totalLabel}>Total a registrar</Text>
                                    <Text style={[styles.totalValue, { color: iconColor }]}>
                                        ${total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                    </Text>
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
                                        style={[styles.confirmButton, { backgroundColor: confirmButtonColor }]}
                                        onPress={handleConfirm}
                                    >
                                        <Text style={styles.confirmButtonText}>Confirmar</Text>
                                    </TouchableOpacity>
                                </View>

                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: COLORS.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.md,
    },
    modalContainer: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        padding: SPACING.xl,
        width: '100%',
        maxWidth: 360,
        ...SHADOWS.modal,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: SPACING.md,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: RADIUS.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    headerTextContainer: {
        flex: 1,
    },
    title: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
    },
    productName: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    inputRow: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginBottom: SPACING.md,
    },
    inputGroup: {
        flex: 1,
    },
    label: {
        fontSize: TYPOGRAPHY.size.xs,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputWrapper: {
        position: 'relative',
        justifyContent: 'center',
    },
    input: {
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 12,
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.text,
        textAlign: 'center',
    },
    currencyPrefix: {
        position: 'absolute',
        left: SPACING.md,
        zIndex: 1,
        color: COLORS.textSecondary,
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.semibold,
    },

    // Installment Section refined
    installmentContainer: {
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden', // for animation
    },
    installmentContainerActive: {
        backgroundColor: COLORS.surface,
        borderColor: COLORS.primary + '30', // subtle tint
    },
    installmentToggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    installmentLabel: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.text,
    },
    installmentContent: {
        marginTop: SPACING.md,
        paddingTop: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    installmentInputWrapper: {
        flex: 1.2,
    },
    abonoInput: {
        backgroundColor: COLORS.surface,
        fontSize: TYPOGRAPHY.size.lg,
        paddingVertical: 10,
    },
    pendingContainer: {
        flex: 1,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    pendingLabel: {
        fontSize: 10,
        color: COLORS.textSecondary,
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    pendingValue: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.error,
    },

    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginBottom: SPACING.md,
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xl,
        paddingHorizontal: SPACING.xs,
    },
    totalLabel: {
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.textSecondary,
        fontWeight: TYPOGRAPHY.weight.medium,
    },
    totalValue: {
        fontSize: TYPOGRAPHY.size['2xl'],
        fontWeight: TYPOGRAPHY.weight.bold,
    },
    actions: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.background,
    },
    cancelButtonText: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.textSecondary,
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.sm,
    },
    confirmButtonText: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: '#FFFFFF',
    },
});
