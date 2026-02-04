
import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLicense } from '../context/LicenseContext';
import { StatusBar } from 'expo-status-bar';
import InfoModal from '../components/InfoModal';

const COLORS = {
    primary: '#4CAF50',
    background: '#F5F7FA',
    card: '#FFFFFF',
    text: '#2C3E50',
    textSecondary: '#7F8C8D',
    border: '#E0E0E0',
    error: '#E74C3C',
};

export default function LicenseActivationScreen() {
    const [code, setCode] = useState('');
    const { activate, confirmActivation, isEnteringNewCode, cancelNewLicenseEntry } = useLicense();
    const [submitting, setSubmitting] = useState(false);
    const [alertModal, setAlertModal] = useState({ visible: false, title: '', message: '', type: 'error' });
    const [successModalVisible, setSuccessModalVisible] = useState(false);

    const showAlert = (title, message, type = 'error') => {
        setAlertModal({ visible: true, title, message, type });
    };

    const closeAlert = () => {
        setAlertModal(prev => ({ ...prev, visible: false }));
    };

    const formatCode = (text) => {
        // Eliminar todo lo que no sea alfanumérico
        const cleaned = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

        // Agregar guiones cada 4 caracteres
        let formatted = '';
        for (let i = 0; i < cleaned.length; i++) {
            if (i > 0 && i % 4 === 0) {
                formatted += '-';
            }
            formatted += cleaned[i];
        }

        // Limitar a XXXX-XXXX-XXXX (14 caracteres con guiones, 12 sin ellos)
        return formatted.substring(0, 14);
    };

    const handleChange = (text) => {
        setCode(formatCode(text));
    };

    const handleActivate = async () => {
        setSubmitting(true);
        try {
            const result = await activate(code);
            if (!result.success) {
                showAlert('Error de Activación', result.message);
            } else {
                setSuccessModalVisible(true);
            }
        } catch (error) {
            showAlert('Error', 'Ocurrió un error inesperado. Intenta nuevamente.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSuccessClose = () => {
        setSuccessModalVisible(false);
        // Pequeño delay para permitir que el modal cierre suavemente
        setTimeout(() => {
            confirmActivation();
        }, 200);
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.card}>
                        <Text style={styles.title}>Activar Licencia</Text>
                        <Text style={styles.description}>
                            Ingresa tu código de licencia único para empezar a usar la aplicación en este dispositivo.
                        </Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>CÓDIGO DE LICENCIA</Text>
                            <View style={styles.textInputWrapper}>
                                <TextInput
                                    style={[styles.input, { letterSpacing: code ? 2 : 0 }]}
                                    value={code}
                                    onChangeText={handleChange}
                                    maxLength={14}
                                    autoCapitalize="characters"
                                    autoCorrect={false}
                                    selectionColor={COLORS.primary}
                                />
                                {code.length === 0 && (
                                    <View style={styles.placeholderContainer} pointerEvents="none">
                                        <Text style={styles.placeholderText}>XXXX-XXXX-XXXX</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, (submitting || code.length < 14) && styles.buttonDisabled]}
                            onPress={handleActivate}
                            disabled={submitting || code.length < 14}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.buttonText}>ACTIVAR APLICACIÓN</Text>
                            )}
                        </TouchableOpacity>

                        {isEnteringNewCode && (
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={cancelNewLicenseEntry}
                                disabled={submitting}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <InfoModal
                visible={alertModal.visible}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
                onClose={closeAlert}
            />

            <InfoModal
                visible={successModalVisible}
                title="¡Activación Exitosa!"
                message="Tu licencia ha sido verificada correctamente. Bienvenido."
                type="success"
                onClose={handleSuccessClose}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },

    card: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#F8F9FA',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 16,
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        textAlign: 'center',
        textAlignVertical: 'center', // Fix for Android centering
        width: '100%',
    },
    textInputWrapper: {
        justifyContent: 'center',
    },
    placeholderContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    placeholderText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#BDC3C7',
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#A5D6A7',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButton: {
        marginTop: 16,
        padding: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: COLORS.textSecondary,
        fontSize: 16,
        fontWeight: '600',
    },
});
