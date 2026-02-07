import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Keyboard, BackHandler, Animated, Share, Modal, TouchableWithoutFeedback } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/Theme';
import { useAlert } from '../context/AlertContext';
import ToastNotification from '../components/ui/ToastNotification';

export default function NoteEditorScreen({ note, onBack, onSave, onDelete }) {
    const insets = useSafeAreaInsets();
    const { showDelete, showAlert } = useAlert();
    const scrollY = useRef(new Animated.Value(0)).current;

    // State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [date, setDate] = useState(new Date().toISOString());
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Menu State
    const [menuVisible, setMenuVisible] = useState(false);

    // Track initial state for dirty checking
    const [initialTitle, setInitialTitle] = useState('');
    const [initialContent, setInitialContent] = useState('');

    // Focus refs
    const contentInputRef = useRef(null);
    const titleInputRef = useRef(null);

    // Toast State
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    // Init state
    useEffect(() => {
        if (note) {
            setTitle(note.title);
            setContent(note.content || '');
            setDate(note.date || note.createdAt || new Date().toISOString());
            setInitialTitle(note.title);
            setInitialContent(note.content || '');
        } else {
            // New note: Auto-focus content after a short delay to allow transition
            setTimeout(() => {
                contentInputRef.current?.focus();
            }, 500);
        }
    }, [note]);

    // Handle Hardware Back Button (Android)
    useEffect(() => {
        const backAction = () => {
            if (menuVisible) {
                setMenuVisible(false);
                return true;
            }
            handleBackBehavior();
            return true; // Prevent default behavior
        };

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction
        );

        return () => backHandler.remove();
    }, [title, content, initialTitle, initialContent, menuVisible]);

    const hasChanges = useMemo(() => {
        if (!note) return title.trim().length > 0 || content.trim().length > 0;
        return title.trim() !== initialTitle || content !== initialContent;
    }, [note, title, initialTitle, content, initialContent]);

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
    };

    const hideToast = () => {
        setToast(prev => ({ ...prev, visible: false }));
    };

    // Logic for saving/discarding on back
    const handleBackBehavior = async () => {
        Keyboard.dismiss();

        // If no changes, just go back
        if (!hasChanges) {
            onBack();
            return;
        }

        // If no title and no content, just go back (discard empty)
        if (!title.trim() && !content.trim()) {
            onBack();
            return;
        }

        // Auto-save logic
        setIsSubmitting(true);
        const now = new Date().toISOString();

        try {
            // Prepare data
            const noteData = {
                id: note?.id,
                title: title.trim() || 'Sin título',
                content: content,
                date: now
            };

            await onSave(noteData);
            onBack();

        } catch (error) {
            console.error(error);
            showAlert("error", "Error", "No se pudo guardar la nota automáticamente.");
            setIsSubmitting(false);
        }
    };

    const handleDelete = () => {
        setMenuVisible(false);
        Keyboard.dismiss();
        showDelete({
            title: "Eliminar Nota",
            message: "¿Estás seguro de eliminar esta nota?",
            onConfirm: async () => {
                try {
                    await onDelete(note.id);
                } catch (error) {
                    console.error(error);
                    showAlert("error", "Error", "No se pudo eliminar la nota.");
                }
            }
        });
    };

    const handleShare = async () => {
        setMenuVisible(false);
        try {
            const message = `${title}\n\n${content}`;
            await Share.share({
                message: message,
            });
        } catch (error) {
            console.error(error);
        }
    };

    // Header Animation (Opacity based on scroll)
    const headerTitleOpacity = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [0, 1],
        extrapolate: 'clamp'
    });

    const getMetadataString = () => {
        const d = new Date(date);
        const dateStr = d.toLocaleDateString('es-ES', {
            day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit'
        });
        const charCount = content ? content.length : 0;
        return `${dateStr}  |  ${charCount} caracteres`;
    };

    return (
        <View style={styles.container}>
            {/* Minimalist Header */}
            <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
                <TouchableOpacity onPress={handleBackBehavior} style={styles.iconButton}>
                    <Feather name="chevron-left" size={32} color={COLORS.text} />
                </TouchableOpacity>

                {/* Animated Header Title (Shows when scrolled) */}
                <Animated.View style={{ opacity: headerTitleOpacity, flex: 1, alignItems: 'center' }}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {title || "Nota"}
                    </Text>
                </Animated.View>

                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => setMenuVisible(true)}
                    >
                        <Feather name="more-vertical" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Menu Modal */}
            <Modal
                visible={menuVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={[styles.menuContainer, { top: insets.top + 50 }]}>
                            <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
                                <Feather name="share" size={20} color={COLORS.text} style={styles.menuIcon} />
                                <Text style={styles.menuText}>Compartir</Text>
                            </TouchableOpacity>

                            {note && (
                                <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
                                    <Feather name="trash-2" size={20} color={COLORS.error} style={styles.menuIcon} />
                                    <Text style={[styles.menuText, { color: COLORS.error }]}>Eliminar</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={true}
                    scrollEventThrottle={16}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false }
                    )}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                >
                    {/* Title Input */}
                    <TextInput
                        ref={titleInputRef}
                        style={styles.titleInputClean}
                        placeholder="Título"
                        placeholderTextColor={COLORS.placeholder}
                        value={title}
                        onChangeText={setTitle}
                        maxLength={100}
                        selectionColor={COLORS.primary}
                        multiline={true}
                        scrollEnabled={false}
                    />

                    {/* Metadata Line */}
                    <Text style={styles.metadataText}>
                        {getMetadataString()}
                    </Text>

                    {/* Content Input */}
                    <TextInput
                        ref={contentInputRef}
                        style={styles.contentInputClean}
                        placeholder="Escribe aquí..."
                        placeholderTextColor={COLORS.placeholder}
                        value={content}
                        onChangeText={setContent}
                        multiline
                        textAlignVertical="top"
                        selectionColor={COLORS.primary}
                        scrollEnabled={false}
                    />

                    <View style={{ height: 300 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            <ToastNotification
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={hideToast}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.sm,
        backgroundColor: COLORS.background,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RADIUS.full,
    },
    content: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xs,
    },
    titleInputClean: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.text,
        paddingVertical: SPACING.sm,
        marginBottom: SPACING.xs,
    },
    metadataText: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.textMuted,
        marginBottom: SPACING.lg,
    },
    contentInputClean: {
        fontSize: TYPOGRAPHY.size.md + 2,
        color: COLORS.text,
        lineHeight: 28,
        minHeight: 200,
        paddingBottom: SPACING.xl,
    },
    // Menu Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.1)', // Subtle dim
    },
    menuContainer: {
        position: 'absolute',
        right: SPACING.md,
        // Top is dynamic
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.md,
        paddingVertical: SPACING.xs,
        minWidth: 180,
        ...SHADOWS.md, // Use shadow from theme
        elevation: 5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
    },
    menuIcon: {
        marginRight: SPACING.md,
    },
    menuText: {
        fontSize: TYPOGRAPHY.size.base,
        color: COLORS.text,
    },
});
