import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING } from '../../../constants/Theme';

const ClientForm = ({ values, onChange, errors = {}, selectedClientId, onOpenSelector, onClearSelection }) => {
    // Helper to update a specific field
    const handleChange = (field, text) => {
        if (selectedClientId && onClearSelection) {
            onClearSelection();
        }
        onChange({ ...values, [field]: text });
    };

    return (
        <View style={styles.container}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md }}>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Información del Cliente</Text>
                {onOpenSelector && (
                    <TouchableOpacity onPress={onOpenSelector}>
                        <Text style={{ color: COLORS.primary, fontWeight: '600' }}>
                            {selectedClientId ? 'Cambiar Cliente' : 'Buscar Cliente'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {selectedClientId && (
                <View style={styles.selectedBadge}>
                    <Feather name="check-circle" size={16} color={COLORS.success} />
                    <Text style={styles.selectedText}>Cliente existente seleccionado</Text>
                </View>
            )}

            {/* Name (Required) */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre Completo</Text>
                <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    placeholder="Ej: Juan Pérez"
                    placeholderTextColor={COLORS.textMuted}
                    value={values.name}
                    onChangeText={(text) => handleChange('name', text)}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.row}>
                {/* Phone */}
                <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.md }]}>
                    <Text style={styles.label}>Teléfono / WhatsApp</Text>
                    <View style={styles.iconInputContainer}>
                        <Feather name="phone" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={styles.iconInput}
                            placeholder="300 123 4567"
                            placeholderTextColor={COLORS.textMuted}
                            value={values.phone}
                            onChangeText={(text) => handleChange('phone', text)}
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                {/* Document ID */}
                <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Cédula / NIT</Text>
                    <View style={styles.iconInputContainer}>
                        <Feather name="credit-card" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={styles.iconInput}
                            placeholder="1234567890"
                            placeholderTextColor={COLORS.textMuted}
                            value={values.documentId}
                            onChangeText={(text) => handleChange('documentId', text)}
                            keyboardType="numeric"
                        />
                    </View>
                </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Correo Electrónico</Text>
                <View style={styles.iconInputContainer}>
                    <Feather name="mail" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput
                        style={styles.iconInput}
                        placeholder="cliente@ejemplo.com"
                        placeholderTextColor={COLORS.textMuted}
                        value={values.email}
                        onChangeText={(text) => handleChange('email', text)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>
            </View>

            {/* Address */}
            <View style={[styles.inputGroup, { marginBottom: 0 }]}>
                <Text style={styles.label}>Dirección</Text>
                <View style={styles.iconInputContainer}>
                    <Feather name="map-pin" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput
                        style={styles.iconInput}
                        placeholder="Calle 123 # 45 - 67"
                        placeholderTextColor={COLORS.textMuted}
                        value={values.address}
                        onChangeText={(text) => handleChange('address', text)}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 0,
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    inputGroup: {
        marginBottom: SPACING.md,
    },
    label: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs,
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
    inputError: {
        borderColor: COLORS.error,
    },
    errorText: {
        color: COLORS.error,
        fontSize: TYPOGRAPHY.size.sm,
        marginTop: 4,
    },
    row: {
        flexDirection: 'row',
    },
    iconInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: SPACING.md,
    },
    inputIcon: {
        marginRight: SPACING.sm,
    },
    iconInput: {
        flex: 1,
        paddingVertical: SPACING.md,
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.text,
    },
    selectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.success + '15',
        padding: SPACING.sm,
        borderRadius: 8,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.success + '30',
    },
    selectedText: {
        marginLeft: 8,
        color: COLORS.success,
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: '600',
    }
});

export default ClientForm;
