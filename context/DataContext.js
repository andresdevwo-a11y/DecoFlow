import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as Database from '../services/Database';
import * as ImageService from '../services/ImageService';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
    const [sections, setSections] = useState([]);
    const [activeSection, setActiveSection] = useState(null);
    const [products, setProducts] = useState([]); // Products for the active section
    const [isLoading, setIsLoading] = useState(true);
    const [initializationError, setInitializationError] = useState(null);

    // Initialize DB and load sections on startup
    useEffect(() => {
        const init = async () => {
            try {
                await Database.initDatabase();

                await loadSections();
            } catch (error) {
                console.error("Initialization failed:", error);
                setInitializationError(error);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, []);



    // Manual Garbage Collection
    const runGarbageCollector = useCallback(async () => {
        try {
            console.log("Starting Manual Garbage Collection...");
            const allSections = await Database.getSections();
            const allProducts = await Database.getAllProducts();
            const allCanvases = await Database.getCanvases();

            const usedUris = new Set();

            // Collect URIs
            allSections.forEach(s => s.image && usedUris.add(s.image));
            allProducts.forEach(p => p.image && usedUris.add(p.image));

            allCanvases.forEach(c => {
                if (c.thumbnail) usedUris.add(c.thumbnail);
                if (c.data) {
                    try {
                        const data = JSON.parse(c.data);
                        if (data.images && Array.isArray(data.images)) {
                            data.images.forEach(img => {
                                if (img.source && img.source.uri) usedUris.add(img.source.uri);
                            });
                        }
                    } catch (e) { console.warn("GC: Failed to parse canvas data", c.id); }
                }
            });

            await ImageService.cleanOrphanedImages(usedUris);
            console.log("Manual Garbage Collection Completed.");
        } catch (error) {
            console.error("Manual GC failed:", error);
        }
    }, []);

    // Load sections (also clears active section/products for full refresh scenarios like reset)
    const loadSections = async () => {
        const loadedSections = await Database.getSections();
        setSections(loadedSections);
        // Clear active section and products to ensure UI updates after data reset
        setActiveSection(null);
        setProducts([]);
    };

    // Load products when active section changes
    useEffect(() => {
        const loadProducts = async () => {
            if (activeSection) {
                const loadedProducts = await Database.getProductsBySectionId(activeSection.id);
                setProducts(loadedProducts);
            } else {
                setProducts([]);
            }
        };
        loadProducts();
    }, [activeSection]);

    // --- Section Operations ---

    const addSection = useCallback(async (sectionData) => {
        let finalImage = sectionData.image;
        if (finalImage) {
            try {
                finalImage = await ImageService.copyToInternal(finalImage);
            } catch (e) {
                console.error("Failed to save section image:", e);
            }
        }

        const newSection = {
            id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...sectionData,
            image: finalImage
        };
        try {
            await Database.createSection(newSection);
            setSections(prev => [newSection, ...prev]);
        } catch (error) {
            console.error("Failed to create section:", error);
            throw error; // Propagate for UI handling
        }
    }, []);

    const updateSection = useCallback(async (updatedSection) => {
        let finalImage = updatedSection.image;

        // Find current section to compare
        const currentSection = sections.find(s => s.id === updatedSection.id);
        if (finalImage && currentSection && finalImage !== currentSection.image) {
            try {
                finalImage = await ImageService.copyToInternal(finalImage);
                // Delete old image
                if (currentSection.image) {
                    await ImageService.deleteImage(currentSection.image);
                }
            } catch (e) {
                console.error("Failed to update section image:", e);
            }
        }

        const sectionWithTimestamp = {
            ...updatedSection,
            image: finalImage,
            updatedAt: new Date().toISOString()
        };
        try {
            await Database.updateSection(sectionWithTimestamp);
            setSections(prev => prev.map(s => s.id === updatedSection.id ? sectionWithTimestamp : s));
            // Update activeSection if it's the one being edited
            if (activeSection && activeSection.id === updatedSection.id) {
                setActiveSection(sectionWithTimestamp);
            }
        } catch (error) {
            console.error("Failed to update section:", error);
        }
    }, [activeSection, sections]);

    const deleteSection = useCallback(async (sectionId) => {
        try {
            // Delete section image
            const section = sections.find(s => s.id === sectionId);
            if (section && section.image) {
                await ImageService.deleteImage(section.image);
            }

            // Delete images of products in this section (Cascade simulation)
            try {
                const productsInSection = await Database.getProductsBySectionId(sectionId);
                for (const p of productsInSection) {
                    if (p.image) await ImageService.deleteImage(p.image);
                }
            } catch (e) {
                console.warn("Failed to cleanup product images for deleted section:", e);
            }

            await Database.deleteSection(sectionId);
            setSections(prev => prev.filter(s => s.id !== sectionId));
            if (activeSection && activeSection.id === sectionId) {
                setActiveSection(null);
            }
        } catch (error) {
            console.error("Failed to delete section:", error);
            throw error;
        }
    }, [activeSection, sections]);

    const duplicateSection = useCallback(async (section) => {
        const newSectionId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // 1. Fetch existing products
        let productsToCopy = [];
        try {
            productsToCopy = await Database.getProductsBySectionId(section.id);
        } catch (e) {
            console.error("Failed to fetch products for duplication:", e);
        }

        const newSection = {
            ...section,
            id: newSectionId,
            name: `${section.name} Copy`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            productCount: productsToCopy.length
        };

        try {
            // 2. Create the section
            await Database.createSection(newSection);

            // 3. Duplicate products
            if (productsToCopy.length > 0) {
                // Use Promise.all for parallel insertion
                await Promise.all(productsToCopy.map(async (product) => {
                    const newProduct = {
                        ...product,
                        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // ensure unique ID
                        sectionId: newSectionId,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
                    return Database.createProduct(newProduct);
                }));
            }

            setSections(prev => [newSection, ...prev]);
        } catch (error) {
            console.error("Failed to duplicate section:", error);
        }
    }, []);


    // --- Product Operations ---

    const addProduct = useCallback(async (productData) => {
        if (!activeSection) return;

        let finalImage = productData.image;
        if (finalImage) {
            try {
                finalImage = await ImageService.copyToInternal(finalImage);
            } catch (e) {
                console.error("Failed to save product image:", e);
            }
        }

        const newProduct = {
            id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            sectionId: activeSection.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...productData,
            image: finalImage
        };

        try {
            await Database.createProduct(newProduct);
            setProducts(prev => [newProduct, ...prev]);

            // Update section timestamp and count
            const updatedSection = {
                ...activeSection,
                updatedAt: new Date().toISOString(),
                productCount: (activeSection.productCount || 0) + 1
            };
            await Database.updateSection(updatedSection);
            setSections(prev => prev.map(s => s.id === activeSection.id ? updatedSection : s));
            setActiveSection(updatedSection);

        } catch (error) {
            console.error("Failed to create product:", error);
            throw error;
        }
    }, [activeSection]);

    const updateProduct = useCallback(async (updatedProduct) => {
        let finalImage = updatedProduct.image;

        // Find current product to compare if image changed
        const currentProduct = products.find(p => p.id === updatedProduct.id);
        if (finalImage && currentProduct && finalImage !== currentProduct.image) {
            try {
                finalImage = await ImageService.copyToInternal(finalImage);
                // Delete old image
                if (currentProduct.image) {
                    await ImageService.deleteImage(currentProduct.image);
                }
            } catch (e) {
                console.error("Failed to update product image:", e);
            }
        }

        const productWithTimestamp = {
            ...updatedProduct,
            image: finalImage,
            updatedAt: new Date().toISOString()
        };
        try {
            await Database.updateProduct(productWithTimestamp);
            setProducts(prev => prev.map(p => p.id === updatedProduct.id ? productWithTimestamp : p));

            // Update section timestamp (count remains same on product update)
            const updatedSection = { ...activeSection, updatedAt: new Date().toISOString() };
            await Database.updateSection(updatedSection);
            setSections(prev => prev.map(s => s.id === activeSection.id ? updatedSection : s));
            setActiveSection(updatedSection);

        } catch (error) {
            console.error("Failed to update product:", error);
        }
    }, [activeSection, products]);

    const deleteProduct = useCallback(async (productId) => {
        try {
            const product = products.find(p => p.id === productId);
            if (product && product.image) {
                await ImageService.deleteImage(product.image);
            }

            await Database.deleteProduct(productId);
            setProducts(prev => prev.filter(p => p.id !== productId));

            // Update section timestamp and count
            const updatedSection = {
                ...activeSection,
                updatedAt: new Date().toISOString(),
                productCount: Math.max(0, (activeSection.productCount || 0) - 1)
            };
            await Database.updateSection(updatedSection);
            setSections(prev => prev.map(s => s.id === activeSection.id ? updatedSection : s));
            setActiveSection(updatedSection);

        } catch (error) {
            console.error("Failed to delete product:", error);
            throw error;
        }
    }, [activeSection, products]);

    const duplicateProduct = useCallback(async (product) => {
        if (!activeSection) return;

        const newProduct = {
            ...product,
            id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: `${product.name} Copy`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        try {
            await Database.createProduct(newProduct);
            setProducts(prev => [newProduct, ...prev]);

            // Update section timestamp and count
            const updatedSection = {
                ...activeSection,
                updatedAt: new Date().toISOString(),
                productCount: (activeSection.productCount || 0) + 1
            };
            await Database.updateSection(updatedSection);
            setSections(prev => prev.map(s => s.id === activeSection.id ? updatedSection : s));
        } catch (error) {
            console.error("Failed to duplicate product:", error);
        }
    }, [activeSection]);


    // --- Canvas Operations ---

    const [canvases, setCanvases] = useState([]);

    const loadCanvases = async () => {
        try {
            const result = await Database.getCanvases();
            const parsedCanvases = await Promise.all(result.map(async (canvas) => {
                let data = canvas.data ? JSON.parse(canvas.data) : null;

                // Integrity Check: Verify if images exist
                if (data && data.images) {
                    const validatedImages = await Promise.all(data.images.map(async (img) => {
                        if (img.source && img.source.uri) {
                            const exists = await ImageService.checkImageExists(img.source.uri);
                            if (!exists) {
                                // Mark as missing so UI can handle it (e.g., show placeholder)
                                return { ...img, isMissing: true };
                            }
                        }
                        return img;
                    }));
                    data.images = validatedImages;
                }

                return {
                    ...canvas,
                    data
                };
            }));
            setCanvases(parsedCanvases);
        } catch (error) {
            console.error("Failed to load canvases:", error);
        }
    };

    // Load canvases on mount
    useEffect(() => {
        loadCanvases();
    }, []);

    const saveCanvas = useCallback(async (canvasData, thumbnailUri) => {
        // Find existing canvas to check for cleanup
        const oldCanvas = canvases.find(c => c.id === canvasData.id);

        // 1. Process Thumbnail
        let finalThumbnail = thumbnailUri;
        if (finalThumbnail) {
            try {
                // Check if different
                if (oldCanvas && oldCanvas.thumbnail && oldCanvas.thumbnail !== finalThumbnail) {
                    await ImageService.deleteImage(oldCanvas.thumbnail);
                }

                finalThumbnail = await ImageService.copyToInternal(finalThumbnail);
            } catch (e) {
                console.error("Failed to save canvas thumbnail:", e);
            }
        } else if (oldCanvas && oldCanvas.thumbnail) {
            // If explicit save with null thumbnail (e.g. auto-save), keep old thumbnail
            finalThumbnail = oldCanvas.thumbnail;
        }

        // 2. Process Canvas Images (CRITICAL FOR PERSISTENCE)
        let processedImages = [];
        const newImageUris = new Set();

        if (canvasData.data && canvasData.data.images) {
            processedImages = await Promise.all(canvasData.data.images.map(async (img) => {
                // If it has a source URI, try to persist it
                if (img.source && img.source.uri) {
                    try {
                        const persistentUri = await ImageService.copyToInternal(img.source.uri);
                        newImageUris.add(persistentUri);
                        return {
                            ...img,
                            source: { ...img.source, uri: persistentUri }
                        };
                    } catch (e) {
                        console.error(`Failed to persist image ${img.id}:`, e);
                        if (img.source.uri) newImageUris.add(img.source.uri); // Consider original 'used' if failed to move
                        return img;
                    }
                }
                return img;
            }));
        }

        // Cleanup removed images from the canvas
        if (oldCanvas && oldCanvas.data && oldCanvas.data.images) {
            oldCanvas.data.images.forEach(async (oldImg) => {
                if (oldImg.source && oldImg.source.uri) {
                    // If old URI is NOT in the new list, delete it
                    if (!newImageUris.has(oldImg.source.uri)) {
                        await ImageService.deleteImage(oldImg.source.uri);
                    }
                }
            });
        }


        const canvasToSave = {
            ...canvasData,
            data: {
                ...canvasData.data,
                images: processedImages
            },
            thumbnail: finalThumbnail,
            updatedAt: new Date().toISOString()
        };

        try {
            await Database.saveCanvas(canvasToSave);

            // Update state
            setCanvases(prev => {
                const exists = prev.find(c => c.id === canvasToSave.id);
                if (exists) {
                    return prev.map(c => c.id === canvasToSave.id ? canvasToSave : c);
                } else {
                    return [canvasToSave, ...prev];
                }
            });

            return canvasToSave; // Return for UI sync
        } catch (error) {
            console.error("Failed to save canvas:", error);
            throw error;
        }
    }, [canvases]);

    const renameCanvas = useCallback(async (canvasId, newName) => {
        try {
            await Database.renameCanvas(canvasId, newName);
            setCanvases(prev => prev.map(c =>
                c.id === canvasId ? { ...c, name: newName, updatedAt: new Date().toISOString() } : c
            ));
        } catch (error) {
            console.error("Failed to rename canvas:", error);
            throw error;
        }
    }, []);

    const deleteSavedCanvas = useCallback(async (canvasId) => {
        try {
            // Delete canvas resources
            const canvas = canvases.find(c => c.id === canvasId);
            if (canvas) {
                if (canvas.thumbnail) await ImageService.deleteImage(canvas.thumbnail);
                if (canvas.data && canvas.data.images) {
                    for (const img of canvas.data.images) {
                        if (img.source && img.source.uri) {
                            await ImageService.deleteImage(img.source.uri);
                        }
                    }
                }
            }

            await Database.deleteCanvas(canvasId);
            setCanvases(prev => prev.filter(c => c.id !== canvasId));
        } catch (error) {
            console.error("Failed to delete canvas:", error);
            throw error;
        }
    }, [canvases]);

    const clearDataState = useCallback(async () => {
        try {
            // Reset State ONLY (DB is wiped by Service)
            setSections([]);
            setProducts([]);
            setActiveSection(null);
            setCanvases([]);
        } catch (error) {
            console.error("Failed to clear data state:", error);
            throw error;
        }
    }, []);

    if (isLoading) {
        return null;
    }

    return (
        <DataContext.Provider value={{
            sections,
            activeSection,
            setActiveSection, // We expose this so UI can navigate
            products,
            isLoading,
            addSection,
            updateSection,
            deleteSection,
            duplicateSection,
            addProduct,
            updateProduct,
            deleteProduct,
            duplicateProduct,
            refresh: async () => {
                await loadSections();
                await loadCanvases();
            },
            // Canvas
            canvases,
            saveCanvas,
            renameCanvas,
            deleteCanvas: deleteSavedCanvas,
            refreshCanvases: loadCanvases,
            clearDataState,
            clearAllData: clearDataState, // Backwards combatibility / deprecated
            runGarbageCollector, // Exposed security feature
            getAllInventoryProducts: Database.getAllProducts
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
