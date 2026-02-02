import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/Theme';

const HANDLE_SIZE = 32; // Comfortable touch size

export default function RotationHandle({
    onDragStart,
    onDragUpdate,
    onDragEnd,
    style,
    scale, // Shared Value
    isResizing, // Shared Value
    isDragging, // Shared Value - hide when dragging the image
    imageHeight // Number
}) {
    // Distance from the top edge of the image
    const VISUAL_OFFSET = 12;

    const animatedStyle = useAnimatedStyle(() => {
        if (!scale) return {};

        const currentScale = scale.value === 0 ? 0.001 : scale.value;

        // 1. Counter-scale to keep the handle defined size constant visually
        // 2. Position correction to keep fixed visual distance from image top

        // The handle is placed via absolute positioning in styles (let's override or use that).
        // If we want it to be exactly VISUAL_OFFSET pixels above the top edge VISUALLY:
        // The container is scaled by `scale`.
        // Top edge is at y = -imageHeight/2 (assuming center anchor).

        // We want the visual Y position to be: (-imageHeight/2 * scale) - VISUAL_OFFSET
        // The logical Y position (inside the scaled container) should be: (-imageHeight/2) - (VISUAL_OFFSET / scale)

        // Note: styles.topRotation might have some defaults we need to override or account for.
        // It has `top: -50`. This is static. We should rely on translation.

        // Let's assume the component is placed at (0, 0) or simply use translateY to move it from center.
        // Actually the parent uses `top: -50` in `styles.topRotation`. 
        // We should probably rely on `transform` strictly.

        // Let's calculate the target logical Y relative to center:
        const targetLogicalY = (-imageHeight / 2) - (VISUAL_OFFSET / currentScale);

        return {
            transform: [
                { translateY: targetLogicalY },
                { scale: 1 / currentScale } // Counter-scale
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
                    <MaterialIcons name="rotate-right" size={20} color={COLORS.primary} />
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
        position: 'absolute',
        zIndex: 20, // Higher than resize handles
    },
    visual: {
        width: HANDLE_SIZE,
        height: HANDLE_SIZE,
        borderRadius: HANDLE_SIZE / 2,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border, // Subtle border
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
