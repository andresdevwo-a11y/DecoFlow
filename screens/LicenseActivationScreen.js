
import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLicense } from '../context/LicenseContext';
import { StatusBar } from 'expo-status-bar';

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
    const { activate } = useLicense();
    const [submitting, setSubmitting] = useState(false);

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
        if (code.length < 14) {
            Alert.alert('Código Incompleto', 'Por favor ingresa el código completo de 12 caracteres.');
            return;
        }

        setSubmitting(true);
        try {
            const result = await activate(code);
            if (!result.success) {
                Alert.alert('Error de Activación', result.message);
            }
            // Si es exitoso, el contexto actualizará el estado y App.js desmontará esta pantalla
        } catch (error) {
            Alert.alert('Error', 'Ocurrió un error inesperado. Intenta nuevamente.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <StatusBar style="dark" />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.logoContainer}>
                    <View style={styles.iconCircle}>
                        <Text style={styles.iconText}>WS</Text>
                    </View>
                    <Text style={styles.appName}>Woodland Studio</Text>
                    <Text style={styles.version}>Gestión Administrativa</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.title}>Activar Licencia</Text>
                    <Text style={styles.description}>
                        Ingresa tu código de licencia único para empezar a usar la aplicación en este dispositivo.
                    </Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>CÓDIGO DE LICENCIA</Text>
                        <TextInput
                            style={styles.input}
                            value={code}
                            onChangeText={handleChange}
                            placeholder="XXXX-XXXX-XXXX"
                            placeholderTextColor="#BDC3C7"
                            maxLength={14}
                            autoCapitalize="characters"
                            autoCorrect={false}
                        />
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
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>¿No tienes un código?</Text>
                    <TouchableOpacity onPress={() => Alert.alert('Contacto', 'Contacta al administrador para adquirir una licencia.')}>
                        <Text style={styles.linkText}>Adquirir Licencia</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 5,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    iconText: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
    },
    appName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    version: {
        fontSize: 14,
        color: COLORS.textSecondary,
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
        letterSpacing: 2,
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
    footer: {
        marginTop: 32,
        alignItems: 'center',
    },
    footerText: {
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    linkText: {
        color: COLORS.primary,
        fontWeight: '600',
        fontSize: 16,
    },
});
