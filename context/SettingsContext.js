import React, { createContext, useState, useContext, useEffect } from 'react';
import * as Database from '../services/Database';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    // Section Settings
    const [viewMode, setViewModeState] = useState('Grid');
    const [sortBy, setSortByState] = useState('Nombre');
    const [confirmDelete, setConfirmDeleteState] = useState(true);

    // Product Settings
    const [productViewMode, setProductViewModeState] = useState('Lista');
    const [productSortBy, setProductSortByState] = useState('Nombre');
    const [confirmProductDelete, setConfirmProductDeleteState] = useState(true);

    // Canvas Settings
    const [canvasViewMode, setCanvasViewModeState] = useState('Grid');
    const [canvasSortBy, setCanvasSortByState] = useState('Nombre');
    const [confirmCanvasDelete, setConfirmCanvasDeleteState] = useState(true);
    const [isAutoSaveEnabled, setAutoSaveEnabledState] = useState(true);

    // Business Info Settings
    const [businessInfo, setBusinessInfoState] = useState({
        name: 'DecoFlow Eventos',
        rut: '1113695670',
        address: 'Calle 28 #21-07, Ciudad',
        phone: '(312) 729-9520'
    });

    const loadSettings = async () => {
        try {
            const settings = await Database.getSettings();
            // Default values if missing
            setViewModeState(settings.viewMode || 'Grid');
            setSortByState(settings.sortBy || 'Nombre');
            setConfirmDeleteState(settings.confirmDelete !== 'false'); // Default true
            setProductViewModeState(settings.productViewMode || 'Lista');
            setProductSortByState(settings.productSortBy || 'Nombre');
            setConfirmProductDeleteState(settings.confirmProductDelete !== 'false'); // Default true
            // Canvas
            setCanvasViewModeState(settings.canvasViewMode || 'Grid');
            setCanvasSortByState(settings.canvasSortBy || 'Nombre');
            setConfirmCanvasDeleteState(settings.confirmCanvasDelete !== 'false'); // Default true
            setAutoSaveEnabledState(settings.isAutoSaveEnabled !== 'false'); // Default true

            // Business Info
            if (settings.businessInfo) {
                try {
                    const parsed = JSON.parse(settings.businessInfo);
                    setBusinessInfoState(parsed);
                } catch (e) {
                    console.error("Failed to parse business info:", e);
                }
            }
        } catch (error) {
            console.error("Failed to load settings:", error);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const resetSettings = async () => {
        // Reloading will fetch empty settings from DB, so we rely on checks above or defaults
        // Since we wiped DB, getSettings returns {}
        await loadSettings();
    };

    const setViewMode = async (value) => {
        setViewModeState(value);
        await Database.saveSetting('viewMode', value);
    };

    const setSortBy = async (value) => {
        setSortByState(value);
        await Database.saveSetting('sortBy', value);
    };

    const setConfirmDelete = async (value) => {
        setConfirmDeleteState(value);
        await Database.saveSetting('confirmDelete', value);
    };

    const setProductViewMode = async (value) => {
        setProductViewModeState(value);
        await Database.saveSetting('productViewMode', value);
    };

    const setProductSortBy = async (value) => {
        setProductSortByState(value);
        await Database.saveSetting('productSortBy', value);
    };

    const setConfirmProductDelete = async (value) => {
        setConfirmProductDeleteState(value);
        await Database.saveSetting('confirmProductDelete', value);
    };

    const setCanvasViewMode = async (value) => {
        setCanvasViewModeState(value);
        await Database.saveSetting('canvasViewMode', value);
    };

    const setCanvasSortBy = async (value) => {
        setCanvasSortByState(value);
        await Database.saveSetting('canvasSortBy', value);
    };

    const setConfirmCanvasDelete = async (value) => {
        setConfirmCanvasDeleteState(value);
        await Database.saveSetting('confirmCanvasDelete', value);
    };

    const setAutoSaveEnabled = async (value) => {
        setAutoSaveEnabledState(value);
        await Database.saveSetting('isAutoSaveEnabled', value);
    };

    const setBusinessInfo = async (value) => {
        setBusinessInfoState(value);
        await Database.saveSetting('businessInfo', JSON.stringify(value));
    };

    const value = {
        viewMode,
        setViewMode,
        sortBy,
        setSortBy,
        confirmDelete,
        setConfirmDelete,
        productViewMode,
        setProductViewMode,
        productSortBy,
        setProductSortBy,
        confirmProductDelete,
        setConfirmProductDelete,
        canvasViewMode,
        setCanvasViewMode,
        canvasSortBy,
        setCanvasSortBy,
        confirmCanvasDelete,
        setConfirmCanvasDelete,
        isAutoSaveEnabled,
        setAutoSaveEnabled,
        businessInfo,
        setBusinessInfo,
        resetSettings,
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
