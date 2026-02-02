import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, RADIUS } from '../../../constants/Theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Preset canvas sizes
const CANVAS_PRESETS = [
    { id: 'instagram', label: 'Instagram Post', width: 1080, height: 1080 },
    { id: 'story', label: 'Instagram Story', width: 1080, height: 1920 },
    { id: 'facebook', label: 'Facebook Post', width: 1200, height: 630 },
    { id: 'twitter', label: 'Twitter Post', width: 1200, height: 675 },
    { id: 'hd', label: 'HD (1920x1080)', width: 1920, height: 1080 },
    { id: 'custom', label: 'Personalizado', width: null, height: null },
];

// Background color presets
const COLOR_PRESETS = [
    { id: 'white', color: '#FFFFFF', label: 'Blanco' },
    { id: 'black', color: '#000000', label: 'Negro' },
    { id: 'gray', color: '#F3F4F6', label: 'Gris claro' },
    { id: 'dark', color: '#1F2937', label: 'Gris oscuro' },
    { id: 'transparent', color: 'transparent', label: 'Transparente' },
    { id: 'blue', color: '#3B82F6', label: 'Azul' },
    { id: 'purple', color: '#8B5CF6', label: 'Púrpura' },
    { id: 'green', color: '#10B981', label: 'Verde' },
    { id: 'orange', color: '#F59E0B', label: 'Naranja' },
    { id: 'red', color: '#EF4444', label: 'Rojo' },
];

export default function CanvasSettingsModal({
    visible,
    onClose,
    onApply,
    currentSettings = {}
}) {
    const insets = useSafeAreaInsets();

    // Canvas settings state
    const [canvasWidth, setCanvasWidth] = useState(currentSettings.width || 1080);
    const [canvasHeight, setCanvasHeight] = useState(currentSettings.height || 1080);
    const [backgroundColor, setBackgroundColor] = useState(currentSettings.backgroundColor || '#FFFFFF');
    const [showGrid, setShowGrid] = useState(currentSettings.showGrid || false);
    const [snapToGrid, setSnapToGrid] = useState(currentSettings.snapToGrid || false);
    const [gridSize, setGridSize] = useState(currentSettings.gridSize || 20);
    const [selectedPreset, setSelectedPreset] = useState('custom');

    // Sync with current settings when modal opens
    useEffect(() => {
        if (visible) {
            setCanvasWidth(currentSettings.width || 1080);
            setCanvasHeight(currentSettings.height || 1080);
            setBackgroundColor(currentSettings.backgroundColor || '#FFFFFF');
            setShowGrid(currentSettings.showGrid || false);
            setSnapToGrid(currentSettings.snapToGrid || false);
            setGridSize(currentSettings.gridSize || 20);

            // Detect preset
            const preset = CANVAS_PRESETS.find(
                p => p.width === currentSettings.width && p.height === currentSettings.height
            );
            setSelectedPreset(preset?.id || 'custom');
        }
    }, [visible, currentSettings]);

    const handlePresetSelect = (preset) => {
        setSelectedPreset(preset.id);
        if (preset.width && preset.height) {
            setCanvasWidth(preset.width);
            setCanvasHeight(preset.height);
        }
    };

    const handleApply = () => {
        if (onApply) {
            onApply({
                width: parseInt(canvasWidth) || 1080,
                height: parseInt(canvasHeight) || 1080,
                backgroundColor,
                showGrid,
                snapToGrid,
                gridSize: parseInt(gridSize) || 20,
            });
        }
        onClose();
    };

    const renderSection = (title, children) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {children}
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Ajustes del Canvas</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                        >
                            <Feather name="x" size={24} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Canvas Size Presets */}
                        {renderSection('Tamaño del Canvas', (
                            <View>
                                <View style={styles.presetsGrid}>
                                    {CANVAS_PRESETS.map((preset) => (
                                        <TouchableOpacity
                                            key={preset.id}
                                            style={[
                                                styles.presetButton,
                                                selectedPreset === preset.id && styles.presetButtonActive
                                            ]}
                                            onPress={() => handlePresetSelect(preset)}
                                        >
                                            <Text style={[
                                                styles.presetLabel,
                                                selectedPreset === preset.id && styles.presetLabelActive
                                            ]}>
                                                {preset.label}
                                            </Text>
                                            {preset.width && (
                                                <Text style={[
                                                    styles.presetSize,
                                                    selectedPreset === preset.id && styles.presetSizeActive
                                                ]}>
                                                    {preset.width}×{preset.height}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Custom Size Inputs */}
                                <View style={styles.customSizeContainer}>
                                    <View style={styles.sizeInputGroup}>
                                        <Text style={styles.inputLabel}>Ancho (px)</Text>
                                        <TextInput
                                            style={styles.sizeInput}
                                            value={String(canvasWidth)}
                                            onChangeText={(text) => {
                                                setCanvasWidth(text.replace(/[^0-9]/g, ''));
                                                setSelectedPreset('custom');
                                            }}
                                            keyboardType="numeric"
                                            placeholderTextColor="#6B7280"
                                        />
                                    </View>
                                    <Feather name="x" size={20} color="#6B7280" style={styles.sizeMultiply} />
                                    <View style={styles.sizeInputGroup}>
                                        <Text style={styles.inputLabel}>Alto (px)</Text>
                                        <TextInput
                                            style={styles.sizeInput}
                                            value={String(canvasHeight)}
                                            onChangeText={(text) => {
                                                setCanvasHeight(text.replace(/[^0-9]/g, ''));
                                                setSelectedPreset('custom');
                                            }}
                                            keyboardType="numeric"
                                            placeholderTextColor="#6B7280"
                                        />
                                    </View>
                                </View>
                            </View>
                        ))}

                        {/* Background Color */}
                        {renderSection('Color de Fondo', (
                            <View style={styles.colorsGrid}>
                                {COLOR_PRESETS.map((colorOption) => (
                                    <TouchableOpacity
                                        key={colorOption.id}
                                        style={[
                                            styles.colorButton,
                                            backgroundColor === colorOption.color && styles.colorButtonActive
                                        ]}
                                        onPress={() => setBackgroundColor(colorOption.color)}
                                    >
                                        <View style={[
                                            styles.colorSwatch,
                                            { backgroundColor: colorOption.color },
                                            colorOption.id === 'transparent' && styles.transparentSwatch,
                                            colorOption.id === 'white' && styles.whiteSwatch
                                        ]}>
                                            {colorOption.id === 'transparent' && (
                                                <Feather name="slash" size={16} color="#9CA3AF" />
                                            )}
                                            {backgroundColor === colorOption.color && (
                                                <Feather
                                                    name="check"
                                                    size={16}
                                                    color={['white', 'gray', 'transparent'].includes(colorOption.id) ? '#1F2937' : '#FFFFFF'}
                                                />
                                            )}
                                        </View>
                                        <Text style={styles.colorLabel}>{colorOption.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ))}

                        {/* Grid Settings */}
                        {renderSection('Cuadrícula', (
                            <View>
                                {/* Show Grid Toggle */}
                                <TouchableOpacity
                                    style={styles.toggleRow}
                                    onPress={() => setShowGrid(!showGrid)}
                                >
                                    <View style={styles.toggleInfo}>
                                        <Feather name="grid" size={20} color="#F59E0B" />
                                        <Text style={styles.toggleLabel}>Mostrar cuadrícula</Text>
                                    </View>
                                    <View style={[
                                        styles.toggle,
                                        showGrid && styles.toggleActive
                                    ]}>
                                        <View style={[
                                            styles.toggleKnob,
                                            showGrid && styles.toggleKnobActive
                                        ]} />
                                    </View>
                                </TouchableOpacity>

                                {/* Snap to Grid Toggle */}
                                <TouchableOpacity
                                    style={styles.toggleRow}
                                    onPress={() => setSnapToGrid(!snapToGrid)}
                                >
                                    <View style={styles.toggleInfo}>
                                        <Feather name="maximize-2" size={20} color="#8B5CF6" />
                                        <Text style={styles.toggleLabel}>Ajustar a cuadrícula</Text>
                                    </View>
                                    <View style={[
                                        styles.toggle,
                                        snapToGrid && styles.toggleActive
                                    ]}>
                                        <View style={[
                                            styles.toggleKnob,
                                            snapToGrid && styles.toggleKnobActive
                                        ]} />
                                    </View>
                                </TouchableOpacity>

                                {/* Grid Size */}
                                {showGrid && (
                                    <View style={styles.gridSizeContainer}>
                                        <Text style={styles.inputLabel}>Tamaño de cuadrícula (px)</Text>
                                        <TextInput
                                            style={styles.gridSizeInput}
                                            value={String(gridSize)}
                                            onChangeText={(text) => setGridSize(text.replace(/[^0-9]/g, ''))}
                                            keyboardType="numeric"
                                            placeholderTextColor="#6B7280"
                                        />
                                    </View>
                                )}
                            </View>
                        ))}

                        <View style={{ height: 100 }} />
                    </ScrollView>

                    {/* Apply Button */}
                    <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.applyButton}
                            onPress={handleApply}
                        >
                            <Feather name="check" size={20} color="#FFFFFF" />
                            <Text style={styles.applyButtonText}>Aplicar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    closeButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
    },
    presetsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    presetButton: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: RADIUS.md,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    presetButtonActive: {
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        borderColor: '#F59E0B',
    },
    presetLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#E5E7EB',
    },
    presetLabelActive: {
        color: '#F59E0B',
    },
    presetSize: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 2,
    },
    presetSizeActive: {
        color: '#F59E0B',
    },
    customSizeContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginTop: 16,
        gap: 12,
    },
    sizeInputGroup: {
        flex: 1,
    },
    inputLabel: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 6,
    },
    sizeInput: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: RADIUS.md,
        paddingVertical: 12,
        paddingHorizontal: 14,
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        textAlign: 'center',
    },
    sizeMultiply: {
        marginBottom: 14,
    },
    colorsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    colorButton: {
        alignItems: 'center',
        width: (SCREEN_WIDTH - 40 - 48) / 5,
    },
    colorButtonActive: {},
    colorSwatch: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.sm,
    },
    whiteSwatch: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    transparentSwatch: {
        borderWidth: 2,
        borderColor: '#9CA3AF',
        borderStyle: 'dashed',
    },
    colorLabel: {
        fontSize: 10,
        color: '#9CA3AF',
        marginTop: 4,
        textAlign: 'center',
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: RADIUS.md,
        padding: 14,
        marginBottom: 8,
    },
    toggleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    toggleLabel: {
        fontSize: 15,
        color: '#E5E7EB',
        fontWeight: '500',
    },
    toggle: {
        width: 50,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 2,
    },
    toggleActive: {
        backgroundColor: '#F59E0B',
    },
    toggleKnob: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
    },
    toggleKnobActive: {
        marginLeft: 'auto',
    },
    gridSizeContainer: {
        marginTop: 8,
    },
    gridSizeInput: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: RADIUS.md,
        paddingVertical: 12,
        paddingHorizontal: 14,
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        width: 100,
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: RADIUS.md,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    applyButton: {
        flex: 2,
        flexDirection: 'row',
        gap: 8,
        paddingVertical: 14,
        borderRadius: RADIUS.md,
        backgroundColor: '#F59E0B',
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
