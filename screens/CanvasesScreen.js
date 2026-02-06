import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import { useSettings } from '../context/SettingsContext';
import { useAlert } from '../context/AlertContext'; // Updated import
import { COLORS, TYPOGRAPHY, SPACING, SIZES, SHADOWS } from '../constants/Theme';

import CanvasCard from '../components/CanvasCard';
import CanvasOptionsModal from '../components/CanvasOptionsModal';
import RenameCanvasModal from '../components/RenameCanvasModal';
import SearchHeader from '../components/SearchHeader';
import EmptyState from '../components/EmptyState';

// Local view mode state if not in global settings, but let's re-use global for consistency?
// Or just local since it wasn't specified. Let's use local for now or props if passed.
// InventoryScreen uses useSettings(). Let's try to consistency.
import FloatingActionButton from '../components/FloatingActionButton'; // Import FAB
import { TouchableOpacity } from 'react-native';

export default function CanvasesScreen({ onOpenCanvas, onCreateCanvas }) {
    const { canvases, deleteCanvas, renameCanvas } = useData();
    const { canvasViewMode = 'Grid', canvasSortBy = 'Nombre', confirmCanvasDelete = true } = useSettings() || {};
    const { showAlert, showDelete } = useAlert(); // Hook

    const [selectedCanvas, setSelectedCanvas] = useState(null);
    const [isOptionsVisible, setOptionsVisible] = useState(false);
    const [isRenameVisible, setRenameVisible] = useState(false);
    // Removed isDeleteVisible and loading state
    const [searchText, setSearchText] = useState('');

    // Filtering & Sorting
    const filteredCanvases = useMemo(() => {
        let result = canvases.filter(c =>
            c.name.toLowerCase().includes(searchText.toLowerCase())
        );

        // Apply sorting based on canvasSortBy setting
        switch (canvasSortBy) {
            case 'Nombre':
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'Fecha':
                result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'Modificación':
            default:
                result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                break;
        }
        return result;
    }, [canvases, searchText, canvasSortBy]);

    // Handlers
    const handleOptionsPress = useCallback((canvas) => {
        setSelectedCanvas(canvas);
        setOptionsVisible(true);
    }, []);

    const handleOpenRequest = () => {
        if (selectedCanvas && onOpenCanvas) {
            onOpenCanvas(selectedCanvas);
        }
        setOptionsVisible(false);
        setSelectedCanvas(null);
    };

    const handleRenameRequest = () => {
        setOptionsVisible(false);
        // Delay slightly to allow options modal to close smoothly
        setTimeout(() => setRenameVisible(true), 300);
    };

    const handleConfirmRename = (newName) => {
        if (selectedCanvas && renameCanvas) {
            renameCanvas(selectedCanvas.id, newName);
        }
        setRenameVisible(false);
        setSelectedCanvas(null);
    };

    const handleDeleteRequest = useCallback(() => {
        setOptionsVisible(false);
        if (confirmCanvasDelete) {
            // Show confirmation modal using context
            setTimeout(() => {
                showDelete({
                    title: "¿Eliminar lienzo?",
                    message: `¿Estás seguro de que quieres eliminar "${selectedCanvas?.name}" ? `,
                    onConfirm: async () => {
                        try {
                            if (selectedCanvas) {
                                await deleteCanvas(selectedCanvas.id);
                                setSelectedCanvas(null);
                            }
                        } catch (error) {
                            showAlert("error", "Error", "No se pudo eliminar el lienzo.");
                        }
                    }
                });
            }, 300);
        } else {
            // Delete directly without confirmation. 
            if (selectedCanvas) {
                deleteCanvas(selectedCanvas.id).catch(() => showAlert("error", "Error", "Fallo al eliminar"));
            }
            setSelectedCanvas(null);
        }
    }, [confirmCanvasDelete, selectedCanvas, deleteCanvas, showDelete, showAlert]);

    // Render Items
    const renderItem = useCallback(({ item }) => (
        <CanvasCard
            canvas={item}
            onPress={() => onOpenCanvas && onOpenCanvas(item)}
            onOptionsPress={() => handleOptionsPress(item)}
            viewMode={canvasViewMode}
        />
    ), [handleOptionsPress, canvasViewMode, onOpenCanvas]);

    const renderEmptyState = useCallback(() => (
        <EmptyState
            icon={searchText ? "search" : "layout"}
            title={searchText ? "No se encontraron diseños" : "No hay diseños guardados"}
            description={searchText ? "Intenta con otro nombre" : "Crea uno nuevo en la Mesa de Trabajo y guárdalo."}
        />
    ), [searchText]);

    return (
        <View style={styles.container}>
            <FlatList
                data={filteredCanvases}
                keyExtractor={(item) => item.id}
                key={canvasViewMode}
                renderItem={renderItem}
                numColumns={canvasViewMode === 'Grid' ? 2 : 1}
                columnWrapperStyle={canvasViewMode === 'Grid' ? styles.columnWrapper : null}
                contentContainerStyle={[
                    styles.listContent,
                    filteredCanvases.length === 0 && styles.listContentEmpty
                ]}
                ListHeaderComponent={
                    canvases.length > 0 ? (
                        <SearchHeader
                            title="Mis Diseños"
                            placeholder="Buscar diseño..."
                            showSearch={true}
                            searchText={searchText}
                            onSearchChange={setSearchText}
                        />
                    ) : null
                }
                ListEmptyComponent={renderEmptyState}
                showsVerticalScrollIndicator={false}
            />

            <FloatingActionButton
                label="Crear lienzo"
                onPress={onCreateCanvas}
            />

            <CanvasOptionsModal
                visible={isOptionsVisible}
                onClose={() => setOptionsVisible(false)}
                canvasName={selectedCanvas?.name}
                onOpen={handleOpenRequest}
                onRename={handleRenameRequest}
                onDelete={handleDeleteRequest}
            />

            <RenameCanvasModal
                visible={isRenameVisible}
                onClose={() => setRenameVisible(false)}
                onRename={handleConfirmRename}
                currentName={selectedCanvas?.name}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
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
    columnWrapper: {
        justifyContent: 'space-between',
    },
});

