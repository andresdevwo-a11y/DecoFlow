import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, StatusBar, Share, BackHandler, Alert, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';

// Canvas Components
import CanvasView from '../components/workspace/CanvasView';
import WorkspaceHeader from '../components/workspace/WorkspaceHeader';

// UI Components
import LeftSidePanel from '../components/workspace/panels/LeftSidePanel';
import LayersPanel from '../components/workspace/panels/LayersPanel';
import ContextualToolbar from '../components/workspace/toolbars/ContextualToolbar';
import MultiSelectToolbar from '../components/workspace/toolbars/MultiSelectToolbar'; // NEW
import FloatingControls from '../components/workspace/toolbars/FloatingControls';
import ToastNotification from '../components/ui/ToastNotification';

// Modals
import ImageSourceModal from '../components/workspace/modals/ImageSourceModal';
import CanvasSettingsModal from '../components/workspace/modals/CanvasSettingsModal';
import ProductPickerModal from '../components/workspace/modals/ProductPickerModal';
import ConfirmationModal from '../components/workspace/modals/ConfirmationModal';
import CreateCanvasModal from '../components/CreateCanvasModal'; // Used for First Save Naming


import { useWorkspace } from '../context/WorkspaceContext';
import { useSettings } from '../context/SettingsContext';

export default function WorkspaceScreen({ onBack, isVisible }) { // Added isVisible prop
    const insets = useSafeAreaInsets();

    const {
        // State
        currentCanvasId,
        canvasName,
        images,
        selectedImageId, setSelectedImageId,
        selectedImageIds, setSelectedImageIds, toggleSelection, handleLongPress, groupSelectedImages, ungroupSelectedImage, // NEW
        canvasSettings, setCanvasSettings,
        zoomLevel, setZoomLevel,
        viewport, setViewport,
        hasUnsavedChanges, setHasUnsavedChanges,
        saveStatus,
        canUndo, canRedo,

        // Actions
        addImage, updateImage, removeImage, duplicateImage,
        moveLayer, flipImage, centerImage, clearCanvas, reorderImages,
        handleUndo, handleRedo,
        executeSave,
        resetWorkspace,
        setSaveStatus // Needed for manual status update
    } = useWorkspace();

    const { isAutoSaveEnabled } = useSettings();
    const autoSaveTimeoutRef = useRef(null);

    // Local UI State (Panel visibility etc.)
    const [isPanelExpanded, setIsPanelExpanded] = useState(false);
    const [isLayersPanelVisible, setLayersPanelVisible] = useState(false);
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false); // NEW

    // Sync Multi-Select Mode (e.g. triggered by Ungroup action)
    useEffect(() => {
        if (selectedImageIds.length > 1 && !isMultiSelectMode) {
            setIsMultiSelectMode(true);
        }
    }, [selectedImageIds, isMultiSelectMode]);

    // Modal states
    const [isSourceModalVisible, setSourceModalVisible] = useState(false);
    const [isProductPickerVisible, setProductPickerVisible] = useState(false);
    const [isClearModalVisible, setClearModalVisible] = useState(false);
    const [isCanvasSettingsVisible, setCanvasSettingsVisible] = useState(false);
    const [isNameModalVisible, setNameModalVisible] = useState(false);

    // Feedback State
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
    const showToast = (message, type = 'success') => setToast({ visible: true, message, type });

    const canvasRef = useRef();

    // ========================
    // Auto-Save with Thumbnail
    // ========================
    useEffect(() => {
        if (currentCanvasId && hasUnsavedChanges && isAutoSaveEnabled) {
            if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
            setSaveStatus('saving'); // UI feedback immediately

            autoSaveTimeoutRef.current = setTimeout(async () => {
                try {
                    // Capture Thumbnail
                    let thumbnailUri = null;
                    if (canvasRef.current && canvasRef.current.capture) {
                        try {
                            thumbnailUri = await canvasRef.current.capture();
                        } catch (e) {
                            console.warn("Auto-save capture failed", e);
                        }
                    }

                    // Get fresh viewport
                    let currentVP = null;
                    if (canvasRef.current && canvasRef.current.getViewport) {
                        currentVP = canvasRef.current.getViewport();
                    }

                    // Execute Save
                    await executeSave(canvasName, true, thumbnailUri, currentVP);
                } catch (err) {
                    console.error("Auto-save failed", err);
                }
            }, 2000); // 2 second debounce
        }

        return () => {
            if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
        };
    }, [hasUnsavedChanges, currentCanvasId, isAutoSaveEnabled, canvasName, executeSave, setSaveStatus]);


    // ========================
    // Lifecycle: Viewport Sync
    // ========================

    // 1. On Mount OR when Canvas ID Changes (New/Open), sync viewport from Context -> View
    useEffect(() => {
        // Only sync if we have a valid canvas and it's visible (or just loaded)
        setTimeout(() => {
            if (canvasRef.current && canvasRef.current.setViewport) {
                canvasRef.current.setViewport(viewport);
            }
        }, 100);
    }, [currentCanvasId]);

    // 2. When hiding (navigating away), sync View -> Context so context is fresh
    useEffect(() => {
        if (!isVisible && canvasRef.current && canvasRef.current.getViewport) {
            const currentVP = canvasRef.current.getViewport();
            setViewport(currentVP);
        }
    }, [isVisible]);

    // Also sync zoom level for UI if changed in context
    useEffect(() => {
        // If external zoom change happened?
        // Mostly we drive zoom from here.
    }, [zoomLevel]);


    // ========================
    // Back Handler
    // ========================
    useEffect(() => {
        if (!isVisible) return;

        const backAction = () => {
            handleBackRequest();
            return true;
        };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [isVisible, hasUnsavedChanges, images]);

    const handleBackRequest = async () => {
        // Only auto-save if we are editing an EXISTING canvas.
        // If it's a new canvas (null ID), pressing back should discard/exit without creating a file.
        if (currentCanvasId) {
            // Capture latest thumbnail and state before leaving
            try {
                if (canvasRef.current) {
                    // 1. Capture Thumbnail
                    let thumbnailUri = null;
                    if (canvasRef.current.capture) {
                        thumbnailUri = await canvasRef.current.capture();
                    }

                    // 2. Get Viewport
                    let currentVP = null;
                    if (canvasRef.current.getViewport) {
                        currentVP = canvasRef.current.getViewport();
                    }

                    // 3. Save silently (treat as auto-save but with guaranteed thumbnail)
                    if (thumbnailUri || currentVP) {
                        await executeSave(canvasName, true, thumbnailUri, currentVP);
                    }
                }
            } catch (e) {
                console.error("Failed to auto-save on exit", e);
            }
        }

        onBack();
    };

    // ========================
    // Zoom UI Handlers
    // ========================
    const handleZoomUpdate = useCallback((scale, viewportData) => {
        const newZoom = Math.round(scale * 100);
        if (Math.abs(newZoom - zoomLevel) > 1) {
            setZoomLevel(newZoom);
        }
        // We don't spam context updates for viewport. We pull on save/unmount.
    }, [zoomLevel, setZoomLevel]);

    const handleZoomIn = () => {
        const newZoom = Math.min(zoomLevel + 25, 300);
        if (canvasRef.current && canvasRef.current.setZoom) {
            canvasRef.current.setZoom(newZoom / 100);
        }
    };
    const handleZoomOut = () => {
        const newZoom = Math.max(zoomLevel - 25, 25);
        if (canvasRef.current && canvasRef.current.setZoom) {
            canvasRef.current.setZoom(newZoom / 100);
        }
    };
    const handleZoomReset = () => {
        if (canvasRef.current && canvasRef.current.setViewport) {
            canvasRef.current.setViewport({ x: 0, y: 0, scale: 1 });
        }
    };

    // ========================
    // Panel & Tools
    // ========================
    const handlePanelAction = (actionId) => {
        switch (actionId) {
            case 'add': setSourceModalVisible(true); break;
            case 'layers': setLayersPanelVisible(true); break;
            case 'settings': setCanvasSettingsVisible(true); break;
        }
    };

    const handleConfirmClear = () => {
        clearCanvas();
        setClearModalVisible(false);
    };

    const handleContextualAction = (actionId) => {
        switch (actionId) {
            case 'delete': if (selectedImageId) removeImage(selectedImageId); break;
            case 'duplicate': duplicateImage(); break;
            case 'layerUp': moveLayer('up'); break;
            case 'layerDown': moveLayer('down'); break;
            case 'flipH': flipImage('H'); break;
            case 'flipV': flipImage('V'); break;
            case 'center': centerImage(); break;
            case 'ungroup': ungroupSelectedImage(); break; // NEW
        }
    };

    // NEW: Multi-Select Handlers
    const handleImageSelect = (id) => {
        if (!id) {
            // Tap background
            setIsMultiSelectMode(false);
            setSelectedImageId(null);
            setSelectedImageIds([]);
            return;
        }

        if (isMultiSelectMode) {
            toggleSelection(id);
        } else {
            // Single Select
            setSelectedImageId(id);
            setSelectedImageIds([id]);
        }
    };

    const handleLongPressAction = (id) => {
        if (!id) return;
        setIsMultiSelectMode(true);
        handleLongPress(id); // Context helper ensures it's added
    };

    const handleMultiSelectAction = (actionId) => {
        if (actionId === 'delete') {
            selectedImageIds.forEach(id => removeImage(id));
            setIsMultiSelectMode(false);
        } else if (actionId === 'group') {
            groupSelectedImages();
            setIsMultiSelectMode(false);
        }
    };

    // ========================
    // Image Sources
    // ========================
    const addImageToCanvas = (imageUri, originalWidth = 200, originalHeight = 200) => {
        // Calculate dimensions maintaining aspect ratio, max 300px
        const MAX_SIZE = 300;
        let width = originalWidth;
        let height = originalHeight;

        if (width > MAX_SIZE || height > MAX_SIZE) {
            const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }

        const newImage = {
            id: `img_${Date.now()}`,
            source: { uri: imageUri },
            width,
            height,
            x: 100, // Center X (approx) - logic can be improved to center in viewport
            y: 200, // Center Y (approx)
            rotation: 0,
            flipH: false,
            flipV: false,
        };
        addImage(newImage);
    };

    const pickImageFromGallery = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 1,
                // aspect: [1, 1], // Removed to allow free cropping/full selection
            });
            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                addImageToCanvas(asset.uri, asset.width, asset.height);
            }
        } catch (error) { showToast('Error al acceder a la galería', 'error'); }
    };

    const takePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                showToast('Se necesita permiso de cámara', 'error');
                return;
            }
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                quality: 1,
                // aspect: [1, 1], // Removed to allow free cropping
            });
            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                addImageToCanvas(asset.uri, asset.width, asset.height);
            }
        } catch (error) { showToast('Error al acceder a la cámara', 'error'); }
    };

    const handleSourceSelect = (source) => {
        setSourceModalVisible(false);

        // Handle File options (source object)
        if (typeof source === 'object' && source.type === 'file') {
            setTimeout(() => {
                Image.getSize(source.uri, (width, height) => {
                    addImageToCanvas(source.uri, width, height);
                }, (error) => {
                    console.error("Error getting image size", error);
                    addImageToCanvas(source.uri); // Fallback
                });
            }, 300);
            return;
        }

        // Handle string commands
        setTimeout(() => {
            switch (source) {
                case 'products': setProductPickerVisible(true); break;
                case 'gallery': pickImageFromGallery(); break;
                case 'camera': takePhoto(); break;
            }
        }, 300);
    };

    const handleProductSelect = (product) => {
        setProductPickerVisible(false);
        if (!product.image) { showToast('Producto sin imagen', 'error'); return; }

        // Use Image.getSize to get dimensions and add with correct aspect ratio
        Image.getSize(product.image, (width, height) => {
            addImageToCanvas(product.image, width, height);
        }, (error) => {
            console.error("Failed to get product image size", error);
            // Fallback to square if size fails
            addImageToCanvas(product.image, 200, 200);
        });
    };

    // ========================
    // Saving
    // ========================
    // ========================
    // Saving
    // ========================
    const handleDirectSave = async () => {
        if (images.length === 0) { showToast('El lienzo está vacío', 'info'); return; }

        if (!currentCanvasId) {
            setNameModalVisible(true);
            return;
        }

        // 1. Capture Thumbnail
        let thumbnailUri = null;
        try {
            if (canvasRef.current && canvasRef.current.capture) {
                thumbnailUri = await canvasRef.current.capture();
            }
        } catch (e) {
            console.error("Failed to capture thumbnail", e);
        }

        // 2. Get Viewport
        let currentVP = null;
        if (canvasRef.current && canvasRef.current.getViewport) {
            currentVP = canvasRef.current.getViewport();
        }

        // 3. Save
        executeSave(canvasName, false, thumbnailUri, currentVP).then((success) => {
            if (success) showToast("Cambios guardados");
            else showToast("Error al guardar", "error");
        });
    };

    const handleFirstSaveConfirm = async (name) => {
        setNameModalVisible(false);

        // 1. Capture Thumbnail
        let thumbnailUri = null;
        try {
            if (canvasRef.current && canvasRef.current.capture) {
                thumbnailUri = await canvasRef.current.capture();
            }
        } catch (e) {
            console.error("Failed to capture thumbnail", e);
        }

        // 2. Get Viewport
        let currentVP = null;
        if (canvasRef.current && canvasRef.current.getViewport) {
            currentVP = canvasRef.current.getViewport();
        }

        // 3. Save
        executeSave(name, false, thumbnailUri, currentVP).then((success) => {
            if (success) showToast("Lienzo creado correctamente");
            else showToast("Error al guardar", "error");
        });
    };

    // ========================
    // Sharing
    // ========================
    const handleShareCanvas = async () => {
        if (images.length === 0) return;
        try {
            const uri = await canvasRef.current?.capture();
            if (uri && (await Sharing.isAvailableAsync())) {
                await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: 'Compartir diseño' });
            }
        } catch (e) { showToast('Error al compartir', 'error'); }
    };


    return (
        <View style={styles.container}>
            {isVisible && <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />}
            <ToastNotification visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast(prev => ({ ...prev, visible: false }))} />

            <WorkspaceHeader
                onBack={handleBackRequest}
                onSave={handleDirectSave}
                onShare={handleShareCanvas}
                title={canvasName || "Sin Título"}
                saveStatus={saveStatus}
            />

            <CanvasView
                ref={canvasRef}
                images={images}
                selectedImageId={selectedImageId}
                selectedImageIds={selectedImageIds} // NEW
                onSelectImage={handleImageSelect} // CHANGED
                onLongPress={handleLongPressAction} // NEW
                onUpdateImage={updateImage}
                onRemoveImage={removeImage}
                canvasSettings={canvasSettings}
                onZoomChange={handleZoomUpdate}
            />


            <LeftSidePanel
                onAction={handlePanelAction}
                selectedImageId={selectedImageId}
                isExpanded={isPanelExpanded}
                onToggleExpand={() => setIsPanelExpanded(!isPanelExpanded)}
            />

            <FloatingControls
                zoomLevel={zoomLevel}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onZoomReset={handleZoomReset}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={canUndo}
                canRedo={canRedo}
            />

            {/* Toolbar Switcher */}
            {isMultiSelectMode ? (
                <MultiSelectToolbar
                    onAction={handleMultiSelectAction}
                    selectedCount={selectedImageIds.length}
                />
            ) : selectedImageId ? (
                <ContextualToolbar
                    visible={true}
                    onAction={handleContextualAction}
                    isGroup={images.find(i => i.id === selectedImageId)?.type === 'group'}
                />
            ) : (
                null
            )}


            {/* Modals */}
            <ImageSourceModal visible={isSourceModalVisible} onClose={() => setSourceModalVisible(false)} onSelect={handleSourceSelect} />

            <CanvasSettingsModal
                visible={isCanvasSettingsVisible}
                onClose={() => setCanvasSettingsVisible(false)}
                onApply={(settings) => {
                    setCanvasSettings(settings);
                    setHasUnsavedChanges(true);
                }}
                currentSettings={canvasSettings}
            />

            <ProductPickerModal visible={isProductPickerVisible} onClose={() => setProductPickerVisible(false)} onSelect={handleProductSelect} />

            <ConfirmationModal
                visible={isClearModalVisible}
                onClose={() => setClearModalVisible(false)}
                onConfirm={handleConfirmClear}
                title="Limpiar Canvas"
                message="¿Eliminar todo? Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
            />

            <CreateCanvasModal
                visible={isNameModalVisible}
                onClose={() => setNameModalVisible(false)}
                onCreate={handleFirstSaveConfirm}
            />



            <LayersPanel
                visible={isLayersPanelVisible}
                onClose={() => setLayersPanelVisible(false)}
                layers={images}
                selectedLayerId={selectedImageId}
                onSelectLayer={setSelectedImageId}
                onToggleLock={(id) => { const img = images.find(i => i.id === id); if (img) updateImage({ id, locked: !img.locked }); }}
                onToggleVisibility={(id) => { const img = images.find(i => i.id === id); if (img) updateImage({ id, visible: img.visible === false }); }}
                onReorderLayers={reorderImages}
                onDeleteLayer={(id) => { removeImage(id); setLayersPanelVisible(false); }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
});
