import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SIZES } from '../constants/Theme';
import SectionCard from '../components/SectionCard';
import SectionOptionsModal from '../components/SectionOptionsModal';
import EditSectionModal from '../components/EditSectionModal';
import SearchHeader from '../components/SearchHeader';
import SelectionActionBar from '../components/SelectionActionBar';
import FloatingActionButton from '../components/FloatingActionButton'; // Import FAB
import { useSettings } from '../context/SettingsContext';
import { useAlert } from '../context/AlertContext';

export default function InventoryScreen({ sections = [], onDeleteSection, onDuplicateSection, onEditSection, onSectionPress, onCreateSection }) {
    const { viewMode, sortBy, confirmDelete } = useSettings();
    const { showAlert, showDelete } = useAlert();

    const [selectedSection, setSelectedSection] = useState(null); // Menu context
    const [isOptionsVisible, setOptionsVisible] = useState(false);
    const [isEditVisible, setEditVisible] = useState(false);
    const [searchText, setSearchText] = useState('');

    // --- Selection Mode State ---
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedSectionIds, setSelectedSectionIds] = useState(new Set());
    // Removed isBatchDeleteVisible, isDeleteVisible state

    const handleOptionsPress = useCallback((section) => {
        if (isSelectionMode) return; // Disable options in selection mode
        setSelectedSection(section);
        setOptionsVisible(true);
    }, [isSelectionMode]);

    const handleOpenRequest = useCallback(() => {
        if (selectedSection) {
            onSectionPress && onSectionPress(selectedSection);
        }
        setOptionsVisible(false);
        setSelectedSection(null);
    }, [selectedSection, onSectionPress]);

    const handleEditRequest = useCallback(() => {
        setOptionsVisible(false);
        setTimeout(() => setEditVisible(true), 300);
    }, []);

    // --- Batch Selection Handlers ---

    const toggleSelectionMode = useCallback((sectionId) => {
        setIsSelectionMode(true);
        setSelectedSectionIds(new Set([sectionId]));
    }, []);

    const toggleSelection = useCallback((sectionId) => {
        setSelectedSectionIds(prev => {
            const next = new Set(prev);
            if (next.has(sectionId)) {
                next.delete(sectionId);
            } else {
                next.add(sectionId);
            }

            if (next.size === 0) {
                setIsSelectionMode(false);
            }
            return next;
        });
    }, []);

    const cancelSelection = useCallback(() => {
        setIsSelectionMode(false);
        setSelectedSectionIds(new Set());
    }, []);

    const handleBatchDeleteRequest = useCallback(() => {
        showDelete({
            title: `¿Eliminar ${selectedSectionIds.size} secciones?`,
            message: `Estás a punto de eliminar ${selectedSectionIds.size} secciones seleccionadas. Esta acción no se puede deshacer.`,
            onConfirm: () => {
                // Batch delete is likely needing async handling or individual calls.
                // onDuplicateSection, onEditSection receive section object usually? 
                // onDeleteSection usually receives ID.
                try {
                    selectedSectionIds.forEach(id => {
                        onDeleteSection(id);
                    });
                    cancelSelection();
                } catch (e) {
                    showAlert("error", "Error", "Error eliminando secciones");
                }
            }
        });
    }, [selectedSectionIds, onDeleteSection, cancelSelection, showDelete, showAlert]);


    const handleDeleteRequest = useCallback(() => {
        setOptionsVisible(false);
        if (confirmDelete) {
            setTimeout(() => {
                showDelete({
                    title: "¿Eliminar sección?",
                    message: "Esta acción eliminará la sección y todo su contenido.", // Generic message or dynamic
                    sectionName: selectedSection?.name, // existing showDelete supports sectionName? Step 43 shows it does NOT in AlertContext implementation I saw?
                    // Wait, Step 43 context implementation:
                    // showDelete = ({ title, message, onConfirm, isDestructive = true, confirmText = "Eliminar", cancelText = "Cancelar" })
                    // It does NOT have sectionName prop in the signature I wrote in step 43. 
                    // However, I can put section name in message.
                    message: `¿Eliminar la sección "${selectedSection?.name}" y todo su contenido?`,
                    onConfirm: async () => {
                        try {
                            if (selectedSection) {
                                await onDeleteSection(selectedSection.id);
                                setSelectedSection(null);
                            }
                        } catch (error) {
                            showAlert("error", "Error", "No se pudo eliminar la sección.");
                        }
                    }
                });
            }, 300);
        } else {
            if (selectedSection) {
                onDeleteSection(selectedSection.id);
            }
            setSelectedSection(null);
        }
    }, [confirmDelete, selectedSection, onDeleteSection, showDelete, showAlert]);

    const handleDuplicateRequest = useCallback(() => {
        if (selectedSection) {
            onDuplicateSection(selectedSection);
        }
        setOptionsVisible(false);
        setSelectedSection(null);
    }, [selectedSection, onDuplicateSection]);

    const filteredSections = useMemo(() => {
        let result = sections.filter(section =>
            section.name.toLowerCase().includes(searchText.toLowerCase())
        );

        return result.sort((a, b) => {
            switch (sortBy) {
                case 'Nombre':
                    return a.name.localeCompare(b.name);
                case 'Fecha':
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                case 'Modificación':
                    return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
                default:
                    return 0;
            }
        });
    }, [sections, searchText, sortBy]);

    const renderEmptyState = useCallback(() => {
        if (searchText.length > 0 && filteredSections.length === 0) {
            return (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                        <Feather name="search" size={SIZES.iconEmpty} color={COLORS.primary} />
                    </View>
                    <Text style={styles.emptyTitle}>No se encontraron resultados</Text>
                    <Text style={styles.emptySubtitle}>
                        Intenta con otro nombre
                    </Text>
                </View>
            );
        }

        return (
            <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                    <Feather name="folder" size={SIZES.iconEmpty} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyTitle}>No hay secciones</Text>
                <Text style={styles.emptySubtitle}>
                    Crea una nueva sección para organizar tus productos
                </Text>
            </View>
        );
    }, [searchText, filteredSections.length]);

    const renderItem = useCallback(({ item }) => {
        const isSelected = selectedSectionIds.has(item.id);

        return (
            <SectionCard
                section={item}
                onPress={() => {
                    if (isSelectionMode) {
                        toggleSelection(item.id);
                    } else {
                        onSectionPress && onSectionPress(item);
                    }
                }}
                onLongPress={() => {
                    if (!isSelectionMode) {
                        toggleSelectionMode(item.id);
                    } else {
                        toggleSelection(item.id);
                    }
                }}
                onOptionsPress={() => handleOptionsPress(item)}
                viewMode={viewMode}
                // Selection Props
                selectionMode={isSelectionMode}
                isSelected={isSelected}
            />
        );
    }, [onSectionPress, handleOptionsPress, viewMode, isSelectionMode, selectedSectionIds, toggleSelection, toggleSelectionMode]);

    const handleSearchChange = useCallback((text) => {
        setSearchText(text);
    }, []);

    return (
        <View style={styles.container}>
            <FlatList
                data={filteredSections}
                keyExtractor={(item) => item.id}
                key={viewMode} // Force re-render when changing columns
                renderItem={renderItem}
                numColumns={viewMode === 'Grid' ? 2 : 1}
                columnWrapperStyle={viewMode === 'Grid' ? styles.columnWrapper : null}
                contentContainerStyle={[
                    styles.listContent,
                    filteredSections.length === 0 && styles.listContentEmpty
                ]}
                ListHeaderComponent={
                    sections.length > 0 ? (
                        <SearchHeader
                            title="Mis Secciones"
                            placeholder="Buscar sección..."
                            showSearch={!isSelectionMode} // Hide search in selection mode? Or keep it?
                            searchText={searchText}
                            onSearchChange={handleSearchChange}
                        />
                    ) : null
                }
                ListEmptyComponent={renderEmptyState}
                showsVerticalScrollIndicator={false}
                initialNumToRender={8}
                maxToRenderPerBatch={8}
                windowSize={5}
                // Important for selection to re-render properly items
                extraData={{ isSelectionMode, selectedSectionIds }}
            />

            {/* Selection Action Bar */}
            {isSelectionMode ? (
                <SelectionActionBar
                    selectedCount={selectedSectionIds.size}
                    onClear={cancelSelection}
                    onDelete={handleBatchDeleteRequest}
                />
            ) : (
                <FloatingActionButton
                    label="Crear sección"
                    onPress={onCreateSection}
                />
            )}

            <SectionOptionsModal
                visible={isOptionsVisible}
                onClose={() => setOptionsVisible(false)}
                section={selectedSection}
                onOpen={handleOpenRequest}
                onEdit={handleEditRequest}
                onDuplicate={handleDuplicateRequest}
                onDelete={handleDeleteRequest}
            />

            <EditSectionModal
                visible={isEditVisible}
                onClose={() => setEditVisible(false)}
                onSave={onEditSection}
                section={selectedSection}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        width: '100%',
    },
    listContent: {
        padding: SPACING.xl,
        paddingBottom: 120,
    },
    listContentEmpty: {
        flexGrow: 1,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
        minHeight: 400,
    },
    emptyIconContainer: {
        width: SIZES.iconContainerEmpty,
        height: SIZES.iconContainerEmpty,
        borderRadius: SIZES.iconContainerEmpty / 2,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: '#FFEDD5',
    },
    emptyTitle: {
        fontSize: TYPOGRAPHY.size['3xl'],
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        marginBottom: SPACING.sm + 2,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: TYPOGRAPHY.size.xl,
        color: COLORS.textSecondary,
        textAlign: 'center',
        maxWidth: 280,
        lineHeight: TYPOGRAPHY.lineHeight.normal,
    },
});
