import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    TouchableWithoutFeedback
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAlert } from '../../context/AlertContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../constants/Theme';

const FinanceActionsModal = ({ visible, onClose, onResetBalance, onDeleteData, balance }) => {
    const { showConfirm } = useAlert();

    // Helper to format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const handleResetBalance = () => {
        showConfirm({
            title: "Limpiar Balance",
            message: `El balance actual de ${formatCurrency(balance)} se restablecerá a $0. \n\nEsto NO borrará ninguna transacción, solo reiniciará el contador visual. ¿Deseas continuar?`,
            confirmText: "Sí, limpiar",
            cancelText: "Cancelar",
            onConfirm: () => {
                onResetBalance();
                onClose();
            }
        });
    };

    const confirmDelete = (type, label) => {
        showConfirm({
            title: `Eliminar ${label}`,
            message: `¿Estás seguro de que deseas eliminar ${label}? \n\nEsta acción NO se puede deshacer.`,
            confirmText: "Eliminar",
            cancelText: "Cancelar",
            isDestructive: true,
            onConfirm: () => {
                onDeleteData(type);
                onClose();
            }
        });
    };

    const DeleteOption = ({ icon, label, type, color = COLORS.error }) => (
        <TouchableOpacity
            style={styles.optionItem}
            onPress={() => confirmDelete(type, label)}
        >
            <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
                <Feather name={icon} size={20} color={color} />
            </View>
            <Text style={styles.optionLabel}>{label}</Text>
            <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContainer}>
                            <View style={styles.header}>
                                <Text style={styles.title}>Gestión de Datos</Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <Feather name="x" size={24} color={COLORS.textMuted} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

                                {/* Section 1: Balance Reset */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>BALANCE</Text>
                                    <View style={styles.card}>
                                        <View style={styles.balanceRow}>
                                            <View>
                                                <Text style={styles.balanceLabel}>Balance Visible Actual</Text>
                                                <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.resetButton}
                                                onPress={handleResetBalance}
                                            >
                                                <Feather name="refresh-cw" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                                                <Text style={styles.resetButtonText}>Limpiar</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <Text style={styles.helperText}>
                                            Reinicia el contador a cero sin borrar tus registros históricos.
                                        </Text>
                                    </View>
                                </View>

                                {/* Section 2: Delete Data */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>ELIMINAR DATOS</Text>
                                    <View style={styles.menuContainer}>
                                        <DeleteOption
                                            icon="shopping-cart"
                                            label="Todas las Ventas"
                                            type="sale"
                                            color="#22C55E"
                                        />
                                        <View style={styles.divider} />

                                        <DeleteOption
                                            icon="package"
                                            label="Todos los Alquileres"
                                            type="rental"
                                            color="#3B82F6"
                                        />
                                        <View style={styles.divider} />

                                        <DeleteOption
                                            icon="gift"
                                            label="Todas las Decoraciones"
                                            type="decoration"
                                            color="#F97316"
                                        />
                                        <View style={styles.divider} />

                                        <DeleteOption
                                            icon="minus-circle"
                                            label="Todos los Gastos"
                                            type="expense"
                                            color="#EF4444"
                                        />
                                        <View style={styles.divider} />

                                        <DeleteOption
                                            icon="file-text"
                                            label="Todas las Cotizaciones"
                                            type="quotation"
                                            color="#8B5CF6"
                                        />
                                    </View>

                                    {/* Danger Zone */}
                                    <View style={[styles.menuContainer, { marginTop: SPACING.lg, borderColor: COLORS.error }]}>
                                        <TouchableOpacity
                                            style={styles.optionItem}
                                            onPress={() => confirmDelete('all', 'TODA la información (Transacciones y Cotizaciones)')}
                                        >
                                            <View style={[styles.iconContainer, { backgroundColor: COLORS.error + '15' }]}>
                                                <Feather name="trash-2" size={20} color={COLORS.error} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.optionLabel, { color: COLORS.error, fontWeight: 'bold' }]}>Borrar TODO</Text>
                                                <Text style={{ fontSize: 10, color: COLORS.error }}>Elimina transacciones y cotizaciones</Text>
                                            </View>
                                            <Feather name="alert-triangle" size={20} color={COLORS.error} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={{ height: 20 }} />
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: COLORS.background,
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        height: '85%',
        ...SHADOWS.medium
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border
    },
    title: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text
    },
    closeButton: {
        padding: 4
    },
    scrollView: {
        padding: SPACING.lg
    },
    section: {
        marginBottom: SPACING.xl
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.size.xs,
        fontWeight: 'bold',
        color: COLORS.textSecondary,
        marginBottom: SPACING.md,
        letterSpacing: 1
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm
    },
    balanceLabel: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary
    },
    balanceAmount: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: 'bold',
        color: COLORS.text
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: SPACING.md,
        paddingVertical: 8,
        borderRadius: RADIUS.md
    },
    resetButtonText: {
        color: COLORS.primary,
        fontWeight: '600',
        fontSize: TYPOGRAPHY.size.sm
    },
    helperText: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.textMuted,
        fontStyle: 'italic'
    },
    menuContainer: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden'
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        backgroundColor: COLORS.surface
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.md
    },
    optionLabel: {
        flex: 1,
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.text,
        fontWeight: '500'
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginLeft: SPACING.lg + 36 + SPACING.md // Align with text start
    }
});

export default FinanceActionsModal;
