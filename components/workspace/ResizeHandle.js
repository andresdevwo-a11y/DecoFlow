import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { COLORS } from '../../constants/Theme';

const HANDLE_SIZE = 44; // Increased touch area for mobile
const VISUAL_SIZE = 20; // Increased visual size

export default function ResizeHandle({
    id, // 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
    activeHandle, // shared value
    onDragStart,
    onDragUpdate,
    onDragEnd,
    style,
    scale, // Receive scale shared value
    canvasZoom, // Receive canvas zoom shared value
    isDragging // Shared Value - hide when dragging the image
}) {
    // Inverse scale style to keep the handle visually constant
    const animatedStyle = useAnimatedStyle(() => {
        if (!scale) return {};

        const currentScale = scale.value === 0 ? 0.001 : scale.value;
        const currentCanvasZoom = canvasZoom && canvasZoom.value ? canvasZoom.value : 1;

        // Hide if:
        // 1. activeHandle has a value (someone is interacting) AND it's not me
        // 2. OR isDragging is true (user is moving the image)
        const isHiddenByHandle = activeHandle && activeHandle.value && activeHandle.value !== id;
        const isHiddenByDragging = isDragging && isDragging.value;
        const isHidden = isHiddenByHandle || isHiddenByDragging;

        return {
            // Apply inverse scale of image AND inverse scale of canvas zoom
            transform: [{ scale: (1 / currentScale) * (1 / currentCanvasZoom) }],
            opacity: isHidden ? 0 : 1
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
            <Animated.View style={[styles.container, style, scale && animatedStyle]}>
                <View style={styles.visual} />
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
        position: 'absolute',
        zIndex: 10, // Ensure it's above other elements
    },
    visual: {
        width: VISUAL_SIZE,
        height: VISUAL_SIZE,
        borderRadius: VISUAL_SIZE / 2,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: COLORS.primary,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
});
