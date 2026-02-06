import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/Theme';
import { useFinance } from '../context/FinanceContext';
import { useAlert } from '../context/AlertContext';
import RentalForm from '../components/finance/forms/RentalForm';

const CreateRentalScreen = ({ onBack, onSuccess }) => {
    const insets = useSafeAreaInsets();
    const { addRental } = useFinance();
    const { showAlert } = useAlert();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (formData) => {
        setIsSubmitting(true);
        try {
            const newTransaction = await addRental(formData);
            showAlert("success", "Éxito", "Alquiler registrado correctamente", () => {
                if (onSuccess) {
                    onSuccess(newTransaction);
                } else {
                    onBack();
                }
            });
        } catch (error) {
            showAlert("error", "Error", "No se pudo registrar el alquiler. Inténtalo de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Registrar Alquiler</Text>
                <View style={{ width: 40 }} />
            </View>

            <RentalForm
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
            />
        </View>
    );
};

export default CreateRentalScreen;

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
});
