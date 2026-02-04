import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Image, Platform } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../constants/Theme';

const LoadingScreen = () => {
    // Animation value for opacity/scale
    const pulseAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Start with a quick fade-in, then loop
        Animated.sequence([
            Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 600, // Faster initial appearance
                useNativeDriver: true,
            }),
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 0, // We will interpolate this to [0.6, 1]
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    })
                ])
            )
        ]).start();
    }, []);

    const opacity = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.6, 1], // Minimum opacity 0.6
    });

    const scale = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.95, 1.05], // Subtle breathing
    });

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* App Name with Pulse Animation */}
                <Animated.View style={{ opacity: opacity, transform: [{ scale: scale }] }}>
                    <Text style={styles.title}>DecoFlow</Text>
                </Animated.View>

                {/* Loading Indicator */}
                <View style={styles.indicatorContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Iniciando...</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    title: {
        fontSize: 42,
        fontWeight: 'bold', // Using explicit string 'bold' or TYPOGRAPHY.weight.bold if you prefer consistency
        color: COLORS.primary,
        marginBottom: 40,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
        letterSpacing: 1,
    },
    indicatorContainer: {
        alignItems: 'center',
        gap: 10,
    },
    loadingText: {
        marginTop: 10,
        color: COLORS.textMuted,
        fontSize: TYPOGRAPHY.size.sm,
    }
});

export default LoadingScreen;
