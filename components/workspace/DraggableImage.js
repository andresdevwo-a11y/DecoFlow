import React, { useEffect } from 'react';
import { StyleSheet, View, Image, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
} from 'react-native-reanimated';
import { COLORS } from '../../constants/Theme';
import ResizeHandle from './ResizeHandle';
import TopHandlesBar from './TopHandlesBar';
import { Portal } from './PortalSystem';

const HANDLE_SIZE = 12;
const SNAP_THRESHOLD = 10; // Pixels to snap - Increased for better stability

export default function DraggableImage({
    id,
    source,
    initialX = 0,
    initialY = 0,
    initialScale = 1,
    initialRotation = 0,
    width = 200,
    height = 200,
    isSelected = false,
    onSelect,
    onInteractionStart,
    onInteractionEnd,
    onUpdate,
    // Snapping Props (new)
    canvasDimensions = { width: 0, height: 0 },
    guides, // Shared Value {x, y}
    canvasZoom, // Shared Value for zoom level
    otherImages = [],
    onRemove, // New prop for removal
    // Flip props
    flipH = false,
    flipV = false,
    zIndex = 0, // Layer index for stacking order
    isLocked = false, // New prop
    // Group Props
    type = 'image',
    childrenItems = [],
    onLongPress,
}) {
    // Shared Values for transformations
    const translateX = useSharedValue(initialX);
    const translateY = useSharedValue(initialY);
    const scale = useSharedValue(initialScale);
    const rotation = useSharedValue(initialRotation);
    const isInteracting = useSharedValue(false);
    const isDragging = useSharedValue(false); // Track dragging state for hiding handlers

    // Sync SharedValues with props (Critical for Undo/Redo)
    useEffect(() => {
        translateX.value = initialX;
        translateY.value = initialY;
        scale.value = initialScale;
        rotation.value = initialRotation;
    }, [initialX, initialY, initialScale, initialRotation, translateX, translateY, scale, rotation]);

    // Helper to trigger update
    const triggerUpdate = () => {
        'worklet';
        if (onUpdate) {
            runOnJS(onUpdate)({
                id,
                x: translateX.value,
                y: translateY.value,
                scale: scale.value,
                rotation: rotation.value
            });
        }
    };

    // Context for gestures to remember starting values
    const context = useSharedValue({ x: 0, y: 0, scale: 1, rotation: 0 });

    // --- Snapping Logic (Advanced) ---
    const calculateSnap = (proposedX, proposedY) => {
        'worklet';

        const currentScale = scale.value;
        const currentWidth = width * currentScale;
        const currentHeight = height * currentScale;

        // Correct Visual Edges (Center Origin)
        // translateX/Y tracks the Top-Left of the UNROTATED, UNSCALED box.
        // Scale expands from the center.
        const CX = proposedX + width / 2;
        const CY = proposedY + height / 2;

        const L = CX - currentWidth / 2;
        const R = CX + currentWidth / 2;

        const T = CY - currentHeight / 2;
        const B = CY + currentHeight / 2;

        // Final positions
        let finalX = proposedX;
        let finalY = proposedY;
        let guideX = null;
        let guideY = null;

        // --- VERTICAL GUIDES (X-Axis Alignment) ---
        const canvasCW = canvasDimensions.width;
        // Targets: Left (0), Center (W/2), Right (W)
        const canvasTargetsX = [0, canvasCW / 2, canvasCW];

        let bestDiffX = Infinity;
        let bestGuideX = null;

        for (const target of canvasTargetsX) {
            const myPoints = [L, CX, R];
            for (const point of myPoints) {
                const diff = target - point;
                if (Math.abs(diff) < SNAP_THRESHOLD && Math.abs(diff) < Math.abs(bestDiffX)) {
                    bestDiffX = diff;
                    bestGuideX = target;
                }
            }
        }

        if (bestGuideX !== null) {
            finalX += bestDiffX;
            guideX = bestGuideX;
        } else {
            // 2. Snap to Other Images
            let bestImgDiff = Infinity;
            let bestImgGuide = null;

            for (const other of otherImages) {
                if (other.id === id) continue;

                // Other images also need correct Center-based bounds
                const oScale = other.scale;
                const oW = other.width * oScale;
                const oCX = other.x + other.width / 2;
                const oL = oCX - oW / 2;
                const oR = oCX + oW / 2;

                const targets = [oL, oCX, oR];
                const myPoints = [L, CX, R];

                for (const target of targets) {
                    for (const point of myPoints) {
                        const diff = target - point;
                        if (Math.abs(diff) < SNAP_THRESHOLD && Math.abs(diff) < Math.abs(bestImgDiff)) {
                            bestImgDiff = diff;
                            bestImgGuide = target;
                        }
                    }
                }
            }

            if (bestImgGuide !== null) {
                finalX += bestImgDiff;
                guideX = bestImgGuide;
            }
        }

        // --- HORIZONTAL GUIDES (Y-Axis Alignment) ---
        const canvasCH = canvasDimensions.height;
        const canvasTargetsY = [0, canvasCH / 2, canvasCH];

        let bestDiffY = Infinity;
        let bestGuideY = null;

        for (const target of canvasTargetsY) {
            const myPoints = [T, CY, B];
            for (const point of myPoints) {
                const diff = target - point;
                if (Math.abs(diff) < SNAP_THRESHOLD && Math.abs(diff) < Math.abs(bestDiffY)) {
                    bestDiffY = diff;
                    bestGuideY = target;
                }
            }
        }

        if (bestGuideY !== null) {
            finalY += bestDiffY;
            guideY = bestGuideY;
        } else {
            // 2. Snap to Other Images
            let bestImgDiff = Infinity;
            let bestImgGuide = null;

            for (const other of otherImages) {
                if (other.id === id) continue;

                const oScale = other.scale;
                const oH = other.height * oScale;
                const oCY = other.y + other.height / 2;
                const oT = oCY - oH / 2;
                const oB = oCY + oH / 2;

                const targets = [oT, oCY, oB];
                const myPoints = [T, CY, B];

                for (const target of targets) {
                    for (const point of myPoints) {
                        const diff = target - point;
                        if (Math.abs(diff) < SNAP_THRESHOLD && Math.abs(diff) < Math.abs(bestImgDiff)) {
                            bestImgDiff = diff;
                            bestImgGuide = target;
                        }
                    }
                }
            }

            if (bestImgGuide !== null) {
                finalY += bestImgDiff;
                guideY = bestImgGuide;
            }
        }

        // Update guides shared value
        if (guides) {
            guides.value = { x: guideX, y: guideY };
        }

        return { x: finalX, y: finalY };
    };

    // Calculate Scale Snap - Finds the best scale to match edges
    const calculateScaleSnap = (proposedScale) => {
        'worklet';

        let bestScale = proposedScale;
        let guideX = null;
        let guideY = null;
        let minDiff = Infinity;

        // Current Center (Assuming Center doesn't move during resize-from-center transform)
        const CX = translateX.value + width / 2;
        const CY = translateY.value + height / 2;

        // Define function to check scale alignment
        const checkScaleSnap = (targetVal, isX, isCenterSnap) => {
            // If isCenterSnap, it doesn't depend on scale, so we ignore (center is fixed!)
            // We only care about edges: L, R, T, B

            // For X axis: L = CX - (W * S)/2 => S = (CX - L)*2 / W
            //             R = CX + (W * S)/2 => S = (R - CX)*2 / W

            // For Y axis: T = CY - (H * S)/2 => S = (CY - T)*2 / H
            //             B = CY + (H * S)/2 => S = (B - CY)*2 / H

            let candidateScale = -1;

            if (isX) {
                // Try matching Left Edge to Target
                const s1 = (CX - targetVal) * 2 / width;
                // Try matching Right Edge to Target
                const s2 = (targetVal - CX) * 2 / width;
                // We take positive valid scales
                if (s1 > 0 && Math.abs(s1 - proposedScale) < (SNAP_THRESHOLD / width)) { // Threshold normalized
                    return { scale: s1, diff: Math.abs(s1 - proposedScale) };
                }
                if (s2 > 0 && Math.abs(s2 - proposedScale) < (SNAP_THRESHOLD / width)) {
                    return { scale: s2, diff: Math.abs(s2 - proposedScale) };
                }
            } else {
                const s1 = (CY - targetVal) * 2 / height;
                const s2 = (targetVal - CY) * 2 / height;
                if (s1 > 0 && Math.abs(s1 - proposedScale) < (SNAP_THRESHOLD / height)) {
                    return { scale: s1, diff: Math.abs(s1 - proposedScale) };
                }
                if (s2 > 0 && Math.abs(s2 - proposedScale) < (SNAP_THRESHOLD / height)) {
                    return { scale: s2, diff: Math.abs(s2 - proposedScale) };
                }
            }
            return null;
        };

        // 1. Canvas Edges
        const canvasCW = canvasDimensions.width;
        const canvasCH = canvasDimensions.height;

        // Horizontal Snaps (Vertical Guides)
        [0, canvasCW / 2, canvasCW].forEach(target => {
            const res = checkScaleSnap(target, true, false);
            if (res && res.diff < minDiff) {
                minDiff = res.diff;
                bestScale = res.scale;
                guideX = target; // Vertical line at X=target
            }
        });

        // Vertical Snaps (Horizontal Guides)
        [0, canvasCH / 2, canvasCH].forEach(target => {
            const res = checkScaleSnap(target, false, false);
            if (res && res.diff < minDiff) {
                minDiff = res.diff;
                // Prioritize X snap? Or allow both? 
                // If we find a better snap, we overwrite. 
                // Ideally we can snap X and Y independently if possible? 
                // But scale is uniform! We can only satisfy ONE constraint unless they perfectly align.
                // We pick the strongest snap (smallest diff).
                bestScale = res.scale;
                guideY = target;
                guideX = null; // Clear X guide if Y is better
            }
        });

        // 2. Other Images
        for (const other of otherImages) {
            if (other.id === id) continue;
            const oScale = other.scale;
            const oW = other.width * oScale;
            const oH = other.height * oScale;

            // Other Edges
            const oCX = other.x + other.width / 2;
            const oCY = other.y + other.height / 2;
            const oL = oCX - oW / 2;
            const oR = oCX + oW / 2;
            const oT = oCY - oH / 2;
            const oB = oCY + oH / 2;

            [oL, oCX, oR].forEach(target => {
                const res = checkScaleSnap(target, true, false);
                if (res && res.diff < minDiff) {
                    minDiff = res.diff;
                    bestScale = res.scale;
                    guideX = target;
                    guideY = null;
                }
            });

            [oT, oCY, oB].forEach(target => {
                const res = checkScaleSnap(target, false, false);
                if (res && res.diff < minDiff) {
                    minDiff = res.diff;
                    bestScale = res.scale;
                    guideY = target;
                    guideX = null;
                }
            });
        }

        if (guides) {
            guides.value = { x: guideX, y: guideY };
        }

        return bestScale;
    };


    // --- Gestures ---

    // TAP Gesture: Selects the image (Even if locked, users might want to select it to see it's locked in panel)
    const tapGesture = Gesture.Tap()
        .onStart(() => {
            if (onSelect) {
                runOnJS(onSelect)(id);
            }
        });

    // PAN Gesture: Moves the image
    const panGesture = Gesture.Pan()
        .enabled(!isLocked) // Disable when locked
        .averageTouches(true) // Ensure accurate delta from multiple fingers
        .onStart(() => {
            context.value = { ...context.value, x: translateX.value, y: translateY.value };
            isInteracting.value = true;
            isDragging.value = true; // Hide handlers during drag
            if (onSelect) runOnJS(onSelect)(id);
            if (onInteractionStart) runOnJS(onInteractionStart)();
        })
        .onUpdate((event) => {
            // Apply zoom factor correction!
            const zoom = canvasZoom ? canvasZoom.value : 1;

            const rawX = context.value.x + (event.translationX / zoom);
            const rawY = context.value.y + (event.translationY / zoom);

            // Apply Snapping
            const snapped = calculateSnap(rawX, rawY);

            translateX.value = snapped.x;
            translateY.value = snapped.y;
        })
        .onEnd(() => {
            isInteracting.value = false;
            isDragging.value = false; // Show handlers again
            if (guides) guides.value = { x: null, y: null }; // Hide guides
            if (onInteractionEnd) runOnJS(onInteractionEnd)();

            // Check for out of bounds removal
            if (onRemove && canvasDimensions.width > 0 && canvasDimensions.height > 0) {
                const currentScale = scale.value;
                const currentWidth = width * currentScale;
                const currentHeight = height * currentScale;
                const x = translateX.value;
                const y = translateY.value;

                // Check if completely outside
                const isOutsideRight = x > canvasDimensions.width;
                const isOutsideBottom = y > canvasDimensions.height;
                const isOutsideLeft = (x + currentWidth) < 0;
                const isOutsideTop = (y + currentHeight) < 0;

                if (isOutsideRight || isOutsideBottom || isOutsideLeft || isOutsideTop) {
                    runOnJS(onRemove)(id);
                    return; // Skip update trigger if removing
                }
            }

            triggerUpdate();
        });

    // PINCH Gesture: Scales the image
    const pinchGesture = Gesture.Pinch()
        .enabled(!isLocked) // Disable when locked
        .onStart(() => {
            context.value = { ...context.value, scale: scale.value };
            isInteracting.value = true;
            if (onSelect) runOnJS(onSelect)(id);
            if (onInteractionStart) runOnJS(onInteractionStart)();
        })
        .onUpdate((event) => {
            scale.value = context.value.scale * event.scale;
        })
        .onEnd(() => {
            isInteracting.value = false;
            if (onInteractionEnd) runOnJS(onInteractionEnd)();
            triggerUpdate();
        });

    // ROTATION Gesture: Rotates the image
    const rotationGesture = Gesture.Rotation()
        .enabled(!isLocked) // Disable when locked
        .onStart(() => {
            context.value = { ...context.value, rotation: rotation.value };
            isInteracting.value = true;
            if (onSelect) runOnJS(onSelect)(id);
            if (onInteractionStart) runOnJS(onInteractionStart)();
        })
        .onUpdate((event) => {
            rotation.value = context.value.rotation + event.rotation;
        })
        .onEnd(() => {
            isInteracting.value = false;
            if (onInteractionEnd) runOnJS(onInteractionEnd)();
            triggerUpdate();
        });

    // LONG PRESS Gesture: Triggers selection mode
    const longPressGesture = Gesture.LongPress()
        .onStart(() => {
            if (onLongPress) {
                runOnJS(onLongPress)(id);
            }
        });

    // Combine gestures
    const composedGesture = Gesture.Simultaneous(
        tapGesture,
        panGesture,
        pinchGesture,
        rotationGesture,
        longPressGesture
    );

    // Animated Style
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: scale.value },
                { rotate: `${rotation.value}rad` }, // Rotation gesture returns radians
                { scaleX: flipH ? -1 : 1 }, // Horizontal flip
                { scaleY: flipV ? -1 : 1 }, // Vertical flip
            ],
            zIndex: isInteracting.value ? zIndex + 9999 : zIndex,
        };
    });

    // --- Resize Logic ---
    const startScale = useSharedValue(1);
    const startTouchX = useSharedValue(0);
    const startTouchY = useSharedValue(0);

    const isResizing = useSharedValue(false);
    // null | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'rotation'
    const activeHandle = useSharedValue(null);

    // Get the direction vector for each handle (pointing outward from center)
    const getHandleDirection = (handleId) => {
        'worklet';
        switch (handleId) {
            case 'topLeft':
                return { x: -1, y: -1 };
            case 'topRight':
                return { x: 1, y: -1 };
            case 'bottomLeft':
                return { x: -1, y: 1 };
            case 'bottomRight':
                return { x: 1, y: 1 };
            default:
                return { x: 1, y: 1 };
        }
    };

    const onResizeStart = (handleId, event) => {
        'worklet';
        startScale.value = scale.value;
        isResizing.value = true;
        activeHandle.value = handleId;
        isInteracting.value = true;

        // Store the starting touch position
        startTouchX.value = event.absoluteX;
        startTouchY.value = event.absoluteY;

        if (onInteractionStart) runOnJS(onInteractionStart)();
    };

    const onResizeEnd = () => {
        'worklet';
        isResizing.value = false;
        activeHandle.value = null;
        isInteracting.value = false;
        if (onInteractionEnd) runOnJS(onInteractionEnd)();
        triggerUpdate();
    };

    const handleResizeUpdate = (event) => {
        'worklet';
        if (!activeHandle.value) return;

        // Get the direction vector for the current handle (local unrotated space)
        const direction = getHandleDirection(activeHandle.value);

        // Rotate the direction vector to match the image's current rotation
        const rot = rotation.value;
        const cos = Math.cos(rot);
        const sin = Math.sin(rot);

        // Apply rotation matrix
        const rotatedDirX = direction.x * cos - direction.y * sin;
        const rotatedDirY = direction.x * sin + direction.y * cos;

        // Calculate the movement delta from start position
        // Also correct for zoom here!
        const zoom = canvasZoom ? canvasZoom.value : 1;
        const deltaX = (event.absoluteX - startTouchX.value) / zoom;
        const deltaY = (event.absoluteY - startTouchY.value) / zoom;

        // Project the movement onto the handle's outward direction (rotated)
        const projection = (deltaX * rotatedDirX + deltaY * rotatedDirY);

        // Normalize by a sensible factor for smooth scaling
        // We use the diagonal of the image as reference
        const diagonal = Math.hypot(width, height);
        const scaleSensitivity = 2; // Sensitivity multiplier
        const scaleDelta = (projection / diagonal) * scaleSensitivity;

        // Apply the scale change
        let newScale = startScale.value + (startScale.value * scaleDelta);

        // Clamp min scale
        newScale = Math.max(0.1, newScale);

        // SNAP SCALE
        newScale = calculateScaleSnap(newScale);

        scale.value = newScale;
    };

    // Wrap onResizeStart for each corner to ensure they run on UI thread
    const onResizeStartTopLeft = (event) => {
        'worklet';
        onResizeStart('topLeft', event);
    };
    const onResizeStartTopRight = (event) => {
        'worklet';
        onResizeStart('topRight', event);
    };
    const onResizeStartBottomLeft = (event) => {
        'worklet';
        onResizeStart('bottomLeft', event);
    };
    const onResizeStartBottomRight = (event) => {
        'worklet';
        onResizeStart('bottomRight', event);
    };

    // All corners use the same update handler now since we use absolute coordinates
    const onResizeTopLeft = (e) => {
        'worklet';
        handleResizeUpdate(e);
    };
    const onResizeTopRight = (e) => {
        'worklet';
        handleResizeUpdate(e);
    };
    const onResizeBottomLeft = (e) => {
        'worklet';
        handleResizeUpdate(e);
    };
    const onResizeBottomRight = (e) => {
        'worklet';
        handleResizeUpdate(e);
    };

    // --- Rotation Logic ---
    const startRotation = useSharedValue(0);
    const startAngle = useSharedValue(0);
    // Store the calculated center of the image in screen coordinates
    const centerScreenX = useSharedValue(0);
    const centerScreenY = useSharedValue(0);

    const onRotateStart = (event) => {
        'worklet';
        startRotation.value = rotation.value;
        activeHandle.value = 'rotation';
        isInteracting.value = true;

        const touchX = event.absoluteX;
        const touchY = event.absoluteY;

        // Calculate the distance from center to handle
        // We need to account for visual zoom here too if we want perfect center calculation?
        // Wait, event.absoluteX is screen space.
        // We need to calculate the center of the image in SCREEN SPACE to get the angle right.

        // This is complex because we don't track screen position of image directly.
        // But for rotation, angle is invariant to uniform scale.
        // As long as we use screen coords for touch and approximate center, it's fine.
        // Better: Use `context` or `measure`? No `measure` in UI thread cleanly.

        // Let's stick to the previous approximation but be aware it might drift if zoomed.
        // Actually, vector logic is scale invariant for angles.
        // But we need the CENTER in screen space.

        // Simple fix: We know where we touched (Handle).
        // We know the vector from Center to Handle in LOCAL space.
        // We can rotate/scale that vector to Screen Space and subtract from Touch to get Center.

        const zoom = canvasZoom ? canvasZoom.value : 1;
        const currentS = scale.value * zoom; // Visual scale on screen
        const distFromCenter = ((height * scale.value / 2) + 40) * zoom; // Visual distance on screen

        const r = rotation.value;
        const vecX = distFromCenter * Math.sin(r);
        const vecY = -distFromCenter * Math.cos(r);

        // Center = Touch - Vector
        const calculatedCenterX = touchX - vecX;
        const calculatedCenterY = touchY - vecY;

        centerScreenX.value = calculatedCenterX;
        centerScreenY.value = calculatedCenterY;

        // Calculate initial angle from calculated center
        startAngle.value = Math.atan2(touchY - calculatedCenterY, touchX - calculatedCenterX);

        if (onInteractionStart) runOnJS(onInteractionStart)();
    };

    const onRotateEnd = () => {
        'worklet';
        activeHandle.value = null;
        isInteracting.value = false;
        if (onInteractionEnd) runOnJS(onInteractionEnd)();
        triggerUpdate();
    };

    const onRotateUpdate = (event) => {
        'worklet';
        const touchX = event.absoluteX;
        const touchY = event.absoluteY;

        // Use the captured center
        const cx = centerScreenX.value;
        const cy = centerScreenY.value;

        // Current angle
        const currentAngle = Math.atan2(touchY - cy, touchX - cx);

        // Delta
        const deltaAngle = currentAngle - startAngle.value;

        rotation.value = startRotation.value + deltaAngle;
    };

    // --- Handle Move Logic (for small images) ---
    const handleMoveContext = useSharedValue({ x: 0, y: 0 });

    const onHandleMoveStart = (event) => {
        'worklet';
        handleMoveContext.value = { x: translateX.value, y: translateY.value };
        isInteracting.value = true;
        if (onInteractionStart) runOnJS(onInteractionStart)();
    };

    const onHandleMoveUpdate = (event) => {
        'worklet';
        const zoom = canvasZoom ? canvasZoom.value : 1;
        const rawX = handleMoveContext.value.x + (event.translationX / zoom);
        const rawY = handleMoveContext.value.y + (event.translationY / zoom);

        // Apply Snapping
        const snapped = calculateSnap(rawX, rawY);

        translateX.value = snapped.x;
        translateY.value = snapped.y;
    };

    const onHandleMoveEnd = () => {
        'worklet';
        isInteracting.value = false;
        if (guides) guides.value = { x: null, y: null };
        if (onInteractionEnd) runOnJS(onInteractionEnd)();

        // Check for out of bounds removal (Duplicated from panGesture)
        if (onRemove && canvasDimensions.width > 0 && canvasDimensions.height > 0) {
            const currentScale = scale.value;
            const currentWidth = width * currentScale;
            const currentHeight = height * currentScale;
            const x = translateX.value;
            const y = translateY.value;

            // Check if completely outside
            const isOutsideRight = x > canvasDimensions.width;
            const isOutsideBottom = y > canvasDimensions.height;
            const isOutsideLeft = (x + currentWidth) < 0;
            const isOutsideTop = (y + currentHeight) < 0;

            if (isOutsideRight || isOutsideBottom || isOutsideLeft || isOutsideTop) {
                runOnJS(onRemove)(id);
                return; // Skip update trigger if removing
            }
        }

        triggerUpdate();
    };

    // Style for the selection border to maintain constant visual width
    const borderStyle = useAnimatedStyle(() => {
        const currentScale = scale.value === 0 ? 0.001 : scale.value;
        const currentCanvasZoom = canvasZoom && canvasZoom.value ? canvasZoom.value : 1;
        const effectiveScale = currentScale * currentCanvasZoom;
        return {
            borderWidth: 2.5 / effectiveScale, // Maintain constant 2.5px width visually
        };
    });

    const overlayStyle = useAnimatedStyle(() => {
        return {
            zIndex: (isInteracting.value ? zIndex + 9999 : zIndex) + 10000,
        };
    });

    return (
        <>
            {/* Layer 1: Image Content (Clipped) */}
            <Portal hostName="clipped-layer">
                <Animated.View
                    style={[
                        styles.container,
                        { width, height },
                        animatedStyle,
                        // Remove manual zIndex override here, let animatedStyle handle it
                    ]}
                    pointerEvents="none"
                >
                    {type === 'group' ? (
                        <View style={{ flex: 1 }}>
                            {childrenItems && childrenItems.map((child, idx) => (
                                <Image
                                    key={child.id || idx}
                                    source={child.source}
                                    style={{
                                        position: 'absolute',
                                        left: child.x,
                                        top: child.y,
                                        width: child.width,
                                        height: child.height,
                                        transform: [
                                            { rotate: `${child.rotation || 0}rad` },
                                            { scaleX: child.flipH ? -1 : 1 },
                                            { scaleY: child.flipV ? -1 : 1 }
                                        ]
                                    }}
                                    resizeMode="cover"
                                />
                            ))}
                        </View>
                    ) : (
                        <Image
                            source={source}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    )}
                </Animated.View>
            </Portal>

            {/* Layer 2: Overlay Controls (visible outside canvas) */}
            <Portal hostName="overlay-layer">
                <GestureDetector gesture={composedGesture}>
                    <Animated.View
                        style={[
                            styles.container,
                            { width, height },
                            animatedStyle,
                            overlayStyle
                        ]}
                    >
                        {/* Hitbox */}
                        <View style={StyleSheet.absoluteFill} />

                        {isSelected && !isLocked && (
                            <View style={[StyleSheet.absoluteFill, styles.selectionOverlay]}>
                                <Animated.View style={[styles.border, borderStyle]} />

                                <ResizeHandle
                                    style={styles.topLeft}
                                    id="topLeft"
                                    activeHandle={activeHandle}
                                    onDragStart={onResizeStartTopLeft}
                                    onDragEnd={onResizeEnd}
                                    onDragUpdate={onResizeTopLeft}
                                    scale={scale}
                                    canvasZoom={canvasZoom}
                                    isDragging={isDragging}
                                />
                                <ResizeHandle
                                    style={styles.topRight}
                                    id="topRight"
                                    activeHandle={activeHandle}
                                    onDragStart={onResizeStartTopRight}
                                    onDragEnd={onResizeEnd}
                                    onDragUpdate={onResizeTopRight}
                                    scale={scale}
                                    canvasZoom={canvasZoom}
                                    isDragging={isDragging}
                                />
                                <ResizeHandle
                                    style={styles.bottomLeft}
                                    id="bottomLeft"
                                    activeHandle={activeHandle}
                                    onDragStart={onResizeStartBottomLeft}
                                    onDragEnd={onResizeEnd}
                                    onDragUpdate={onResizeBottomLeft}
                                    scale={scale}
                                    canvasZoom={canvasZoom}
                                    isDragging={isDragging}
                                />
                                <ResizeHandle
                                    style={styles.bottomRight}
                                    id="bottomRight"
                                    activeHandle={activeHandle}
                                    onDragStart={onResizeStartBottomRight}
                                    onDragEnd={onResizeEnd}
                                    onDragUpdate={onResizeBottomRight}
                                    scale={scale}
                                    canvasZoom={canvasZoom}
                                    isDragging={isDragging}
                                />

                                <TopHandlesBar
                                    onRotateStart={onRotateStart}
                                    onRotateUpdate={onRotateUpdate}
                                    onRotateEnd={onRotateEnd}
                                    onMoveStart={onHandleMoveStart}
                                    onMoveUpdate={onHandleMoveUpdate}
                                    onMoveEnd={onHandleMoveEnd}
                                    scale={scale}
                                    canvasZoom={canvasZoom}
                                    isResizing={isResizing}
                                    isDragging={isDragging}
                                    imageWidth={width}
                                    imageHeight={height}
                                />
                            </View>
                        )}
                        {isSelected && isLocked && (
                            // Optional: Visual feedback for locked state (e.g. gray border)
                            <View style={[StyleSheet.absoluteFill, styles.selectionOverlay]}>
                                <Animated.View style={[styles.border, { borderColor: '#9CA3AF', borderWidth: 1 }]} />
                            </View>
                        )}
                    </Animated.View>
                </GestureDetector>
            </Portal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        // Removed left/top as they are handled by transforms now, 
        // OR the parent should position the initial placement.
        // For draggable, better to control position via transform or parent layout.
        // But here we use 'absolute' so it floats.
    },
    image: {
        width: '100%',
        height: '100%',
    },
    selectionOverlay: {
        zIndex: 999,
    },
    border: {
        ...StyleSheet.absoluteFillObject,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    handle: {
        width: HANDLE_SIZE,
        height: HANDLE_SIZE,
        borderRadius: HANDLE_SIZE / 2,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: COLORS.primary,
        position: 'absolute',
    },
    topLeft: {
        top: -22,
        left: -22,
    },
    topRight: {
        top: -22,
        right: -22,
    },
    bottomLeft: {
        bottom: -22,
        left: -22,
    },
    bottomRight: {
        bottom: -22,
        right: -22,
    },
});
