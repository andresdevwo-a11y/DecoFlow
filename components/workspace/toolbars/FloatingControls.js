import React from 'react';
import {
    View,
    TouchableOpacity,
    Text,
    StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, RADIUS, SIZES, SPACING } from '../../../constants/Theme';

export default function FloatingControls({
    panelWidth = 64,
    zoomLevel = 100,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
    style,
}) {
    const insets = useSafeAreaInsets();
    const topOffset = insets.top + SIZES.headerHeight + 16;

    return (
        <View style={[styles.container, style]} pointerEvents="box-none">
            {/* Undo/Redo Controls - Fixed position */}
            <View style={[styles.undoRedoContainer, { top: topOffset }]}>
                <TouchableOpacity
                    style={[
                        styles.smallButton,
                        !canUndo && styles.buttonDisabled
                    ]}
                    onPress={onUndo}
                    disabled={!canUndo}
                    activeOpacity={0.7}
                >
                    <Feather
                        name="rotate-ccw"
                        size={18}
                        color={canUndo ? COLORS.primary : COLORS.placeholder}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.smallButton,
                        !canRedo && styles.buttonDisabled
                    ]}
                    onPress={onRedo}
                    disabled={!canRedo}
                    activeOpacity={0.7}
                >
                    <Feather
                        name="rotate-cw"
                        size={18}
                        color={canRedo ? COLORS.primary : COLORS.placeholder}
                    />
                </TouchableOpacity>
            </View>

            {/* Zoom Controls - Bottom Right */}
            <View style={[
                styles.zoomContainer,
                { bottom: SIZES.navBarHeight + insets.bottom + 80 } // Lifted well above navbar and toolbar
            ]}>
                <TouchableOpacity
                    style={styles.zoomButton}
                    onPress={onZoomIn}
                    activeOpacity={0.7}
                >
                    <Feather name="plus" size={20} color={COLORS.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.zoomLevelButton}
                    onPress={onZoomReset}
                    activeOpacity={0.7}
                >
                    <Text style={styles.zoomText}>{Math.round(zoomLevel)}%</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.zoomButton}
                    onPress={onZoomOut}
                    activeOpacity={0.7}
                >
                    <Feather name="minus" size={20} color={COLORS.primary} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'space-between',
        zIndex: 180,
    },
    undoRedoContainer: {
        position: 'absolute',
        right: 16,
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: 4,
        ...SHADOWS.md,
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
    },
    smallButton: {
        width: 36,
        height: 36,
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    zoomContainer: {
        position: 'absolute',
        // bottom: moved to inline style
        right: 16,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: 4,
        ...SHADOWS.md,
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
    },
    zoomButton: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    zoomLevelButton: {
        width: 40,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: COLORS.border,
    },
    zoomText: {
        color: COLORS.text,
        fontSize: 11,
        fontWeight: '600',
    },
});
