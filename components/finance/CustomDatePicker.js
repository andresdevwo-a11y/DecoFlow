import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/Theme';

const CustomDatePicker = ({ label, date, onDateChange, minDate, maxDate, placeholder = 'Seleccionar fecha' }) => {
    const [show, setShow] = useState(false);

// Si date es null/undefined/'', usamos hoy como base para el picker, pero mantemos el valor visual como vacío
    // Ajuste de zona horaria local para strings YYYY-MM-DD
    const parseDateForPicker = (d) => {
        if (d instanceof Date) return d;
        if (typeof d === 'string' && d.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [y, m, d_] = d.split('-').map(Number);
            // Usar hora local (medianoche) para evitar problemas de timezone
            return new Date(y, m - 1, d_);
        }
        return new Date(); // Fallback
    };

    const hasDate = date && date !== '';
    const pickerDate = hasDate ? parseDateForPicker(date) : new Date();

    const onChange = (event, selectedDate) => {
        if (Platform.OS === 'android') {
            setShow(false);
        }

        // Si el usuario cancela en Android, selectedDate es undefined.
        // Si selecciona, se pasa la fecha.
        if (event.type === 'dismissed') {
            return;
        }

if (selectedDate) {
            // Convertir a formato ISO string consistente (YYYY-MM-DD) usando hora local
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const localISOString = `${year}-${month}-${day}`;
            onDateChange(localISOString);
        }
    };

const formatDate = (date) => {
        if (!date || date === '') return '';
        const d = typeof date === 'string' ? parseDateForPicker(date) : date;
        return d.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'America/Bogota'
        });
    };

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setShow(true)}
                activeOpacity={0.7}
            >
                <Feather name="calendar" size={20} color={hasDate ? COLORS.textMuted : COLORS.textMuted} />
                <Text style={hasDate ? styles.dateText : styles.placeholderText}>
                    {hasDate ? formatDate(date) : placeholder}
                </Text>
            </TouchableOpacity>

            {show && (
                Platform.OS === 'ios' ? (
                    <Modal
                        transparent={true}
                        animationType="slide"
                        visible={show}
                        onRequestClose={() => setShow(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.iosPickerContainer}>
                                <View style={styles.iosHeader}>
                                    <TouchableOpacity onPress={() => setShow(false)}>
                                        <Text style={styles.iosButton}>Listo</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    testID="dateTimePicker"
                                    value={pickerDate}
                                    mode="date"
                                    display="spinner"
                                    onChange={onChange}
                                    style={styles.iosPicker}
                                    themeVariant="light"
                                    minimumDate={minDate}
                                    maximumDate={maxDate}
                                    locale="es-ES"
                                />
                            </View>
                        </View>
                    </Modal>
                ) : (
                    <DateTimePicker
                        testID="dateTimePicker"
                        value={pickerDate}
                        mode="date"
                        display="default"
                        onChange={onChange}
                        minimumDate={minDate}
                        maximumDate={maxDate}
                    />
                )
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
    },
    label: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: SPACING.sm,
    },
    dateText: {
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.text,
    },
    placeholderText: {
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.textMuted,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    iosPickerContainer: {
        backgroundColor: COLORS.surface,
        paddingBottom: SPACING.xl,
    },
    iosHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    iosButton: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.primary,
    },
    iosPicker: {
        height: 200,
        backgroundColor: COLORS.surface,
    }
});

export default CustomDatePicker;
