import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, ScrollView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, SIZES } from '../constants/Theme';

export default function ActionSheetModal({
    visible,
    onClose,
    title,
    message,
    actions = [],
    cancelText = 'Cancelar'
}) {
    const insets = useSafeAreaInsets();

    if (!visible) return null;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback onPress={() => { }}>
                        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>
                            {/* Header */}
                            {(title || message) && (
                                <View style={styles.header}>
                                    {title && <Text style={styles.title}>{title}</Text>}
                                    {message && <Text style={styles.message}>{message}</Text>}
                                </View>
                            )}

                            {/* Actions */}
                            <ScrollView style={styles.actionsList} bounces={false}>
                                {actions.map((action, index) => {
                                    const isDestructive = action.style === 'destructive';
                                    const isCancel = action.style === 'cancel';

                                    // Skip cancel button in list, we render it separately at bottom usually, 
                                    // but we will render it as the last item or specific separate button for better UX
                                    if (isCancel) return null;

                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.actionButton, index < actions.length - 1 && styles.actionBorder]}
                                            onPress={() => {
                                                onClose();
                                                setTimeout(() => {
                                                    if (action.onPress) action.onPress();
                                                }, 100); // Slight delay for modal close animation
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            {action.icon && (
                                                <Feather
                                                    name={action.icon}
                                                    size={20}
                                                    color={isDestructive ? COLORS.error : COLORS.primary}
                                                    style={{ marginRight: SPACING.md }}
                                                />
                                            )}
                                            <Text style={[
                                                styles.actionText,
                                                isDestructive && styles.destructiveText
                                            ]}>
                                                {action.text}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            {/* Cancel Button */}
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={onClose}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelText}>{cancelText}</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: COLORS.overlay,
        justifyContent: 'flex-end',
    },
    sheetContainer: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        padding: SPACING.xl,
        ...SHADOWS.sheet,
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING.lg,
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    title: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: SPACING.xs,
    },
    message: {
        fontSize: TYPOGRAPHY.size.base,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    actionsList: {
        maxHeight: 300,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: SPACING.md,
    },
    actionBorder: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    actionText: {
        fontSize: TYPOGRAPHY.size.lg,
        color: COLORS.text,
        fontWeight: TYPOGRAPHY.weight.medium,
    },
    destructiveText: {
        color: COLORS.error,
    },
    cancelButton: {
        marginTop: SPACING.lg,
        paddingVertical: 14,
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelText: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
    },
});
