import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { COLORS } from '../constants/Theme';
import { Feather } from '@expo/vector-icons';
import { useLicense } from '../context/LicenseContext';

export default function LicenseWarningBanner({ level }) {
    const { licenseInfo, dismissWarning } = useLicense();
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (!licenseInfo?.end_date) return;

        const updateTimeLeft = () => {
            const end = new Date(licenseInfo.end_date).getTime();
            const now = Date.now();
            const diff = end - now;

            if (diff <= 0) return;

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

            if (days > 0) {
                setTimeLeft(`${days} día${days !== 1 ? 's' : ''}`);
            } else {
                setTimeLeft(`${hours} hora${hours !== 1 ? 's' : ''}`);
            }
        };

        updateTimeLeft();
        // No necesitamos interval aquí porque el contexto ya maneja actualizaciones 
        // y la precisión de minutos no es crítica para este banner
    }, [licenseInfo]);

    if (!level) return null;

    const isUrgent = level === 'HOURS';
    const backgroundColor = isUrgent ? '#F39C12' : '#FFF3CD';
    const textColor = isUrgent ? '#FFFFFF' : '#856404';
    const iconColor = isUrgent ? '#FFFFFF' : '#856404';

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <View style={styles.content}>
                <Feather name="alert-circle" size={20} color={iconColor} style={styles.icon} />
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: textColor }]}>
                        {isUrgent ? '¡Tu licencia expira hoy!' : 'Tu licencia está por vencer'}
                    </Text>
                    <Text style={[styles.message, { color: textColor }]}>
                        Quedan {timeLeft}. Renueva para evitar interrupciones.
                    </Text>
                </View>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.renewButton, { backgroundColor: isUrgent ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)' }]}
                    onPress={() => Linking.openURL('https://wa.me/573001234567')}
                >
                    <Text style={[styles.renewText, { color: textColor }]}>Renovar</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={dismissWarning} style={styles.closeButton}>
                    <Feather name="x" size={20} color={iconColor} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    icon: {
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 2,
    },
    message: {
        fontSize: 12,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    renewButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    renewText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 4,
    }
});
