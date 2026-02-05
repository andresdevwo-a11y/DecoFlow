
import { useState, useRef, useCallback } from 'react';

export default function useCanvasLogic(initialData) {
    // Canvas state
    const [images, setImages] = useState([]);
    const [selectedImageId, setSelectedImageId] = useState(null);
    const [selectedImageIds, setSelectedImageIds] = useState([]); // Array of IDs for multi-selection
    const [zoomLevel, setZoomLevel] = useState(100);

    // History state for undo/redo
    const [historyStack, setHistoryStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);

    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Initialize logic if needed (usually handled by useEffect in component, 
    // but state init can be here if passed directly)

    // Helper to mark changes
    const markAsChanged = useCallback(() => {
        setHasUnsavedChanges(true);
    }, []);

    // History
    const pushToHistory = useCallback((currentImages) => {
        setHistoryStack(prev => [...prev.slice(-19), currentImages]); // Keep last 20 states
        setRedoStack([]); // Clear redo on new action
        markAsChanged();
    }, [markAsChanged]);

    const handleUndo = useCallback(() => {
        if (historyStack.length === 0) return;
        const previousState = historyStack[historyStack.length - 1];
        setRedoStack(prev => [...prev, images]);
        setImages(previousState);
        setHistoryStack(prev => prev.slice(0, -1));
        markAsChanged();
    }, [historyStack, images, markAsChanged]);

    const handleRedo = useCallback(() => {
        if (redoStack.length === 0) return;
        const nextState = redoStack[redoStack.length - 1];
        setHistoryStack(prev => [...prev, images]);
        setImages(nextState);
        setRedoStack(prev => prev.slice(0, -1));
        markAsChanged();
    }, [redoStack, images, markAsChanged]);

    // Image Operations
    const addImage = useCallback((newImage) => {
        pushToHistory(images);
        setImages(prev => [...prev, newImage]);
        // Set single selection for the new image
        setSelectedImageId(newImage.id);
        setSelectedImageIds([newImage.id]);
    }, [images, pushToHistory]);

    const updateImage = useCallback((update) => {
        setImages(prevImages =>
            prevImages.map(img =>
                img.id === update.id
                    ? { ...img, ...update }
                    : img
            )
        );
        markAsChanged();
    }, [markAsChanged]);

    const removeImage = useCallback((id) => {
        pushToHistory(images);
        setImages(prevImages => prevImages.filter(img => img.id !== id));
        if (selectedImageId === id) {
            setSelectedImageId(null);
        }
        // Also remove from multi-selection
        setSelectedImageIds(prev => prev.filter(selId => selId !== id));
    }, [images, selectedImageId, pushToHistory]);

    const duplicateImage = useCallback(() => {
        if (!selectedImageId) return;
        const imageToDuplicate = images.find(img => img.id === selectedImageId);
        if (!imageToDuplicate) return;

        pushToHistory(images);
        const newId = `img_${Date.now()}`;
        const newImage = {
            ...imageToDuplicate,
            id: newId,
            x: imageToDuplicate.x + 20,
            y: imageToDuplicate.y + 20,
        };
        setImages([...images, newImage]);
        setSelectedImageId(newId);
    }, [images, selectedImageId, pushToHistory]);

    // Layers
    const moveLayer = useCallback((direction) => { // 'up' or 'down'
        if (!selectedImageId) return;
        const index = images.findIndex(img => img.id === selectedImageId);
        if (index === -1) return;

        if (direction === 'up' && index < images.length - 1) {
            pushToHistory(images);
            const newImages = [...images];
            [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
            setImages(newImages);
        } else if (direction === 'down' && index > 0) {
            pushToHistory(images);
            const newImages = [...images];
            [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
            setImages(newImages);
        }
    }, [images, selectedImageId, pushToHistory]);

    // Transforms
    const flipImage = useCallback((axis) => { // 'H' or 'V'
        if (!selectedImageId) return;
        pushToHistory(images);
        setImages(prevImages =>
            prevImages.map(img =>
                img.id === selectedImageId
                    ? { ...img, [axis === 'H' ? 'flipH' : 'flipV']: !img[axis === 'H' ? 'flipH' : 'flipV'] }
                    : img
            )
        );
    }, [images, selectedImageId, pushToHistory]);

    const centerImage = useCallback(() => {
        if (!selectedImageId) return;
        pushToHistory(images);
        setImages(prevImages =>
            prevImages.map(img =>
                img.id === selectedImageId
                    ? { ...img, x: 100, y: 200 } // Ideally center based on canvas dims, but 100,200 was hardcoded in original
                    : img
            )
        );
    }, [images, selectedImageId, pushToHistory]);

    // Bulk actions
    const clearCanvas = useCallback(() => {
        pushToHistory(images);
        setImages([]);
        setSelectedImageId(null);
        setSelectedImageIds([]);
    }, [images, pushToHistory]);

}, [images, pushToHistory]);

// Selection Logic
const toggleSelection = useCallback((id) => {
    if (!id) {
        // Deselect all
        setSelectedImageId(null);
        setSelectedImageIds([]);
        return;
    }

    setSelectedImageIds(prev => {
        const isSelected = prev.includes(id);
        let newSelection;
        if (isSelected) {
            newSelection = prev.filter(item => item !== id);
        } else {
            newSelection = [...prev, id];
        }

        // Sync primary selectedImageId (usually the last selected or the single one)
        if (newSelection.length === 1) {
            setSelectedImageId(newSelection[0]);
        } else if (newSelection.length === 0) {
            setSelectedImageId(null);
        } else {
            // If multiple, maybe keep the last one as "primary" for properties? 
            // Or null if we want to show group tools only?
            // Let's keep the last added one as primary for now.
            setSelectedImageId(newSelection[newSelection.length - 1]);
        }

        return newSelection;
    });
}, []);

const handleLongPress = useCallback((id) => {
    if (!id) return;
    // Start multi-selection with this item if not already in it
    setSelectedImageIds(prev => {
        if (prev.includes(id)) return prev;
        return [...prev, id];
    });
    setSelectedImageId(id);
}, []);

// Grouping Logic
const groupSelectedImages = useCallback(() => {
    if (selectedImageIds.length < 2) return;

    const itemsToGroup = images.filter(img => selectedImageIds.includes(img.id));
    if (itemsToGroup.length < 2) return;

    pushToHistory(images);

    // 1. Calculate BBox
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    itemsToGroup.forEach(img => {
        minX = Math.min(minX, img.x);
        minY = Math.min(minY, img.y);
        maxX = Math.max(maxX, img.x + img.width);
        maxY = Math.max(maxY, img.y + img.height);
    });

    // Add padding? No, exact fit usually better for manipulation
    const groupX = minX;
    const groupY = minY;
    const groupW = maxX - minX;
    const groupH = maxY - minY;

    // 2. Create Group Item
    const newGroupId = `group_${Date.now()}`;
    const groupItem = {
        id: newGroupId,
        type: 'group',
        x: groupX,
        y: groupY,
        width: groupW,
        height: groupH,
        rotation: 0,
        scale: 1,
        children: itemsToGroup.map(img => ({
            ...img,
            // Make relative
            x: img.x - groupX,
            y: img.y - groupY,
            parentOriginalId: img.id
        }))
    };

    // 3. Update Images List
    const remainingImages = images.filter(img => !selectedImageIds.includes(img.id));
    setImages([...remainingImages, groupItem]);

    // 4. Select the new group
    setSelectedImageId(newGroupId);
    setSelectedImageIds([newGroupId]);

}, [images, selectedImageIds, pushToHistory]);

const ungroupSelectedImage = useCallback(() => {
    // Can only ungroup if 1 item is selected and it is a group
    if (!selectedImageId) return;

    const group = images.find(img => img.id === selectedImageId);
    if (!group || group.type !== 'group') return;

    pushToHistory(images);

    // 1. Restore Children Positions
    const gX = group.x;
    const gY = group.y;
    // NOTE: If group rotation/scale implemented, math needs update here.
    // Currently assuming scale=1, rotation=0 for group or robust logic needed.
    // For MVP, simple translation.

    const restoredChildren = group.children.map(child => {
        return {
            ...child,
            x: gX + child.x,
            y: gY + child.y,
            // Ensure unique IDs if needed, but keeping original usually fine unless duplicated
            id: child.id
        };
    });

    // 2. Update List
    const otherImages = images.filter(img => img.id !== selectedImageId);
    setImages([...otherImages, ...restoredChildren]);

    // 3. Select the restored children? Or Deselect?
    // Let's select them all so user can re-group if mistake
    const restoredIds = restoredChildren.map(c => c.id);
    setSelectedImageIds(restoredIds);
    if (restoredIds.length > 0) setSelectedImageId(restoredIds[restoredIds.length - 1]);
    else setSelectedImageId(null);

}, [images, selectedImageId, pushToHistory]);

return {
    images,
    setImages, // exposed for full reset or init
    selectedImageId,
    setSelectedImageId,
    zoomLevel,
    setZoomLevel,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    // Actions
    addImage,
    updateImage,
    removeImage,
    duplicateImage,
    moveLayer,
    flipImage,
    centerImage,
    clearCanvas,
    reorderImages,
    // Multi-Select & Grouping
    selectedImageIds,
    setSelectedImageIds,
    toggleSelection,
    handleLongPress,
    groupSelectedImages,
    ungroupSelectedImage,
    // History
    handleUndo,
    handleRedo,
    canUndo: historyStack.length > 0,
    canRedo: redoStack.length > 0
};
}
