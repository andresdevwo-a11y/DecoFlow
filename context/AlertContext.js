import React, { createContext, useContext, useState, useCallback } from 'react';
import InfoModal from '../components/InfoModal';
import ToastNotification from '../components/ui/ToastNotification';
import ConfirmationModal from '../components/ConfirmationModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import ActionSheetModal from '../components/ActionSheetModal';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
    // State for Info Modal
    const [infoModal, setInfoModal] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info', // 'info', 'success', 'error'
        onClose: null
    });

    // State for Toast Notification
    const [toast, setToast] = useState({
        visible: false,
        message: '',
        type: 'success', // 'success', 'error', 'info'
        onHide: null
    });

    // State for Confirmation Modal
    const [confirmModal, setConfirmModal] = useState({
        visible: false,
        title: '',
        message: '',
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        isDestructive: false,
        onConfirm: null,
        onCancel: null
    });

    // State for Delete Confirmation Modal (Specific variant)
    const [deleteModal, setDeleteModal] = useState({
        visible: false,
        title: '',
        sectionName: '', // Legacy/specific prop support
        message: '',
        loading: false,
        onConfirm: null,
        onCancel: null
    });

    // State for Action Sheet
    const [actionSheet, setActionSheet] = useState({
        visible: false,
        title: '',
        message: '',
        actions: [],
        cancelText: 'Cancelar'
    });

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    /**
     * Show an info, success, or error alert
     * @param {string} type - 'info', 'success', 'error'
     * @param {string} title 
     * @param {string} message 
     * @param {function} onClose - Optional callback when closed
     */
    const showAlert = useCallback((type, title, message, onClose = null) => {
        // Use Toast for success and error types
        if (type === 'success' || type === 'error') {
            setToast({
                visible: true,
                message: message && message.length > 0 ? message : title, // Prioritize message if available
                type,
                onHide: onClose
            });
        } else {
            // Use InfoModal for 'info' or other types that require interaction
            setInfoModal({
                visible: true,
                type,
                title,
                message,
                onClose
            });
        }
    }, []);

    /**
     * Show a toast notification explicitly
     * @param {string} type - 'success', 'error', 'info'
     * @param {string} message 
     * @param {function} onHide - Optional callback when hidden
     */
    const showToast = useCallback((type, message, onHide = null) => {
        setToast({
            visible: true,
            type,
            message,
            onHide
        });
    }, []);

    /**
     * Show a generic confirmation dialog
     * @param {object} options 
     */
    const showConfirm = useCallback(({
        title,
        message,
        confirmText = 'Confirmar',
        cancelText = 'Cancelar',
        isDestructive = false,
        onConfirm,
        onCancel
    }) => {
        setConfirmModal({
            visible: true,
            title,
            message,
            confirmText,
            cancelText,
            isDestructive,
            onConfirm: async () => {
                if (onConfirm) await onConfirm();
                setConfirmModal(prev => ({ ...prev, visible: false }));
            },
            onCancel: () => {
                if (onCancel) onCancel();
                setConfirmModal(prev => ({ ...prev, visible: false }));
            }
        });
    }, []);

    /**
     * Show a delete confirmation dialog
     * @param {object} options 
     */
    const showDelete = useCallback(({
        title,
        message,
        sectionName,
        onConfirm,
        onCancel
    }) => {
        // We handle loading state inside the component usually, but if controlled from outside,
        // we might just treat onConfirm as async
        setDeleteModal({
            visible: true,
            title,
            message,
            sectionName,
            loading: false,
            onConfirm: async () => {
                setDeleteModal(prev => ({ ...prev, loading: true }));
                try {
                    if (onConfirm) await onConfirm();
                } finally {
                    setDeleteModal(prev => ({ ...prev, visible: false, loading: false }));
                }
            },
            onCancel: () => {
                if (onCancel) onCancel();
                setDeleteModal(prev => ({ ...prev, visible: false }));
            }
        });
    }, []);

    /**
     * Show an action sheet with options
     * @param {object} options 
     */
    const showActionSheet = useCallback(({
        title,
        message,
        actions,
        cancelText
    }) => {
        setActionSheet({
            visible: true,
            title,
            message,
            actions,
            cancelText: cancelText || 'Cancelar'
        });
    }, []);

    // Also hiding helpers if needed programmatically
    const hideAlert = useCallback(() => setInfoModal(prev => ({ ...prev, visible: false })), []);

    return (
        <AlertContext.Provider value={{
            showAlert,
            showToast,
            showConfirm,
            showDelete,
            showActionSheet,
            hideAlert
        }}>
            {children}

            {/* RENDER MODALS */}

            <ToastNotification
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                duration={3000}
                onHide={() => {
                    setToast(prev => ({ ...prev, visible: false }));
                    if (toast.onHide) toast.onHide();
                }}
            />

            <InfoModal
                visible={infoModal.visible}
                type={infoModal.type}
                title={infoModal.title}
                message={infoModal.message}
                onClose={() => {
                    setInfoModal(prev => ({ ...prev, visible: false }));
                    if (infoModal.onClose) infoModal.onClose();
                }}
            />

            <ConfirmationModal
                visible={confirmModal.visible}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                cancelText={confirmModal.cancelText}
                isDestructive={confirmModal.isDestructive}
                onConfirm={confirmModal.onConfirm}
                onCancel={confirmModal.onCancel}
            />

            <DeleteConfirmationModal
                visible={deleteModal.visible}
                title={deleteModal.title}
                message={deleteModal.message}
                sectionName={deleteModal.sectionName}
                loading={deleteModal.loading}
                onConfirm={deleteModal.onConfirm}
                onCancel={deleteModal.onCancel}
            />

            <ActionSheetModal
                visible={actionSheet.visible}
                title={actionSheet.title}
                message={actionSheet.message}
                actions={actionSheet.actions}
                cancelText={actionSheet.cancelText}
                onClose={() => setActionSheet(prev => ({ ...prev, visible: false }))}
            />

        </AlertContext.Provider>
    );
};

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};
