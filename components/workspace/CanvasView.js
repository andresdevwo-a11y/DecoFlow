import React, { useState, forwardRef, useImperativeHandle, useRef, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useSharedValue, useAnimatedStyle, useAnimatedReaction } from 'react-native-reanimated';
import { captureRef } from 'react-native-view-shot';
import DraggableImage from './DraggableImage';

import useCanvasGestures from '../../hooks/useCanvasGestures';
import { COLORS } from '../../constants/Theme';
import { PortalProvider, PortalHost } from './PortalSystem';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Default canvas settings
const DEFAULT_CANVAS_SETTINGS = {
    width: 1080,
    height: 1080,
    backgroundColor: '#FFFFFF',
    showGrid: false,
    snapToGrid: false,
    gridSize: 20,
};

const CanvasView = forwardRef(({
    images = [],
    selectedImageId,
    selectedImageIds = [], // NEW
    onSelectImage,
    onLongPress, // NEW
    onUpdateImage,
    onRemoveImage,
    canvasSettings = DEFAULT_CANVAS_SETTINGS,
    onZoomChange, // New prop for reporting zoom level
}, ref) => {
    // Merge with defaults
    const settings = { ...DEFAULT_CANVAS_SETTINGS, ...canvasSettings };

    // Canvas gestures (pan/zoom the whole workspace)
    const { composedGesture, animatedStyle, scale, setZoom, setPan, translateX, translateY } = useCanvasGestures();

    // Canvas Dimensions for snapping to center
    const [canvasDimensions, setCanvasDimensions] = useState({
        width: settings.width || SCREEN_WIDTH,
        height: settings.height || SCREEN_HEIGHT
    });

    // Report viewport changes to parent (throttled/reactive)
    useAnimatedReaction(
        () => ({ scale: scale.value, x: translateX.value, y: translateY.value }),
        (current, previous) => {
            if (onZoomChange) {
                // We pass the full object now if structure changed, or just scale if strict.
                // But plan says we want to pass {scale, x, y}.
                // Let's pass the object. Parent needs to handle it.
                // If parent expects just a number, this might break.
                // Let's check parent usage later, but for now we pass Object as 2nd arg or modify contract?
                // The prop is named 'onZoomChange'. Let's keep it but pass object?
                // Better: keep 1st arg as scale for compat, 2nd as object.
                runOnJS(onZoomChange)(current.scale, current);
            }
        }
    );

    // Ref for the content layer to capture
    const contentRef = useRef();

    // Expose capture method and zoom control
    useImperativeHandle(ref, () => ({
        capture: async () => {
            try {
                const uri = await captureRef(contentRef, {
                    format: 'jpg',
                    quality: 0.8,
                    result: 'tmpfile'
                });
                return uri;
            } catch (error) {
                console.error("Snapshot failed", error);
                return null;
            }
        },
        setZoom: (level) => {
            setZoom(level);
        },
        setViewport: ({ x, y, scale: newScale }) => {
            if (newScale !== undefined) setZoom(newScale);
            if (x !== undefined && y !== undefined) setPan(x, y);
        },
        getViewport: () => {
            return {
                x: translateX.value,
                y: translateY.value,
                scale: scale.value
            };
        }
    }));

    // Shared Value for Guides: { x: null | number, y: null | number }
    // x = vertical guide position, y = horizontal guide position
    const guides = useSharedValue({ x: null, y: null });

    // Generate grid cells - memoized for performance
    const gridCells = useMemo(() => {
        if (!settings.showGrid) return null;

        const gridSize = settings.gridSize || 20;
        // Use settings dimensions instead of screen dimensions
        const width = settings.width || SCREEN_WIDTH;
        const height = settings.height || SCREEN_HEIGHT;

        const cols = Math.ceil(width / gridSize) + 1;
        const rows = Math.ceil(height / gridSize) + 1;

        const cells = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                cells.push({
                    key: `${row}-${col}`,
                    x: col * gridSize,
                    y: row * gridSize,
                    isMajor: (row % 5 === 0 && col % 5 === 0),
                });
            }
        }
        return cells;
    }, [settings.showGrid, settings.gridSize, settings.width, settings.height]);

    const handleSelectImage = (id) => {
        if (onSelectImage) {
            onSelectImage(id);
        }
    };

    const handleUpdateImage = (update) => {
        if (onUpdateImage) {
            onUpdateImage(update);
        }
    };

    const handleRemoveImage = (id) => {
        if (onRemoveImage) {
            onRemoveImage(id);
        }
    };

    const handleCanvasTap = () => {
        // Deselect if tapping empty space
        if (onSelectImage) {
            onSelectImage(null);
        }
    };

    // Background specific tap to deselect
    const backgroundTap = Gesture.Tap()
        .maxDuration(250)
        .onEnd(() => {
            runOnJS(handleCanvasTap)();
        });

    const verticalGuideStyle = useAnimatedStyle(() => ({
        display: guides.value.x !== null ? 'flex' : 'none',
        left: guides.value.x || 0,
        height: '100%',
        width: 3, // Increased from 2px for better visibility
        position: 'absolute',
        backgroundColor: '#FF4081', // Magenta/pink for high visibility
        zIndex: 9999,
        opacity: 0.9,
        // Shadow for depth - made stronger
        shadowColor: '#FF4081',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
    }));

    const horizontalGuideStyle = useAnimatedStyle(() => ({
        display: guides.value.y !== null ? 'flex' : 'none',
        top: guides.value.y || 0,
        width: '100%',
        height: 3, // Increased from 2px
        position: 'absolute',
        backgroundColor: '#FF4081',
        zIndex: 9999,
        opacity: 0.9,
        shadowColor: '#FF4081',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
    }));

    // Collect all image layouts for inter-object snapping
    // In a real optimized app, updating this on every render might be slow if many objects,
    // but for < 50 items it's fine. We simply pass the array of current "static" positions.
    // The active dragging item will ignore itself in the logic.
    // CRITICAL (Updated): Filter out hidden images AND locked images so we only snap to interactable layers
    const otherImages = images
        .filter(img => img.visible !== false && !img.locked)
        .map(img => ({
            id: img.id,
            x: img.x,
            y: img.y,
            width: img.width,
            height: img.height,
            scale: img.scale || 1,
            rotation: img.rotation || 0,
        }));

    // Render grid pattern
    const renderGrid = () => {
        if (!settings.showGrid || !gridCells) return null;

        const gridSize = settings.gridSize || 20;
        const width = settings.width || SCREEN_WIDTH;
        const height = settings.height || SCREEN_HEIGHT;

        return (
            <View style={styles.gridContainer} pointerEvents="none">
                {/* Horizontal lines */}
                {Array.from({ length: Math.ceil(height / gridSize) + 1 }).map((_, i) => (
                    <View
                        key={`h-${i}`}
                        style={[
                            styles.gridLineHorizontal,
                            {
                                top: i * gridSize,
                                backgroundColor: i % 5 === 0 ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.05)',
                                height: i % 5 === 0 ? 1 : 0.5,
                                width: width, // Limit width of line
                            }
                        ]}
                    />
                ))}
                {/* Vertical lines */}
                {Array.from({ length: Math.ceil(width / gridSize) + 1 }).map((_, i) => (
                    <View
                        key={`v-${i}`}
                        style={[
                            styles.gridLineVertical,
                            {
                                left: i * gridSize,
                                backgroundColor: i % 5 === 0 ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.05)',
                                width: i % 5 === 0 ? 1 : 0.5,
                                height: height, // Limit height of line
                            }
                        ]}
                    />
                ))}
            </View>
        );
    };

    return (
        <PortalProvider>
            <View style={styles.container}>
                {/*
                    GestureDetector wraps the entire container so we can pan even when dragging outside
                    the canvas area.
                */}
                <GestureDetector gesture={composedGesture}>
                    <View style={styles.gestureArea}>
                        {/* The animated canvas that moves/zooms */}
                        <Animated.View
                            style={[
                                styles.canvas,
                                animatedStyle,
                                {
                                    backgroundColor: settings.backgroundColor,
                                    width: settings.width || '100%',
                                    height: settings.height || '100%',
                                    // Add shadow for better visibility of the "paper"
                                    shadowColor: "#000",
                                    shadowOffset: {
                                        width: 0,
                                        height: 2,
                                    },
                                    shadowOpacity: 0.25,
                                    shadowRadius: 3.84,
                                    elevation: 5,
                                }
                            ]}
                        >
                            {/* Capture Target: Background + Images */}
                            <View
                                ref={contentRef}
                                style={StyleSheet.absoluteFill}
                                collapsable={false}
                                onLayout={(e) => {
                                    const { width, height } = e.nativeEvent.layout;
                                    setCanvasDimensions({ width, height });
                                }}
                            >
                                {/* 1. Background Layer */}
                                <View style={[StyleSheet.absoluteFill, { backgroundColor: settings.backgroundColor }]} />

                                {/* 2. Content Layer (Images) */}
                                <View style={{ flex: 1, overflow: 'hidden' }}>
                                    <PortalHost name="clipped-layer" style={{ flex: 1 }} />
                                </View>
                            </View>

                            {/* --- NON-CAPTURED UI ELEMENTS --- */}

                            {/* Grid Overlay */}
                            {renderGrid()}

                            {/* Background Tap Listener */}
                            <GestureDetector gesture={backgroundTap}>
                                <View style={StyleSheet.absoluteFill} />
                            </GestureDetector>

                            {/* Guides */}
                            <Animated.View style={verticalGuideStyle} pointerEvents="none" />
                            <Animated.View style={horizontalGuideStyle} pointerEvents="none" />

                            {/* Overlay Layer (Selection Borders & Handles) */}
                            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                                <PortalHost name="overlay-layer" style={{ flex: 1 }} pointerEvents="box-none" />
                            </View>

                            {/* Logic Mounters (Invisible) */}
                            {images.map((img, index) => {
                                if (img.type === 'text') return null;
                                if (img.visible === false) return null; // Skip hidden images

                                return (
                                    <DraggableImage
                                        key={img.id}
                                        id={img.id}
                                        source={img.source}
                                        flipH={img.flipH}
                                        flipV={img.flipV}
                                        isSelected={selectedImageIds && selectedImageIds.length > 0 ? selectedImageIds.includes(img.id) : selectedImageId === img.id}
                                        onSelect={handleSelectImage}
                                        onLongPress={onLongPress}
                                        onUpdate={handleUpdateImage}
                                        onRemove={handleRemoveImage}
                                        width={img.width}
                                        height={img.height}
                                        // Group Props
                                        type={img.type || 'image'}
                                        childrenItems={img.children}
                                        // End Group Props
                                        initialX={img.x}
                                        initialY={img.y}
                                        initialRotation={img.rotation}
                                        initialScale={img.scale || 1}
                                        // Snapping Props
                                        canvasDimensions={canvasDimensions}
                                        guides={guides}
                                        canvasZoom={scale}
                                        zIndex={index}
                                        otherImages={otherImages}
                                        isLocked={img.locked} // Pass locked state
                                    />
                                );
                            })}
                        </Animated.View>
                    </View>
                </GestureDetector>
            </View>
        </PortalProvider>
    );
});

export default CanvasView;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E8E8E8', // Light gray workspace background
        overflow: 'hidden',
    },
    gestureArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden', // Ensure we don't see things flying off too far if unwanted
    },
    canvas: {
        // Dimensions set via inline styles based on props
        // Centered by parent gestureArea
    },
    contentContainer: {
        // flex: 1, // Removed flex:1 as width/height are now explicit on parent Animated.View
        width: '100%',
        height: '100%',
    },
    // Grid pattern styles
    gridContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
        zIndex: 1,
    },
    gridLineHorizontal: {
        position: 'absolute',
        left: 0,
        right: 0,
    },
    gridLineVertical: {
        position: 'absolute',
        top: 0,
        bottom: 0,
    },
    gridRow: {
        flexDirection: 'row',
    },
    gridCell: {
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
    },
    gridCellMajor: {
        borderColor: 'rgba(0,0,0,0.08)',
    },
});
