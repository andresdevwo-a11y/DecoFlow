import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/Theme';
import { useAlert } from '../context/AlertContext';
import ToastNotification from '../components/ui/ToastNotification';

export default function NoteEditorScreen({ note, onBack, onSave, onDelete }) {
    const insets = useSafeAreaInsets();
    const { showDelete, showAlert } = useAlert();

    // State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [date, setDate] = useState(new Date().toISOString()); // Guardamos ISO completo
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Track initial state for dirty checking
    const [initialTitle, setInitialTitle] = useState('');
    const [initialContent, setInitialContent] = useState('');

    // Toast State
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    // Init state if editing
    useEffect(() => {
        if (note) {
            setTitle(note.title);
            setContent(note.content || '');
            setDate(note.date || note.createdAt || new Date().toISOString());

            // Set initial values
            setInitialTitle(note.title);
            setInitialContent(note.content || '');
        }
    }, [note]);

    // Format date and time for metadata
    const getMetadataString = () => {
        const d = new Date(date);

        // Date part: "4 de febrero de 2026, 3:04 p. m." matches NotesScreen format
        const dateStr = d.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        const charCount = content ? content.length : 0;

        return `${dateStr}  |  ${charCount} caracteres`;
    };

    const hasChanges = useMemo(() => {
        if (!note) return true; // New note always has changes (or at least valid to save if title exists)
        return title.trim() !== initialTitle || content !== initialContent;
    }, [note, title, initialTitle, content, initialContent]);

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
    };

    const hideToast = () => {
        setToast(prev => ({ ...prev, visible: false }));
    };

    const handleSave = async () => {
        if (!title.trim()) {
            showToast("Por favor ingresa un título para la nota.", "error");
            return;
        }

        // Check for changes if it's an existing note
        if (note) {
            if (!hasChanges) {
                showToast("No has realizado cambios", "info");
                return;
            }
        }

        setIsSubmitting(true);
        const now = new Date().toISOString();
        // Update local state to reflect change immediately if we stay on screen
        setDate(now);

        try {
            await onSave({
                id: note?.id,
                title: title.trim(),
                content: content,
                date: now // Update date to now
            });

            // Update initial state to current state after successful save
            setInitialTitle(title.trim());
            setInitialContent(content);

            const successMessage = note ? "Cambios guardados correctamente" : "Nota creada correctamente";
            showToast(successMessage);
        } catch (error) {
            console.error(error);
            showToast("No se pudo guardar la nota.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = () => {
        showDelete({
            title: "Eliminar Nota",
            message: "¿Estás seguro de eliminar esta nota? Esta acción no se puede deshacer.",
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

    return (
        <View style={styles.container}>
            {/* Minimalist Header */}
            <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
                <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.text} />
                </TouchableOpacity>

                <View style={styles.headerActions}>
                    {/* Botón Guardar */}
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={isSubmitting}
                        style={[
                            styles.headerSaveButton,
                            (isSubmitting || (note && !hasChanges)) && styles.headerButtonDisabled
                        ]}
                    >
                        <Feather
                            name="check"
                            size={24}
                            color={COLORS.primary}
                        />
                    </TouchableOpacity>

                    {note && onDelete && (
                        <TouchableOpacity onPress={handleDelete} style={[styles.iconButton, { marginLeft: SPACING.xs }]}>
                            <Feather name="trash-2" size={20} color={COLORS.error} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    overScrollMode="never"
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Title Input */}
                    <TextInput
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
                        style={styles.contentInputClean}
                        placeholder="Empiece a escribir"
                        placeholderTextColor={COLORS.placeholder}
                        value={content}
                        onChangeText={setContent}
                        multiline
                        textAlignVertical="top"
                        selectionColor={COLORS.primary}
                        scrollEnabled={false} // Dejamos que el ScrollView maneje el scroll
                    />

                    {/* Espaciado extra al final para scroll cómodo */}
                    <View style={{ height: 150 }} />
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
        backgroundColor: COLORS.background, // Idealmente sería un color sólido oscuro o claro según tema
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.sm,
        // Sin borde ni fondo marcado para look limpio
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerSaveButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RADIUS.full,
        // Eliminado fondo y sombras para diseño minimalista
    },
    headerButtonDisabled: {
        opacity: 0.5,
    },
    iconButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RADIUS.full,
    },
    content: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.sm,
    },
    titleInputClean: {
        fontSize: 28, // Tamaño grande para título
        fontWeight: 'bold',
        color: COLORS.text,
        paddingVertical: SPACING.sm,
        marginBottom: SPACING.xs,
    },
    metadataText: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xl,
        opacity: 0.8,
    },
    contentInputClean: {
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.text,
        lineHeight: 24, // Mejor legibilidad
        minHeight: 200,
    },
});
