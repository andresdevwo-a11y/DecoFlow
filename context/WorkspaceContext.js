import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useData } from './DataContext';
import { useSettings } from './SettingsContext';

const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
    // ========================
    // 1. STATE DEFINITIONS
    // ========================

    // Canvas Identity
    const [currentCanvasId, setCurrentCanvasId] = useState(null);
    const [canvasName, setCanvasName] = useState('');

    // Canvas Content
    const [images, setImages] = useState([]);

    const [selectedImageId, setSelectedImageId] = useState(null);
    const [selectedImageIds, setSelectedImageIds] = useState([]); // NEW: Multi-selection

    // Canvas Configuration
    const [canvasSettings, setCanvasSettings] = useState({
        width: 1080,
        height: 1080,
        backgroundColor: '#FFFFFF',
        showGrid: false,
        snapToGrid: false,
        gridSize: 20,
    });

    // Viewport State
    const [zoomLevel, setZoomLevel] = useState(25);
    const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 0.25 });

    // History
    const [historyStack, setHistoryStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);

    // Status
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [saveStatus, setSaveStatus] = useState('idle');

    // Dependencies
    const { saveCanvas, canvases } = useData();
    const { isAutoSaveEnabled } = useSettings();

    // Auto-save timer ref
    const autoSaveTimeoutRef = useRef(null);

    // ========================
    // 2. LOGIC HELPERS
    // ========================

    const markAsChanged = useCallback(() => {
        setHasUnsavedChanges(true);
    }, []);

    const pushToHistory = useCallback((currentImages) => {
        setHistoryStack(prev => [...prev.slice(-49), currentImages]); // Limit 50 items
        setRedoStack([]);
        markAsChanged();
    }, [markAsChanged]);

    // ========================
    // 3. ACTIONS (Copied & Adapted from useCanvasLogic)
    // ========================

    const addImage = useCallback((newImage) => {
        pushToHistory(images);
        setImages(prev => [...prev, newImage]);
        setSelectedImageId(newImage.id);
        setSelectedImageIds([newImage.id]); // NEW
    }, [images, pushToHistory]);

    const updateImage = useCallback((update) => {
        // Only push hash/state if this is a "committed" interaction update.
        // We assume updateImage is called at end of interaction or for single-action toggles (lock/visibility).
        // For rapid updates (like live dragging), this would be bad, but we verified DraggableImage only calls onUpdate at END.
        pushToHistory(images);

        setImages(prevImages =>
            prevImages.map(img =>
                img.id === update.id
                    ? { ...img, ...update }
                    : img
            )
        );
        markAsChanged();
    }, [images, pushToHistory, markAsChanged]);

    const removeImage = useCallback((id) => {
        pushToHistory(images);
        setImages(prevImages => prevImages.filter(img => img.id !== id));
        if (selectedImageId === id) {
            setSelectedImageId(null);
        }
        setSelectedImageIds(prev => prev.filter(selId => selId !== id)); // NEW
    }, [images, selectedImageId, pushToHistory]);

    const duplicateImage = useCallback(() => {
        if (!selectedImageId) return;
        const imageToDuplicate = images.find(img => img.id === selectedImageId);
        if (!imageToDuplicate) return;

        pushToHistory(images);
        const newId = imageToDuplicate.type === 'group' ? `group_${Date.now()}` : `img_${Date.now()}`;

        let newImage = {
            ...imageToDuplicate,
            id: newId,
            x: imageToDuplicate.x + 20,
            y: imageToDuplicate.y + 20,
        };

        // If it's a group, we MUST regenerate IDs for all children to avoid collisions upon ungrouping
        if (newImage.type === 'group' && Array.isArray(newImage.children)) {
            newImage.children = newImage.children.map((child, index) => ({
                ...child,
                id: `img_${Date.now()}_${index}_copy` // Ensure unique ID for child
            }));
        }

        setImages(prev => [...prev, newImage]);
        setSelectedImageId(newId);
        setSelectedImageIds([newId]);
    }, [images, selectedImageId, pushToHistory]);

    const moveLayer = useCallback((direction) => {
        if (!selectedImageId) return;
        const index = images.findIndex(img => img.id === selectedImageId);
        if (index === -1) return;

        if (direction === 'up' && index < images.length - 1) {
            pushToHistory(images);
            setImages(prev => {
                const newImages = [...prev];
                [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
                return newImages;
            });
        } else if (direction === 'down' && index > 0) {
            pushToHistory(images);
            setImages(prev => {
                const newImages = [...prev];
                [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
                return newImages;
            });
        }
    }, [images, selectedImageId, pushToHistory]);

    const flipImage = useCallback((axis) => {
        if (!selectedImageId) return;
        pushToHistory(images);
        updateImage({
            id: selectedImageId,
            [axis === 'H' ? 'flipH' : 'flipV']: !images.find(i => i.id === selectedImageId)[axis === 'H' ? 'flipH' : 'flipV']
        });
    }, [images, selectedImageId, pushToHistory, updateImage]);

    const centerImage = useCallback(() => {
        if (!selectedImageId) return;
        pushToHistory(images);
        updateImage({ id: selectedImageId, x: 100, y: 200 }); // Simple centering (improve later if needed)
    }, [images, selectedImageId, pushToHistory, updateImage]);

    const clearCanvas = useCallback(() => {
        pushToHistory(images);
        setImages([]);
        setSelectedImageId(null);
        setSelectedImageIds([]); // NEW
    }, [images, pushToHistory]);

    const reorderImages = useCallback((newImages) => {
        pushToHistory(images);
        setImages(newImages);
    }, [images, pushToHistory]);

    // NEW: Selection & Grouping Logic
    const toggleSelection = useCallback((id) => {
        if (!id) {
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
            // Sync primary
            if (newSelection.length === 1) setSelectedImageId(newSelection[0]);
            else if (newSelection.length === 0) setSelectedImageId(null);
            else setSelectedImageId(newSelection[newSelection.length - 1]);

            return newSelection;
        });
    }, []);

    const handleLongPress = useCallback((id) => {
        if (!id) return;
        setSelectedImageIds(prev => {
            if (prev.includes(id)) return prev;
            return [...prev, id];
        });
        setSelectedImageId(id);
    }, []);

    const groupSelectedImages = useCallback(() => {
        if (selectedImageIds.length < 2) return;
        const itemsToGroup = images.filter(img => selectedImageIds.includes(img.id));
        if (itemsToGroup.length < 2) return;

        pushToHistory(images);

        // Helper: Calculate rotated corners
        const getTransformedCorners = (img) => {
            const w = img.width * (img.scale || 1);
            const h = img.height * (img.scale || 1);
            const r = img.rotation || 0;

            // Center of the image
            const cx = img.x + img.width / 2;
            const cy = img.y + img.height / 2;

            // Unrotated corners relative to center
            const corners = [
                { x: -w / 2, y: -h / 2 }, // TL
                { x: w / 2, y: -h / 2 },  // TR
                { x: w / 2, y: h / 2 },   // BR
                { x: -w / 2, y: h / 2 }   // BL
            ];

            // Rotate and translate back
            return corners.map(p => ({
                x: (p.x * Math.cos(r) - p.y * Math.sin(r)) + cx,
                y: (p.x * Math.sin(r) + p.y * Math.cos(r)) + cy
            }));
        };

        // 1. Calculate AABB of all selected items
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        itemsToGroup.forEach(img => {
            const corners = getTransformedCorners(img);
            corners.forEach(p => {
                minX = Math.min(minX, p.x);
                minY = Math.min(minY, p.y);
                maxX = Math.max(maxX, p.x);
                maxY = Math.max(maxY, p.y);
            });
        });

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
            scale: 1, // Group starts at scale 1
            flipH: false,
            flipV: false,
            // 3. Transform children to be relative to the unrotated group (which is 0 rotation initially)
            // Since group is 0 rot, relative pos is just childPos - groupPos (but child needs to keep its own rotation/scale)
            children: itemsToGroup.map(img => ({
                ...img,
                // The child's X/Y in DraggableImage are "top-left of unrotated box".
                // We need to keep them such that the visual result is identical.
                // Relative X = Absolute X - Group X
                x: img.x - groupX,
                y: img.y - groupY,
                parentOriginalId: img.id
            }))
        };

        const remainingImages = images.filter(img => !selectedImageIds.includes(img.id));
        setImages([...remainingImages, groupItem]);
        setSelectedImageId(newGroupId);
        setSelectedImageIds([newGroupId]);
    }, [images, selectedImageIds, pushToHistory]);

    const ungroupSelectedImage = useCallback(() => {
        if (!selectedImageId) return;
        const group = images.find(img => img.id === selectedImageId);
        if (!group || group.type !== 'group') return;

        pushToHistory(images);

        const gX = group.x; // Group Left
        const gY = group.y; // Group Top
        const gW = group.width;
        const gH = group.height;
        const gScale = group.scale || 1;
        const gRot = group.rotation || 0;

        // Group Center (Pivot for rotation/scale)
        // Note: The DraggableImage applies transforms around the center of the element.
        // The element is positioned at gX, gY, then Scaled, then Rotated.
        const gCx = gX + gW / 2;
        const gCy = gY + gH / 2;

        const restoredChildren = group.children.map(child => {
            // Child properties in Local Group Space (Unscaled, Unrotated Group Top-Left is 0,0)
            const cRelativeX = child.x;
            const cRelativeY = child.y;
            const cW = child.width;
            const cH = child.height;
            const cCx = cRelativeX + cW / 2;
            const cCy = cRelativeY + cH / 2;

            // 1. Shift to Center-Relative coordinates (relative to Group Center unrotated/unscaled)
            const dx = cCx - gW / 2;
            const dy = cCy - gH / 2;

            // 2. Apply Group Scale
            const dxScaled = dx * gScale;
            const dyScaled = dy * gScale;

            // 3. Apply Group Rotation
            const rotatedX = dxScaled * Math.cos(gRot) - dyScaled * Math.sin(gRot);
            const rotatedY = dxScaled * Math.sin(gRot) + dyScaled * Math.cos(gRot);

            // 4. Transform back to World Coordinates (Add Group World Center)
            const childWorldCx = gCx + rotatedX;
            const childWorldCy = gCy + rotatedY;

            // 5. Final Top-Left Position in World Space
            const childWorldX = childWorldCx - cW / 2;
            const childWorldY = childWorldCy - cH / 2;

            // 6. Final Scale and Rotation
            // Scale multiplies
            const childWorldScale = (child.scale || 1) * gScale;
            // Rotation adds
            const childWorldRotation = (child.rotation || 0) + gRot;

            return {
                ...child,
                x: childWorldX,
                y: childWorldY,
                scale: childWorldScale,
                rotation: childWorldRotation,
                id: child.id // Ensure ID persists
            };
        });

        const otherImages = images.filter(img => img.id !== selectedImageId);
        setImages([...otherImages, ...restoredChildren]);

        // Select the ungrouped items
        setSelectedImageId(null);
        setSelectedImageIds(restoredChildren.map(c => c.id));
    }, [images, selectedImageId, pushToHistory]);



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

    // ========================
    // 4. WORKSPACE MANAGEMENT (Load/Reset)
    // ========================

    const loadCanvas = useCallback((initialData) => {
        // Find latest version from updated canvases list if possible
        const latestCanvas = canvases.find(c => c.id === initialData?.id);
        const sourceData = latestCanvas || initialData;

        if (sourceData) {
            setCurrentCanvasId(sourceData.id);
            setCanvasName(sourceData.name || '');

            if (sourceData.data) {
                const data = typeof sourceData.data === 'string' ? JSON.parse(sourceData.data) : sourceData.data;

                setImages(data.images || []);
                setCanvasSettings(data.canvasSettings || {
                    width: 1080, height: 1080, backgroundColor: '#FFFFFF', showGrid: false, snapToGrid: false, gridSize: 20
                });

                if (data.viewport) {
                    setViewport(data.viewport);
                    if (data.viewport.scale) setZoomLevel(Math.round(data.viewport.scale * 100));
                } else if (data.zoomLevel) {
                    setZoomLevel(data.zoomLevel);
                    setViewport({ x: 0, y: 0, scale: data.zoomLevel / 100 });
                }
            }
        } else {
            // New Canvas fallback (should use resetWorkspace usually, but this handles partial data)
            resetWorkspace();
        }

        // Reset History on Load
        setHistoryStack([]);
        setRedoStack([]);
        setHasUnsavedChanges(false);
        setSaveStatus('idle');
    }, [canvases]);

    const resetWorkspace = useCallback(() => {
        setCurrentCanvasId(null);
        setCanvasName('');
        setImages([]);
        setSelectedImageId(null);
        setSelectedImageIds([]); // NEW
        setCanvasSettings({
            width: 1080,
            height: 1080,
            backgroundColor: '#FFFFFF',
            showGrid: false,
            snapToGrid: false,
            gridSize: 20,
        });
        setZoomLevel(25);
        setViewport({ x: 0, y: 0, scale: 0.25 });
        setHistoryStack([]);
        setRedoStack([]);
        setHasUnsavedChanges(false);
        setSaveStatus('idle');
    }, []);

    // ========================
    // 5. SAVING LOGIC (With Auto-Save)
    // ========================

    // Reactive: Check if current canvas was deleted externally
    useEffect(() => {
        if (currentCanvasId && canvases) {
            // If we have an active canvas ID, but it's not in the latest canvases list...
            const exists = canvases.some(c => c.id === currentCanvasId);
            if (!exists) {
                // ...it must have been deleted. Reset the workspace to avoid "zombie" state.
                resetWorkspace();
            }
        }
    }, [currentCanvasId, canvases, resetWorkspace]);

    const executeSave = async (nameToSave, isAutoSave = false, thumbnailUri = null, currentViewport = null) => {
        try {
            if (!isAutoSave) setSaveStatus('saving');

            const isNew = !currentCanvasId;
            const canvasId = currentCanvasId || `canvas_${Date.now()}`;

            // Use provided viewport (from ref) or fall back to state
            const toSave = currentViewport || viewport;

            const canvasData = {
                id: canvasId,
                name: nameToSave,
                data: {
                    images,
                    canvasSettings,
                    zoomLevel,
                    viewport: toSave
                },
                createdAt: new Date().toISOString()
            };

            const savedCanvas = await saveCanvas(canvasData, thumbnailUri);

            if (savedCanvas && savedCanvas.data && savedCanvas.data.images) {
                // Update images with persisted URIs if needed
                setImages(savedCanvas.data.images);
            }

            // Update local state to match saved state
            // This prevents "jump" when ID triggers the sync effect
            if (toSave) {
                setViewport(toSave);
                if (toSave.scale) setZoomLevel(Math.round(toSave.scale * 100));
            }

            setCurrentCanvasId(canvasId);
            setCanvasName(nameToSave);
            setHasUnsavedChanges(false);
            setSaveStatus('saved');
            return true;
        } catch (error) {
            console.error("Save error:", error);
            setSaveStatus('error');
            return false;
        }
    };

    // Auto-Save Effect - MOVED TO UI LAYER (WorkspaceScreen) to enable Thumbnail Capture
    // useEffect(() => {
    //     if (currentCanvasId && hasUnsavedChanges && isAutoSaveEnabled) {
    //         if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    //         setSaveStatus('saving'); // Indicate pending save
    //
    //         autoSaveTimeoutRef.current = setTimeout(() => {
    //             executeSave(canvasName, true, null, viewport);
    //         }, 2000);
    //     }
    // }, [images, canvasSettings, hasUnsavedChanges, currentCanvasId, isAutoSaveEnabled, canvasName, viewport]);

    // Cleanup timeout
    useEffect(() => {
        return () => { if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current); };
    }, []);

    const value = {
        // State
        currentCanvasId,
        canvasName, setCanvasName,
        images, selectedImageId, setSelectedImageId,
        selectedImageIds, setSelectedImageIds, // NEW
        canvasSettings, setCanvasSettings,
        zoomLevel, setZoomLevel,
        viewport, setViewport,
        hasUnsavedChanges, setHasUnsavedChanges,
        saveStatus, setSaveStatus,
        canUndo: historyStack.length > 0,
        canRedo: redoStack.length > 0,

        // Actions
        addImage, updateImage, removeImage, duplicateImage,
        moveLayer, flipImage, centerImage, clearCanvas, reorderImages,
        handleUndo, handleRedo,
        // Grouping
        toggleSelection, handleLongPress, groupSelectedImages, ungroupSelectedImage, // NEW

        // Workspace Ops
        loadCanvas,
        resetWorkspace,
        executeSave,
    };

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
};

export const useWorkspace = () => {
    const context = useContext(WorkspaceContext);
    if (!context) throw new Error("useWorkspace must be used within WorkspaceProvider");
    return context;
};
