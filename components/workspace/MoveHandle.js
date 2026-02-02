import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/Theme';

const HANDLE_SIZE = 32;

export default function MoveHandle({
    onDragStart,
    onDragUpdate,
    onDragEnd,
    style,
    scale,
    isResizing,
    isDragging,
}) {
    const animatedStyle = useAnimatedStyle(() => {
        if (!scale) return {};

        const currentScale = scale.value === 0 ? 0.001 : scale.value;

        return {
            transform: [
                { scale: 1 / currentScale }
            ],
            opacity: (isResizing && isResizing.value) || (isDragging && isDragging.value) ? 0 : 1
        };
    });

    const gesture = Gesture.Pan()
        .onStart((event) => {
            if (onDragStart) onDragStart(event);
        })
        .onUpdate((event) => {
            if (onDragUpdate) onDragUpdate(event);
        })
        .onEnd((event) => {
            if (onDragEnd) onDragEnd(event);
        });

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.container, style, animatedStyle]}>
                <View style={styles.visual}>
                    <MaterialIcons name="open-with" size={20} color={COLORS.primary} />
                </View>
            </Animated.View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    container: {
        width: HANDLE_SIZE,
        height: HANDLE_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    visual: {
        width: HANDLE_SIZE,
        height: HANDLE_SIZE,
        borderRadius: HANDLE_SIZE / 2,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 4,
    },
});
