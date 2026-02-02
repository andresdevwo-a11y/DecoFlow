import { Gesture } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';

// Constants for zoom limits
const MIN_SCALE = 0.1;
const MAX_SCALE = 3;
const SPRING_CONFIG = {
    damping: 20,
    stiffness: 150,
};

/**
 * Custom hook for canvas zoom and pan gestures.
 * Provides pinch-to-zoom and drag-to-pan functionality.
 * 
 * @returns {Object} - { composedGesture, animatedStyle, resetTransform }
 */
export default function useCanvasGestures() {
    // Shared values for transformations
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);

    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    // Pinch gesture for zooming
    const pinchGesture = Gesture.Pinch()
        .onStart(() => {
            savedScale.value = scale.value;
        })
        .onUpdate((event) => {
            // Calculate new scale, clamped between min and max
            const newScale = savedScale.value * event.scale;
            scale.value = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);
        })
        .onEnd(() => {
            // Optional: Spring back if zoomed too far
            if (scale.value < MIN_SCALE) {
                scale.value = withSpring(MIN_SCALE, SPRING_CONFIG);
            } else if (scale.value > MAX_SCALE) {
                scale.value = withSpring(MAX_SCALE, SPRING_CONFIG);
            }
        });

    // Pan gesture for dragging
    const panGesture = Gesture.Pan()
        .onStart(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        })
        .onUpdate((event) => {
            translateX.value = savedTranslateX.value + event.translationX;
            translateY.value = savedTranslateY.value + event.translationY;
        });

    // Double tap gesture to reset view
    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
            'worklet';
            scale.value = withSpring(1, SPRING_CONFIG);
            translateX.value = withSpring(0, SPRING_CONFIG);
            translateY.value = withSpring(0, SPRING_CONFIG);
        });

    // Combine all gestures - double tap is exclusive, pinch+pan are simultaneous
    const pinchPanGesture = Gesture.Simultaneous(pinchGesture, panGesture);
    const composedGesture = Gesture.Race(doubleTapGesture, pinchPanGesture);

    // Animated style to apply to canvas content
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: scale.value },
            ],
        };
    });

    // Reset function for programmatic reset (e.g., "fit to screen" button)
    const resetTransform = () => {
        scale.value = withSpring(1, SPRING_CONFIG);
        translateX.value = withSpring(0, SPRING_CONFIG);
        translateY.value = withSpring(0, SPRING_CONFIG);
    };

    // Programmatic zoom control
    const setZoom = (newScale) => {
        const clampedScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);
        scale.value = clampedScale; // Direct assignment for instant zoom
    };

    // Programmatic pan control
    const setPan = (x, y) => {
        translateX.value = x;
        translateY.value = y;
    };

    return {
        composedGesture,
        animatedStyle,
        resetTransform,
        setZoom, // Export setZoom
        setPan, // Export setPan
        // Expose for toolbar zoom buttons if needed
        scale,
        translateX,
        translateY,
    };
}
