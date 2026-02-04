
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Dimensions, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Wrapper que anima las transiciones entre pantallas basándose en un screenKey
 * Detecta si es "adelante" o "atrás" para aplicar la dirección correcta del slide
 */
export default function AnimatedScreenTransition({ screenKey, direction = 'auto', children }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;
    const [currentChildren, setCurrentChildren] = useState(children);
    const [previousKey, setPreviousKey] = useState(screenKey);

    // Definir orden de pantallas para determinar dirección automática
    const screenOrder = ['loading', 'activation', 'blocked', 'app'];

    const getDirection = (from, to) => {
        if (direction !== 'auto') return direction;
        const fromIndex = screenOrder.indexOf(from);
        const toIndex = screenOrder.indexOf(to);
        // Si vamos a un índice mayor, es "adelante" (slide left)
        // Si vamos a un índice menor, es "atrás" (slide right)
        return toIndex >= fromIndex ? 'forward' : 'backward';
    };

    useEffect(() => {
        if (screenKey !== previousKey) {
            const animDirection = getDirection(previousKey, screenKey);
            const slideStart = animDirection === 'forward' ? SCREEN_WIDTH : -SCREEN_WIDTH;

            // Fade out actual
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }).start(() => {
                // Cambiar contenido
                setCurrentChildren(children);
                setPreviousKey(screenKey);

                // Preparar slide
                slideAnim.setValue(slideStart * 0.3);

                // Fade in + slide con nuevo contenido
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 250,
                        useNativeDriver: true,
                    }),
                    Animated.spring(slideAnim, {
                        toValue: 0,
                        friction: 8,
                        tension: 40,
                        useNativeDriver: true,
                    }),
                ]).start();
            });
        } else {
            // Primera renderización
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [screenKey, children]);

    return (
        <View style={styles.wrapper}>
            <Animated.View
                style={[
                    styles.container,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateX: slideAnim }],
                    },
                ]}
            >
                {currentChildren}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
    },
    container: {
        flex: 1,
    },
});
