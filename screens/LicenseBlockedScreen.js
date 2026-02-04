
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { useLicense } from '../context/LicenseContext';
import { StatusBar } from 'expo-status-bar';

const COLORS = {
    error: '#E74C3C',
    warning: '#F39C12',
    background: '#F3F4F6',
    text: '#2C3E50',
    textSecondary: '#7F8C8D',
};

export default function LicenseBlockedScreen({ info }) {
    const { refreshLicense, removeLicense, startNewLicenseEntry, isLoading } = useLicense();

    // Determinar mensaje y color basado en la razón
    const getReasonDetails = () => {
        const reason = info?.reason || 'UNKNOWN';

        switch (reason) {
            case 'LICENSE_EXPIRED':
                return {
                    title: 'Licencia Expirada',
                    message: `Tu licencia venció el ${new Date(info.expired_at).toLocaleDateString()}. Para continuar disfrutando del servicio, por favor renuévala.`,
                    color: COLORS.warning,
                    icon: 'CLOCK'
                };
            case 'LICENSE_BLOCKED':
                return {
                    title: 'Acceso Bloqueado',
                    message: 'Tu licencia ha sido suspendida temporalmente por administración. Contacta a soporte para más detalles.',
                    color: COLORS.error,
                    icon: 'LOCK'
                };
            case 'DEVICE_MISMATCH':
                return {
                    title: 'Dispositivo No Autorizado',
                    message: 'Esta licencia está siendo usada en otro dispositivo. Solo se permite un dispositivo activo por licencia.',
                    color: COLORS.error,
                    icon: 'PHONE'
                };
            case 'CACHE_EXPIRED':
                return {
                    title: 'Verificación Requerida',
                    message: 'Has estado sin conexión demasiado tiempo. Conéctate a internet para verificar tu licencia.',
                    color: COLORS.warning,
                    icon: 'WIFI'
                };
            default:
                return {
                    title: 'Acceso Restringido',
                    message: info?.message || 'No se pudo validar la licencia.',
                    color: COLORS.error,
                    icon: 'ALERT'
                };
        }
    };

    const details = getReasonDetails();

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <ScrollView contentContainerStyle={styles.content}>

                <View style={[styles.iconContainer, { backgroundColor: details.color + '20' }]}>
                    <Text style={[styles.iconText, { color: details.color }]}>!</Text>
                </View>

                <Text style={styles.title}>{details.title}</Text>
                <Text style={styles.message}>{details.message}</Text>

                {info?.offline_mode && (
                    <View style={styles.offlineBox}>
                        <Text style={styles.offlineText}>
                            Modo Offline: Quedan {info.offline_days_remaining} días
                        </Text>
                    </View>
                )}

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: details.color }]}
                        onPress={refreshLicense}
                        disabled={isLoading}
                    >
                        <Text style={styles.buttonText}>
                            {isLoading ? 'Verificando...' : 'Verificar Estado'}
                        </Text>
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
                        <Text style={styles.linkText}>Contactar Soporte</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
        padding: 30,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    iconText: {
        fontSize: 50,
        fontWeight: '900',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    offlineBox: {
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
    },
    offlineText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    actions: {
        width: '100%',
        gap: 16,
    },
    button: {
        width: '100%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    outlineButton: {
        width: '100%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    outlineButtonText: {
        color: COLORS.textSecondary,
        fontSize: 16,
        fontWeight: '600',
    },
    linkButton: {
        padding: 16,
        alignItems: 'center',
    },
    linkText: {
        color: '#3498DB',
        fontSize: 16,
        textDecorationLine: 'underline',
    },
});
