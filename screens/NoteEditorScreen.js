import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SIZES } from '../constants/Theme';


import { useAlert } from '../context/AlertContext';

export default function NoteEditorScreen({ note, onBack, onSave, onDelete }) {
    const insets = useSafeAreaInsets();
    const { showDelete, showAlert } = useAlert();

    // State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Formatear fecha para mostrar
    const formatDate = (dateString) => {
        const d = new Date(dateString + 'T00:00:00');
        return d.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Init state if editing
    useEffect(() => {
        if (note) {
            setTitle(note.title);
            setContent(note.content || '');
            setDate(note.date);
        }
    }, [note]);

    const handleSave = async () => {
        if (!title.trim()) {
            showAlert("error", "Requerido", "Por favor ingresa un título para la nota.");
            return;
        }

        setIsSubmitting(true);
        try {
            await onSave({
                id: note?.id,
                title: title.trim(),
                content: content.trim(),
                date
            });
        } catch (error) {
            console.error(error);
            showAlert("error", "Error", "No se pudo guardar la nota.");
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
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + SPACING.xs }]}>
                <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {note ? 'Editar Nota' : 'Nueva Nota'}
                </Text>
                {note && onDelete ? (
                    <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
                        <Feather name="trash-2" size={24} color={COLORS.error || '#EF4444'} />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.iconButton} />
                )}
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>

                    {/* Title Input */}
                    <Text style={styles.label}>Título</Text>
                    <TextInput
                        style={styles.titleInput}
                        placeholder="Título de la nota"
                        placeholderTextColor={COLORS.textMuted}
                        value={title}
                        onChangeText={setTitle}
                        maxLength={100}
                    />

                    {/* Fecha (solo lectura) */}
                    <View style={{ marginTop: SPACING.lg }}>
                        <Text style={styles.label}>Fecha</Text>
                        <View style={styles.dateDisplay}>
                            <Feather name="calendar" size={18} color={COLORS.textSecondary} style={{ marginRight: SPACING.sm }} />
                            <Text style={styles.dateText}>{formatDate(date)}</Text>
                        </View>
                    </View>

                    {/* Content Input */}
                    <Text style={[styles.label, { marginTop: SPACING.lg }]}>Contenido</Text>
                    <TextInput
                        style={styles.contentInput}
                        placeholder="Escribe tu nota aquí..."
                        placeholderTextColor={COLORS.textMuted}
                        value={content}
                        onChangeText={setContent}
                        multiline
                        textAlignVertical="top"
                    />

                    <View style={{ height: 100 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Save Button */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
                <TouchableOpacity
                    style={[styles.saveButton, isSubmitting && styles.disabledButton]}
                    onPress={handleSave}
                    disabled={isSubmitting}
                >
                    <Feather name="check" size={20} color="#FFF" style={{ marginRight: SPACING.sm }} />
                    <Text style={styles.saveButtonText}>
                        {isSubmitting ? 'Guardando...' : 'Guardar Nota'}
                    </Text>
                </TouchableOpacity>
            </View>
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
        paddingBottom: SPACING.md,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
    },
    iconButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        padding: SPACING.lg,
    },
    label: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
    },
    titleInput: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.sm,
        padding: SPACING.md,
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: '600',
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    contentInput: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.sm,
        padding: SPACING.md,
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.border,
        minHeight: 300,
    },
    footer: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.md, // Matching global radius ideally
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.bold,
    },
    dateDisplay: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.sm,
        padding: SPACING.md,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    dateText: {
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.text,
    }
});
