import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Grid configuration
const GRID_SIZE = 20; // Size of each grid cell in pixels
const DOT_SIZE = 3; // Size of grid dots
const DOT_COLOR = 'rgba(0,0,0,0.06)'; // Subtle gray dots
const MAJOR_DOT_COLOR = 'rgba(0,0,0,0.12)'; // More visible for major intersections
const MAJOR_INTERVAL = 5; // Every 5th dot is a major dot

/**
 * GridPattern - A subtle dot grid pattern for the canvas background
 * Creates a professional "design tool" feel similar to Figma/Canva
 * Uses pure React Native Views (no SVG dependency)
 */
export default function GridPattern({
    width = SCREEN_WIDTH,
    height = SCREEN_HEIGHT,
    gridSize = GRID_SIZE,
    dotSize = DOT_SIZE,
    dotColor = DOT_COLOR,
    majorDotColor = MAJOR_DOT_COLOR,
    majorInterval = MAJOR_INTERVAL,
    style,
}) {
    // Calculate number of dots needed
    const cols = Math.ceil(width / gridSize) + 1;
    const rows = Math.ceil(height / gridSize) + 1;

    // Generate dots using useMemo for performance
    const dots = useMemo(() => {
        const result = [];
        for (let row = 0; row < rows; row++) {
            const rowDots = [];
            for (let col = 0; col < cols; col++) {
                const isMajor = row % majorInterval === 0 && col % majorInterval === 0;
                rowDots.push({
                    key: `${row}-${col}`,
                    size: isMajor ? dotSize * 1.5 : dotSize,
                    color: isMajor ? majorDotColor : dotColor,
                    left: col * gridSize - dotSize / 2,
                    top: row * gridSize - dotSize / 2,
                });
            }
            result.push({ key: `row-${row}`, dots: rowDots });
        }
        return result;
    }, [cols, rows, gridSize, dotSize, dotColor, majorDotColor, majorInterval]);

    return (
        <View style={[styles.container, { width, height }, style]} pointerEvents="none">
            {dots.map(row => (
                row.dots.map(dot => (
                    <View
                        key={dot.key}
                        style={[
                            styles.dot,
                            {
                                width: dot.size,
                                height: dot.size,
                                borderRadius: dot.size / 2,
                                backgroundColor: dot.color,
                                left: dot.left,
                                top: dot.top,
                            }
                        ]}
                    />
                ))
            ))}
        </View>
    );
}

/**
 * GridPatternSimple - Even more lightweight version
 * Shows just major grid lines for better performance
 */
export function GridPatternSimple({
    style,
    gridSize = 100,
    lineColor = 'rgba(0,0,0,0.05)',
}) {
    return (
        <View style={[styles.container, style]} pointerEvents="none">
            {/* This is a placeholder - in a real implementation you'd use 
                a linear gradient or repeated image pattern */}
            <View style={[styles.simpleGrid, {
                borderColor: lineColor,
            }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 0,
        overflow: 'hidden',
    },
    dot: {
        position: 'absolute',
    },
    simpleGrid: {
        flex: 1,
        borderWidth: 0.5,
        borderStyle: 'dashed',
    },
});
