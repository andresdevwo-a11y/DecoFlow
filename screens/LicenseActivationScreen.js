import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLicense } from '../context/LicenseContext';
import { useAlert } from '../context/AlertContext';
import { StatusBar } from 'expo-status-bar';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, SIZES } from '../constants/Theme';
import { Feather } from '@expo/vector-icons';

export default function LicenseActivationScreen() {
    const insets = useSafeAreaInsets();
    const { showToast } = useAlert();
    const [code, setCode] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const formatCode = (text) => {
        const cleaned = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        let formatted = '';
        for (let i = 0; i < cleaned.length; i++) {
            if (i > 0 && i % 4 === 0) {
                formatted += '-';
            }
            formatted += cleaned[i];
        }
        return formatted.substring(0, 14);
    };

    const handleChange = (text) => {
        setCode(formatCode(text));
    };

    const { activate, confirmActivation, isEnteringNewCode, cancelNewLicenseEntry } = useLicense();

    const handleActivate = async () => {
        setSubmitting(true);
        try {
            const result = await activate(code);
            if (!result.success) {
                showToast('error', result.message);
            } else {
                showToast('success', 'Tu licencia ha sido verificada correctamente. Bienvenido.');
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
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingTop: insets.top + SPACING.xl, paddingBottom: insets.bottom + SPACING.xl }
                    ]}
                >
                    <View style={styles.headerContainer}>
                        <View style={styles.iconContainer}>
                            <Feather name="shield" size={40} color={COLORS.primary} />
                        </View>
                        <Text style={styles.title}>Activar Licencia</Text>
                        <Text style={styles.description}>
                            Ingresa tu código de licencia único para empezar a usar DecoFlow Studio en este dispositivo.
                        </Text>
                    </View>

                    <View style={styles.card}>
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
                                    placeholderTextColor={COLORS.placeholder}
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
                            activeOpacity={0.8}
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

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            ¿No tienes una licencia? Contacta a soporte.
                        </Text>
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
        paddingHorizontal: SPACING.xl,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: SPACING['3xl'],
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary + '15', // 15% opacity
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.lg,
    },
    title: {
        fontSize: TYPOGRAPHY.size['3xl'],
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        marginBottom: SPACING.sm,
        textAlign: 'center',
    },
    description: {
        fontSize: TYPOGRAPHY.size.base,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: '85%',
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.xl,
        padding: SPACING['2xl'],
        ...SHADOWS.card,
        width: '100%',
    },
    inputContainer: {
        marginBottom: SPACING['2xl'],
    },
    label: {
        fontSize: TYPOGRAPHY.size.xs,
        fontWeight: '700',
        color: COLORS.textSecondary,
        marginBottom: SPACING.md,
        marginLeft: 4,
        letterSpacing: 1,
    },
    input: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.text,
        textAlign: 'center',
        textAlignVertical: 'center',
        width: '100%',
        height: 60,
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
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.placeholder,
        opacity: 0.5
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: 18,
        borderRadius: RADIUS.full,
        alignItems: 'center',
        ...SHADOWS.md,
    },
    buttonDisabled: {
        backgroundColor: COLORS.primaryDisabled,
        elevation: 0,
        shadowOpacity: 0,
    },
    buttonText: {
        color: 'white',
        fontSize: TYPOGRAPHY.size.base,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    cancelButton: {
        marginTop: SPACING.lg,
        padding: SPACING.md,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: COLORS.textSecondary,
        fontSize: TYPOGRAPHY.size.base,
        fontWeight: '600',
    },
    footer: {
        marginTop: SPACING['3xl'],
        alignItems: 'center',
    },
    footerText: {
        color: COLORS.textMuted,
        fontSize: TYPOGRAPHY.size.sm,
    }
});
