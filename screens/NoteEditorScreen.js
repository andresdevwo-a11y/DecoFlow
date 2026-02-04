import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/Theme';
import { useAlert } from '../context/AlertContext';

export default function NoteEditorScreen({ note, onBack, onSave, onDelete }) {
    const insets = useSafeAreaInsets();
    const { showDelete, showAlert } = useAlert();

    // State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [date, setDate] = useState(new Date().toISOString()); // Guardamos ISO completo
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Init state if editing
    useEffect(() => {
        if (note) {
            setTitle(note.title);
            setContent(note.content || '');
            setDate(note.date || note.createdAt || new Date().toISOString());
        }
    }, [note]);

    // Format date and time for metadata
    const getMetadataString = () => {
        const d = new Date(date);
        
        // Date part: "4 de febrero"
        const dateStr = d.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long'
        });

        // Time part: "2:28 PM"
        const timeStr = d.toLocaleTimeString('es-ES', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        const charCount = content ? content.length : 0;
        
        return `${dateStr}  ${timeStr}  |  ${charCount} caracteres`;
    };

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
                content: content,
                date: date // Preservamos fecha original o de creación
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
            {/* Minimalist Header */}
            <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
                <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                    <Feather name="arrow-left" size={24} color={COLORS.text} />
                </TouchableOpacity>
                
                <View style={styles.headerActions}>
                    {/* Botones de acción adicionales placeholder (share, etc) */}
                    
                    {note && onDelete && (
                        <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
                            <Feather name="trash-2" size={20} color={COLORS.error} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView 
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
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

            {/* Floating/Fixed Save Button */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
                <TouchableOpacity
                    style={[styles.saveButton, isSubmitting && styles.disabledButton]}
                    onPress={handleSave}
                    disabled={isSubmitting}
                    activeOpacity={0.9}
                >
                    <Feather name="save" size={20} color="#FFF" style={{ marginRight: SPACING.sm }} />
                    <Text style={styles.saveButtonText}>
                        {isSubmitting ? 'Guardando...' : (note ? 'Guardar cambios' : 'Guardar')}
                    </Text>
                </TouchableOpacity>
            </View>
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
    footer: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.md,
        // Fondo transparente o gradiente si se quiere flotante, aquí simple
        backgroundColor: 'transparent',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.full, // Botón pastilla
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    disabledButton: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.bold,
    },
});
