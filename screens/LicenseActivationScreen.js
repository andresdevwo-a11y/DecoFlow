import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLicense } from '../context/LicenseContext';
import { useAlert } from '../context/AlertContext';
import { StatusBar } from 'expo-status-bar';

const COLORS = {
    primary: '#4CAF50',
    background: '#F3F4F6',
    card: '#FFFFFF',
    text: '#2C3E50',
    textSecondary: '#7F8C8D',
    border: '#E0E0E0',
    error: '#E74C3C',
};

export default function LicenseActivationScreen() {
    // Redundant declaration removed
    const { showToast } = useAlert();

    // Safety check if useLicense didn't provide these (based on reading previous file, they weren't destructured in original file, but used in render?)
    // Ah, wait. The original file had: const [code, setCode] = useState(''); const [submitting, setSubmitting] = useState(false);
    // And const { activate } was NOT destructured but called as "activate(code)". Wait. 
    // In original file: "const result = await activate(code);" implies activate was imported?
    // Let me check imports again. "import { useLicense } from '../context/LicenseContext';"
    // But inside component: "const { activate } = useLicense();" was MISSING in the view! 
    // It was just "const result = await activate(code)". ERROR in previous code? 
    // No, I might have missed it in the view.
    // Line 58: "const result = await activate(code);"
    // But where is activate defined? 
    // Line 4: "import { useLicense } from '../context/LicenseContext';"
    // Line 18: "export default function LicenseActivationScreen() {"
    // No "const { activate } = useLicense();".
    // This implies `activate` might be a global function or I missed a line. 
    // Looking at file content again... Line 4 is import. Line 18 function start.
    // Maybe it was imported from somewhere else? 

    // Wait, looking at the previous specific view_code output for LicenseActivationScreen.js...
    // Line 4: import { useLicense } from '../context/LicenseContext';
    // Line 58: const result = await activate(code); -> This would throw ReferenceError if activate is not defined.
    // UNLESS `activate` is imported? No...
    // maybe `const { activate } = useLicense()` was omitted in the previous view or I missed it?
    // I read lines 1-246. 
    // Line 18: export default...
    // Line 19: const [code, setCode] ...
    // Line 20: const [submitting...
    // Line 22: // Toast state...
    // Line 55: const handleActivate...
    // Line 58: const result = await activate(code);

    // This suggests `activate` IS UNDEFINED in the current file unless I missed something?
    // Or maybe it was imported? No.
    // It is possible the previous code I saw was bugged or I missed a line.

    // BUT, I should definitely fix it to use useLicense correctly.

    const [code, setCode] = useState('');
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

    // Retrieve activate from context
    const { activate, confirmActivation, isEnteringNewCode, cancelNewLicenseEntry } = useLicense();

    const handleActivate = async () => {
        setSubmitting(true);
        try {
            const result = await activate(code);
            if (!result.success) {
                showToast('error', result.message);
            } else {
                // SUCCESS! 
                // Show toast globally
                showToast('success', 'Tu licencia ha sido verificada correctamente. Bienvenido.');
                // Navigate immediately
                confirmActivation();
            }
        } catch (error) {
            showToast('error', 'Ocurrió un error inesperado. Intenta nuevamente.');
        } finally {
            setSubmitting(false);
        }
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
        borderWidth: 0,
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
