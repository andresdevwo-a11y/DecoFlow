import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SIZES, SHADOWS } from '../constants/Theme';
import SearchHeader from '../components/SearchHeader';

import FloatingActionButton from '../components/FloatingActionButton';
import SelectionActionBar from '../components/SelectionActionBar';
import { useNotes } from '../context/NotesContext';
import { useAlert } from '../context/AlertContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NoteCard = React.memo(({ note, onPress, onLongPress, isSelected, selectionMode }) => {
    return (
        <TouchableOpacity
            style={[
                styles.card,
                isSelected && styles.cardSelected,
                isSelected && {
                    borderColor: COLORS.primary,
                    backgroundColor: COLORS.primary + '10'
                }
            ]}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <Text style={[
                    styles.cardTitle,
                    isSelected && { color: COLORS.primary, fontWeight: 'bold' }
                ]} numberOfLines={1}>{note.title}</Text>
                {selectionMode ? (
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <Feather name="check" size={14} color="#FFF" />}
                    </View>
                ) : (
                    <Text style={styles.cardDate}>{note.date}</Text>
                )}
            </View>
            <Text style={styles.cardPreview} numberOfLines={2}>
                {note.content || "Sin contenido adicional"}
            </Text>
        </TouchableOpacity>
    );
});

export default function NotesScreen({ onCreateNote, onNotePress }) {
    const { notes, isLoading, loadNotes, deleteNote } = useNotes();
    const { showDelete, showAlert } = useAlert();
    const [searchText, setSearchText] = useState('');
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedNoteIds, setSelectedNoteIds] = useState(new Set());
    const insets = useSafeAreaInsets();

    useEffect(() => {
        loadNotes();
    }, [loadNotes]);

    // --- Selection Handlers ---

    const toggleSelectionMode = React.useCallback((noteId) => {
        setIsSelectionMode(true);
        setSelectedNoteIds(new Set([noteId]));
    }, []);

    const toggleSelection = React.useCallback((noteId) => {
        setSelectedNoteIds(prev => {
            const next = new Set(prev);
            if (next.has(noteId)) {
                next.delete(noteId);
            } else {
                next.add(noteId);
            }

            if (next.size === 0) {
                setIsSelectionMode(false);
            }
            return next;
        });
    }, []);

    const cancelSelection = React.useCallback(() => {
        setIsSelectionMode(false);
        setSelectedNoteIds(new Set());
    }, []);

    const handleBatchDelete = React.useCallback(() => {
        showDelete({
            title: `¿Eliminar ${selectedNoteIds.size} notas?`,
            message: `Estas notas se eliminarán permanentemente.`,
            onConfirm: async () => {
                try {
                    const idsToDelete = Array.from(selectedNoteIds);
                    // Delete sequentially or parallel
                    for (const id of idsToDelete) {
                        await deleteNote(id);
                    }
                    cancelSelection();
                    showAlert("success", "Éxito", "Notas eliminadas");
                } catch (error) {
                    console.error(error);
                    showAlert("error", "Error", "No se pudieron eliminar algunas notas");
                }
            }
        });
    }, [selectedNoteIds, deleteNote, showDelete, showAlert, cancelSelection]);

    const filteredNotes = useMemo(() => {
        if (!searchText) return notes;
        const lowerSearch = searchText.toLowerCase();
        return notes.filter(note =>
            note.title.toLowerCase().includes(lowerSearch) ||
            (note.content && note.content.toLowerCase().includes(lowerSearch))
        );
    }, [notes, searchText]);

    const renderItem = ({ item }) => {
        const isSelected = selectedNoteIds.has(item.id);
        return (
            <NoteCard
                note={item}
                isSelected={isSelected}
                selectionMode={isSelectionMode}
                onPress={() => {
                    if (isSelectionMode) {
                        toggleSelection(item.id);
                    } else {
                        onNotePress(item);
                    }
                }}
                onLongPress={() => {
                    if (!isSelectionMode) {
                        toggleSelectionMode(item.id);
                    } else {
                        toggleSelection(item.id);
                    }
                }}
            />
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Feather name="file-text" size={48} color={COLORS.textMuted} style={{ marginBottom: SPACING.md }} />
            <Text style={styles.emptyText}>No hay notas</Text>
            <Text style={styles.emptySubtext}>Crea una nueva nota para empezar</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                contentContainerStyle={[
                    styles.listContent,
                    {
                        paddingBottom: 100,
                        paddingTop: insets.top + SPACING.lg
                    }
                ]}
                data={filteredNotes}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                ListHeaderComponent={
                    <SearchHeader
                        title="Mis Notas"
                        placeholder="Buscar notas..."
                        searchText={searchText}
                        onSearchChange={setSearchText}
                    />
                }
                ListEmptyComponent={!isLoading && renderEmpty}
                showsVerticalScrollIndicator={false}
            />

            {isSelectionMode ? (
                <SelectionActionBar
                    selectedCount={selectedNoteIds.size}
                    onClear={cancelSelection}
                    onDelete={handleBatchDelete}
                />
            ) : (
                <FloatingActionButton
                    label="Nueva Nota"
                    onPress={onCreateNote}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    listContent: {
        padding: SPACING.lg,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.card,
    },
    cardSelected: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    cardTitle: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        flex: 1,
        marginRight: SPACING.sm,
    },
    cardDate: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.textMuted,
    },
    cardPreview: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.textSecondary,
    },
    emptySubtext: {
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.textMuted,
        marginTop: SPACING.xs,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: COLORS.textMuted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    }
});
