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

const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

const NoteCard = React.memo(({ note, onPress, onLongPress, isSelected, selectionMode }) => {
    return (
        <TouchableOpacity
            style={[
                styles.card,
                isSelected && styles.cardSelected,
            ]}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                {/* Decorative Icon */}
                <View style={styles.cardIconContainer}>
                    <Feather name="file-text" size={16} color={COLORS.primary} />
                </View>

                {/* Content Header */}
                <View style={styles.headerContent}>
                    <View style={styles.titleRow}>
                        <Text style={[
                            styles.cardTitle,
                            isSelected && { color: COLORS.primary }
                        ]} numberOfLines={1}>{note.title}</Text>

                        {selectionMode ? (
                            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                {isSelected && <Feather name="check" size={12} color="#FFF" />}
                            </View>
                        ) : (
                            <View style={styles.dateBadge}>
                                <Feather name="calendar" size={10} color={COLORS.textSecondary} />
                                <Text style={styles.cardDate}>{formatDate(note.date)}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {/* Note Preview */}
            <View style={styles.cardPreviewContainer}>
                <Text style={styles.cardPreview} numberOfLines={2}>
                    {note.content || "Sin contenido adicional..."}
                </Text>
            </View>
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
            <View style={styles.emptyIconContainer}>
                <Feather name="edit-3" size={32} color={COLORS.primary} />
            </View>
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
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.card,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    cardSelected: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
        backgroundColor: COLORS.primary + '05',
        borderColor: COLORS.primary,
        borderWidth: 1,
        borderLeftWidth: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.md,
    },
    cardIconContainer: {
        width: 32,
        height: 32,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.sm,
    },
    headerContent: {
        flex: 1,
        gap: 4,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardTitle: {
        fontSize: TYPOGRAPHY.size.base,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        flex: 1,
        marginRight: SPACING.sm,
    },
    dateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: RADIUS.sm,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardDate: {
        fontSize: 11,
        color: COLORS.textSecondary,
        marginLeft: 4,
        fontWeight: TYPOGRAPHY.weight.medium,
    },
    cardPreviewContainer: {
        backgroundColor: COLORS.background,
        padding: SPACING.sm,
        borderRadius: RADIUS.sm,
    },
    cardPreview: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: RADIUS.full,
        backgroundColor: COLORS.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
    },
    emptyText: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    emptySubtext: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textMuted,
        textAlign: 'center',
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
