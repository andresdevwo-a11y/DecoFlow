
import { useState, useRef, useCallback } from 'react';

export default function useCanvasLogic(initialData) {
    // Canvas state
    const [images, setImages] = useState([]);
    const [selectedImageId, setSelectedImageId] = useState(null);
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
        setSelectedImageId(newImage.id);
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
    }, [images, pushToHistory]);

    const reorderImages = useCallback((newImages) => {
        pushToHistory(images);
        setImages(newImages);
    }, [images, pushToHistory]);

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
        // History
        handleUndo,
        handleRedo,
        canUndo: historyStack.length > 0,
        canRedo: redoStack.length > 0
    };
}
