import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, Linking } from 'react-native';
import { COLORS } from '../constants/Theme';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useLicense } from '../context/LicenseContext';

const { width } = Dimensions.get('window');

export default function LicenseGraceModal({ visible, endsAt }) {
    const { dismissGraceModal, isGraceModalDismissed } = useLicense();
    const [timeLeft, setTimeLeft] = useState('');
    const [secondsLeft, setSecondsLeft] = useState(0);

    useEffect(() => {
        if (!endsAt || !visible) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = Math.max(0, endsAt - now);
            setSecondsLeft(Math.floor(diff / 1000));

            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

            if (diff <= 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [endsAt, visible]);

    // Si el usuario ya lo cerró una vez, no lo mostramos como modal bloqueante
    // (A menos que queramos forzarlo cada cierto tiempo, pero por ahora respetamos el dismiss)
    if (!visible || isGraceModalDismissed) return null;

    return (
        <Modal
            transparent
            visible={visible && !isGraceModalDismissed}
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                {/* Fondo semitransparente */}
                <View style={[styles.background, { backgroundColor: 'rgba(0,0,0,0.7)' }]} />

                <View style={styles.modalContainer}>
                    <View style={styles.iconContainer}>
                        <Feather name="clock" size={40} color={COLORS.warning || '#F39C12'} />
                    </View>

                    <Text style={styles.title}>Licencia Expirada</Text>

                    <Text style={styles.message}>
                        Tu licencia ha expirado. Tienes un breve período de gracia para finalizar y guardar tu trabajo.
                    </Text>

                    <View style={styles.timerContainer}>
                        <Text style={styles.timerLabel}>La aplicación se bloqueará en:</Text>
                        <Text style={styles.timerValue}>{timeLeft}</Text>
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => Linking.openURL('https://wa.me/573001234567')}
                        >
                            <Text style={styles.primaryButtonText}>Renovar Ahora</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={dismissGraceModal}
                        >
                            <Text style={styles.secondaryButtonText}>Entendido, quiero guardar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContainer: {
        width: Math.min(width - 40, 340),
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFF3CD',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: '#7F8C8D',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    timerContainer: {
        backgroundColor: '#F8F9FA',
        width: '100%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    timerLabel: {
        fontSize: 13,
        color: '#7F8C8D',
        marginBottom: 4,
    },
    timerValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#E74C3C',
        fontVariant: ['tabular-nums'],
    },
    actions: {
        width: '100%',
        gap: 12,
    },
    primaryButton: {
        backgroundColor: COLORS.primary || '#3498DB',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    secondaryButtonText: {
        color: '#2C3E50',
        fontSize: 16,
        fontWeight: '600',
    },
});
