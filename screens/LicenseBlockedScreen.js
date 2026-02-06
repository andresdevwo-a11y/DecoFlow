
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking, ScrollView, ActivityIndicator } from 'react-native';
import { useLicense } from '../context/LicenseContext';
import { StatusBar } from 'expo-status-bar';
import ToastNotification from '../components/ui/ToastNotification';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, SIZES } from '../constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LicenseBlockedScreen({ info }) {
    const insets = useSafeAreaInsets();
    const { refreshLicense, removeLicense, startNewLicenseEntry, isLoading } = useLicense();
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

    // Helper para obtener mensaje según el motivo
    const getVerificationMessage = (reason) => {
        switch (reason) {
            case 'LICENSE_EXPIRED':
                return 'La licencia sigue expirada';
            case 'LICENSE_BLOCKED':
                return 'La licencia sigue bloqueada';
            case 'DEVICE_MISMATCH':
                return 'Dispositivo no autorizado';
            default:
                return 'La licencia no pudo ser validada';
        }
    };

    // Handler para verificar licencia con feedback
    const handleVerifyLicense = async () => {
        try {
            const result = await refreshLicense();

            if (result?.valid) {
                // La navegación se manejará automáticamente por el contexto
                setToast({
                    visible: true,
                    message: '¡Licencia verificada exitosamente!',
                    type: 'success'
                });
            } else {
                // La licencia sigue siendo inválida
                const message = getVerificationMessage(result?.reason);
                setToast({
                    visible: true,
                    message,
                    type: 'error'
                });
            }
        } catch (error) {
            setToast({
                visible: true,
                message: 'Error de conexión. Verifica tu internet.',
                type: 'error'
            });
        }
    };

    // Determinar mensaje y color basado en la razón
    const getReasonDetails = () => {
        const reason = info?.reason || 'UNKNOWN';

        switch (reason) {
            case 'LICENSE_EXPIRED':
                return {
                    title: 'Licencia Expirada',
                    message: `Tu licencia venció el ${new Date(info.expired_at).toLocaleDateString()}. Para continuar disfrutando del servicio, por favor renuévala.`,
                    color: COLORS.warning,
                    icon: 'clock'
                };
            case 'LICENSE_BLOCKED':
                return {
                    title: 'Acceso Bloqueado',
                    message: 'Tu licencia ha sido suspendida temporalmente por administración. Contacta a soporte para más detalles.',
                    color: COLORS.error,
                    icon: 'lock'
                };
            case 'DEVICE_MISMATCH':
                return {
                    title: 'Dispositivo No Autorizado',
                    message: 'Esta licencia está siendo usada en otro dispositivo. Solo se permite un dispositivo activo por licencia.',
                    color: COLORS.error,
                    icon: 'smartphone'
                };
            case 'CACHE_EXPIRED':
                return {
                    title: 'Verificación Requerida',
                    message: 'Has estado sin conexión demasiado tiempo. Conéctate a internet para verificar tu licencia.',
                    color: COLORS.warning,
                    icon: 'wifi-off'
                };
            default:
                return {
                    title: 'Acceso Restringido',
                    message: info?.message || 'No se pudo validar la licencia.',
                    color: COLORS.error,
                    icon: 'alert-triangle'
                };
        }
    };

    const details = getReasonDetails();

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    { paddingTop: insets.top + SPACING.xl, paddingBottom: insets.bottom + SPACING.xl }
                ]}
            >

                <View style={[styles.iconContainer, { backgroundColor: details.color + '15' }]}>
                    <Feather name={details.icon} size={48} color={details.color} />
                </View>

                <Text style={styles.title}>{details.title}</Text>
                <Text style={styles.message}>{details.message}</Text>

                {info?.offline_mode && (
                    <View style={styles.offlineBox}>
                        <Feather name="wifi-off" size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
                        <Text style={styles.offlineText}>
                            Modo Offline: Quedan {info.offline_days_remaining} días
                        </Text>
                    </View>
                )}

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: details.color }]}
                        onPress={handleVerifyLicense}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Feather name="refresh-cw" size={18} color="white" style={{ marginRight: 8 }} />
                                <Text style={styles.buttonText}>Verificar Estado</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.outlineButton}
                        onPress={startNewLicenseEntry}
                    >
                        <Text style={styles.outlineButtonText}>Ingresar Nueva Licencia</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => Linking.openURL('https://wa.me/573001234567')}
                    >
                        <Feather name="message-circle" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                        <Text style={styles.linkText}>Contactar Soporte</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <ToastNotification
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast(prev => ({ ...prev, visible: false }))}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING['2xl'],
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING['2xl'],
    },
    title: {
        fontSize: TYPOGRAPHY.size['3xl'],
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        marginBottom: SPACING.md,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    message: {
        fontSize: TYPOGRAPHY.size.base,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING['3xl'],
        lineHeight: 24,
        paddingHorizontal: SPACING.md,
    },
    offlineBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderRadius: RADIUS.full,
        marginBottom: SPACING['2xl'],
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    offlineText: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    actions: {
        width: '100%',
        gap: SPACING.lg,
    },
    button: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: RADIUS.full,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.md,
    },
    buttonText: {
        color: 'white',
        fontSize: TYPOGRAPHY.size.base,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    outlineButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: RADIUS.full,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: COLORS.textSecondary + '40',
        backgroundColor: 'transparent',
    },
    outlineButtonText: {
        color: COLORS.textSecondary,
        fontSize: TYPOGRAPHY.size.base,
        fontWeight: '600',
    },
    linkButton: {
        flexDirection: 'row',
        padding: SPACING.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.sm,
    },
    linkText: {
        color: COLORS.primary,
        fontSize: TYPOGRAPHY.size.base,
        fontWeight: '600',
    },
});
