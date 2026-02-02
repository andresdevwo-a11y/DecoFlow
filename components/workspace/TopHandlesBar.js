import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/Theme';

const HANDLE_SIZE = 32;
const HANDLE_GAP = 8; // Gap between handles when both are visible
const MIN_SIZE_THRESHOLD = 80; // Show move handle when scaled dimensions are below this

export default function TopHandlesBar({
    // Rotation handlers
    onRotateStart,
    onRotateUpdate,
    onRotateEnd,
    // Move handlers
    onMoveStart,
    onMoveUpdate,
    onMoveEnd,
    // Shared values
    scale,
    canvasZoom,
    isResizing,
    isDragging,
    // Dimensions
    imageWidth,
    imageHeight,
}) {
    const VISUAL_OFFSET = 40; // Fixed distance (Handle size + gap)

    const animatedContainerStyle = useAnimatedStyle(() => {
        if (!scale) return {};

        const currentScale = scale.value === 0 ? 0.001 : scale.value;
        const currentCanvasZoom = canvasZoom && canvasZoom.value ? canvasZoom.value : 1;

        // Calculate if we need to show the move handle
        const scaledWidth = imageWidth * currentScale;
        const scaledHeight = imageHeight * currentScale;
        const showMoveHandle = scaledWidth < MIN_SIZE_THRESHOLD || scaledHeight < MIN_SIZE_THRESHOLD;

        // Calculate the width of the container based on visible handles
        // If both handles visible: 2 handles + gap
        // If only rotation handle: 1 handle
        const containerWidth = showMoveHandle
            ? (HANDLE_SIZE * 2 + HANDLE_GAP)
            : HANDLE_SIZE;

        // Position the container above the image at a fixed visual distance
        // We want the visual distance to be constant regardless of ZOOM or SCALE.
        // Physical visual distance = VISUAL_OFFSET
        // Context distance = VISUAL_OFFSET / (imageScale * canvasZoom)

        // Wait, the container is inside the Transformed Image View.
        // So it inherits `scale` (image scale).
        // It does NOT inherit `canvasZoom` directly (except for the fact that the whole image view is zoomed).
        // To counteract image scale: scale = 1/imageScale.
        // To counteract canvas zoom: scale = 1/canvasZoom.
        // Total Scale = 1/(imageScale * canvasZoom).

        // Vertical Translation (Logical units inside image):
        // We need `(-VISUAL_OFFSET / canvasZoom) / imageScale` ? 
        // Let's trace:
        // Image Scale S, Zoom Z.
        // Real pixels on screen for 1 logical unit = S * Z.
        // We want V pixels gap.
        // Logical Gap G = V / (S * Z).

        // Also need to shift by half logical handle size? 
        // The handle itself is scaled by 1/(S*Z).
        // Logical Size = PhysicalSize / (S*Z).
        // Center is at 0. Top is at -H/2.
        // We want top of image (-H/2) - Gap - HandleRadius.
        // No, `TopHandlesBar` is at `top: 0` inside the container.
        // So base Y is -Gap - HandleRadius.

        const effectiveScale = currentScale * currentCanvasZoom;
        const targetLogicalY = -(VISUAL_OFFSET / effectiveScale) - (HANDLE_SIZE / 2);

        return {
            transform: [
                { translateY: targetLogicalY },
                { scale: 1 / effectiveScale }
            ],
            width: containerWidth,
            marginLeft: -containerWidth / 2, // Center the container
            opacity: (isResizing && isResizing.value) || (isDragging && isDragging.value) ? 0 : 1
        };
    });

    // Animated style for the move handle visibility
    const moveHandleStyle = useAnimatedStyle(() => {
        if (!scale) return { display: 'none' };

        const currentScale = scale.value === 0 ? 0.001 : scale.value;
        const scaledWidth = imageWidth * currentScale;
        const scaledHeight = imageHeight * currentScale;
        const showMoveHandle = scaledWidth < MIN_SIZE_THRESHOLD || scaledHeight < MIN_SIZE_THRESHOLD;

        return {
            display: showMoveHandle ? 'flex' : 'none',
            opacity: showMoveHandle ? 1 : 0,
        };
    });

    // Rotation gesture
    const rotationGesture = Gesture.Pan()
        .onStart((event) => {
            if (onRotateStart) onRotateStart(event);
        })
        .onUpdate((event) => {
            if (onRotateUpdate) onRotateUpdate(event);
        })
        .onEnd((event) => {
            if (onRotateEnd) onRotateEnd(event);
        });

    // Move gesture
    const moveGesture = Gesture.Pan()
        .onStart((event) => {
            if (onMoveStart) onMoveStart(event);
        })
        .onUpdate((event) => {
            if (onMoveUpdate) onMoveUpdate(event);
        })
        .onEnd((event) => {
            if (onMoveEnd) onMoveEnd(event);
        });

    return (
        <Animated.View style={[styles.container, animatedContainerStyle]}>
            {/* Move Handle - only visible when image is small */}
            <GestureDetector gesture={moveGesture}>
                <Animated.View style={[styles.handleWrapper, moveHandleStyle]}>
                    <View style={styles.visual}>
                        <MaterialIcons name="open-with" size={20} color={COLORS.primary} />
                    </View>
                </Animated.View>
            </GestureDetector>

            {/* Rotation Handle - always visible */}
            <GestureDetector gesture={rotationGesture}>
                <Animated.View style={styles.handleWrapper}>
                    <View style={styles.visual}>
                        <MaterialIcons name="rotate-right" size={20} color={COLORS.primary} />
                    </View>
                </Animated.View>
            </GestureDetector>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: '50%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: HANDLE_GAP,
        zIndex: 20,
    },
    handleWrapper: {
        width: HANDLE_SIZE,
        height: HANDLE_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
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
