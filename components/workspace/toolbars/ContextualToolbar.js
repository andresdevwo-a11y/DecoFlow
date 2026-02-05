import React from 'react';
import {
    View,
    TouchableOpacity,
    Text,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, RADIUS, SIZES, SPACING } from '../../../constants/Theme';

// Contextual toolbar items - appear when an image is selected
const CONTEXTUAL_ITEMS = [
    {
        id: 'delete',
        icon: 'trash-2',
        label: 'Eliminar',
        color: COLORS.error,
        destructive: true
    },
    {
        id: 'ungroup',
        icon: 'layers', // or Grid?
        label: 'Desagrupar',
        color: COLORS.primary,
        requiresGroup: true // Custom flag I will check
    },
    {
        id: 'duplicate',
        icon: 'copy',
        label: 'Duplicar',
        color: COLORS.primary
    },
    {
        id: 'layerUp',
        icon: 'arrow-up',
        label: 'Adelante',
        color: COLORS.primary
    },
    {
        id: 'layerDown',
        icon: 'arrow-down',
        label: 'Atrás',
        color: COLORS.primary
    },
    {
        id: 'flipH',
        icon: 'more-horizontal',
        label: 'Voltear H',
        color: COLORS.primary
    },
    {
        id: 'flipV',
        icon: 'more-vertical',
        label: 'Voltear V',
        color: COLORS.primary
    },
];



function ToolbarButton({ item, onPress, index }) {
    const handlePress = () => {
        if (onPress) {
            onPress(item.id);
        }
    };

    return (
        <TouchableOpacity
            style={styles.button}
            onPress={handlePress}
            activeOpacity={0.7}
        >
            <View
                style={[
                    styles.iconContainer,
                    { backgroundColor: `${item.color}15` }
                ]}
            >
                <Feather
                    name={item.icon}
                    size={20}
                    color={item.color}
                />
            </View>
            <Text
                style={[
                    styles.label,
                    item.destructive && styles.labelDestructive
                ]}
                numberOfLines={1}
            >
                {item.label}
            </Text>
        </TouchableOpacity>
    );
}

export default function ContextualToolbar({
    visible = false,
    onAction,
    style,
    isGroup = false // NEW
}) {
    const insets = useSafeAreaInsets();

    const handleAction = (actionId) => {
        if (onAction) {
            onAction(actionId);
        }
    };

    if (!visible) return null;

    return (
        <View
            style={[
                styles.container,
                { bottom: SPACING.md + insets.bottom },
                style
            ]}
        >
            <View style={styles.toolbar}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {CONTEXTUAL_ITEMS.filter(item => !item.requiresGroup || isGroup).map((item, index) => (
                        <React.Fragment key={item.id}>
                            <ToolbarButton
                                item={item}
                                onPress={handleAction}
                                index={index}
                            />
                            {/* Separator after certain items */}
                            {(index === 0 || index === 3) && (
                                <View style={styles.separator} />
                            )}
                        </React.Fragment>
                    ))}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 80,  // Espacio para LeftSidePanel (64px + 16px margen)
        right: 80, // Espacio para FloatingControls zoom
        alignItems: 'center',
        zIndex: 180,
    },
    toolbar: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        maxWidth: '95%',
        borderWidth: 1,
        borderColor: COLORS.primaryBorder,
        ...SHADOWS.lg,
    },
    scrollContent: {
        paddingHorizontal: 8,
        paddingVertical: 8,
        alignItems: 'center',
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        minWidth: 56,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    label: {
        color: COLORS.text,
        fontSize: 10,
        fontWeight: '500',
        textAlign: 'center',
    },
    labelDestructive: {
        color: COLORS.error,
    },
    separator: {
        width: 1,
        height: 40,
        backgroundColor: COLORS.border,
        marginHorizontal: 4,
    },
});
