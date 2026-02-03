import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { COLORS } from '../constants/Theme';
import { Feather } from '@expo/vector-icons';
import { useLicense } from '../context/LicenseContext';

export default function GraceCountdownBadge({ endsAt }) {
    const { showGraceModal } = useLicense();
    const [timeLeft, setTimeLeft] = useState('');
    const [isCritical, setIsCritical] = useState(false);

    useEffect(() => {
        if (!endsAt) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = Math.max(0, endsAt - now);

            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            // Si queda menos de 1 minuto, poner en rojo
            setIsCritical(minutes < 1);

            setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);

            if (diff <= 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [endsAt]);

    if (!endsAt) return null;

    return (
        <SafeAreaView pointerEvents="box-none" style={styles.safeArea}>
            <TouchableOpacity
                style={[styles.container, isCritical && styles.criticalContainer]}
                onPress={showGraceModal}
                activeOpacity={0.8}
            >
                <Feather name="clock" size={14} color="white" style={styles.icon} />
                <Text style={styles.text}>{timeLeft}</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 0 : 30, // Adjust for status bar
        right: 0,
        left: 0,
        zIndex: 9999,
        alignItems: 'flex-end',
        paddingHorizontal: 16,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F39C12',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        marginTop: 10,
    },
    criticalContainer: {
        backgroundColor: '#E74C3C',
        transform: [{ scale: 1.05 }],
    },
    icon: {
        marginRight: 6,
    },
    text: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
        fontVariant: ['tabular-nums'],
    }
});
