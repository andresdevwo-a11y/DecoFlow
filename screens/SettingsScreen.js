import React, { useCallback, useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Alert,
    Modal,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    KeyboardAvoidingView,
    Platform,
    Keyboard
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../constants/Theme';

// Components
import SettingSection from '../components/SettingSection';
import SettingToggle from '../components/SettingToggle';
import SettingNavItem from '../components/SettingNavItem';
import { Feather } from '@expo/vector-icons'; // Added for modal icons
import { useSettings } from '../context/SettingsContext';

import ConfirmResetModal from '../components/ConfirmResetModal';
import InfoModal from '../components/InfoModal';
import SelectionModal from '../components/SelectionModal';
import ToastNotification from '../components/ui/ToastNotification';
import { useData } from '../context/DataContext';
import { useFinance } from '../context/FinanceContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useLicense } from '../context/LicenseContext';

import { exportData } from '../services/ExportService';
import { importData } from '../services/ImportService';
import { performReset } from '../services/ResetDataService';

// App version
import { APP_VERSION } from '../constants/Config';


export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const {
        viewMode, setViewMode,
        sortBy, setSortBy,
        confirmDelete, setConfirmDelete,
        productViewMode, setProductViewMode,
        productSortBy, setProductSortBy,
        confirmProductDelete, setConfirmProductDelete,
        canvasViewMode, setCanvasViewMode,
        canvasSortBy, setCanvasSortBy,
        confirmCanvasDelete, setConfirmCanvasDelete,
        isAutoSaveEnabled, setAutoSaveEnabled,
        businessInfo, setBusinessInfo,
        resetSettings
    } = useSettings();

    // Modals
    const [resetModalVisible, setResetModalVisible] = useState(false);

    // Business Edit State
    const [editBusinessVisible, setEditBusinessVisible] = useState(false);
    const [businessForm, setBusinessForm] = useState(businessInfo);

    useEffect(() => {
        setBusinessForm(businessInfo);
    }, [businessInfo, editBusinessVisible]);

    const handleSaveBusinessInfo = async () => {
        if (!businessForm.name || !businessForm.rut) {
            showToast('Nombre y RUT son obligatorios');
            return;
        }
        await setBusinessInfo(businessForm);
        setEditBusinessVisible(false);
        showToast('Información de facturación actualizada');
    };

    // Custom Modals State
    const [infoModal, setInfoModal] = useState({ visible: false, title: '', message: '', type: 'info' });
    const [selectionModal, setSelectionModal] = useState({ visible: false, title: '', options: [] });
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    // Handlers
    const showToast = (message) => setToast({ visible: true, message, type: 'success' });
    const closeInfoModal = useCallback(() => setInfoModal(prev => ({ ...prev, visible: false })), []);
    const closeSelectionModal = useCallback(() => setSelectionModal(prev => ({ ...prev, visible: false })), []);

    const handleViewModePress = useCallback(() => {
        setSelectionModal({
            visible: true,
            title: 'Vista Predeterminada',
            options: [
                { text: 'Grid', onPress: () => { setViewMode('Grid'); closeSelectionModal(); showToast('Vista de secciones: Grid'); } },
                { text: 'Lista', onPress: () => { setViewMode('Lista'); closeSelectionModal(); showToast('Vista de secciones: Lista'); } },
            ]
        });
    }, [closeSelectionModal, setViewMode]);

    const handleSortByPress = useCallback(() => {
        setSelectionModal({
            visible: true,
            title: 'Ordenar Por',
            options: [
                { text: 'Nombre', onPress: () => { setSortBy('Nombre'); closeSelectionModal(); showToast('Secciones ordenadas por Nombre'); } },
                { text: 'Fecha de creación', onPress: () => { setSortBy('Fecha'); closeSelectionModal(); showToast('Secciones ordenadas por Fecha'); } },
                { text: 'Última modificación', onPress: () => { setSortBy('Modificación'); closeSelectionModal(); showToast('Secciones ordenadas por Modificación'); } },
            ]
        });
    }, [closeSelectionModal, setSortBy]);

    const handleProductViewModePress = useCallback(() => {
        setSelectionModal({
            visible: true,
            title: 'Vista Predeterminada',
            options: [
                { text: 'Grid', onPress: () => { setProductViewMode('Grid'); closeSelectionModal(); showToast('Vista de productos: Grid'); } },
                { text: 'Lista', onPress: () => { setProductViewMode('Lista'); closeSelectionModal(); showToast('Vista de productos: Lista'); } },
            ]
        });
    }, [closeSelectionModal, setProductViewMode]);

    const handleProductSortByPress = useCallback(() => {
        setSelectionModal({
            visible: true,
            title: 'Ordenar Por',
            options: [
                { text: 'Nombre', onPress: () => { setProductSortBy('Nombre'); closeSelectionModal(); showToast('Productos ordenados por Nombre'); } },
                { text: 'Fecha de creación', onPress: () => { setProductSortBy('Fecha'); closeSelectionModal(); showToast('Productos ordenados por Fecha'); } },
                { text: 'Última modificación', onPress: () => { setProductSortBy('Modificación'); closeSelectionModal(); showToast('Productos ordenados por Modificación'); } },
            ]
        });
    }, [closeSelectionModal, setProductSortBy]);

    const handleCanvasViewModePress = useCallback(() => {
        setSelectionModal({
            visible: true,
            title: 'Vista Predeterminada',
            options: [
                { text: 'Grid', onPress: () => { setCanvasViewMode('Grid'); closeSelectionModal(); showToast('Vista de lienzos: Grid'); } },
                { text: 'Lista', onPress: () => { setCanvasViewMode('Lista'); closeSelectionModal(); showToast('Vista de lienzos: Lista'); } },
            ]
        });
    }, [closeSelectionModal, setCanvasViewMode]);

    const handleCanvasSortByPress = useCallback(() => {
        setSelectionModal({
            visible: true,
            title: 'Ordenar Por',
            options: [
                { text: 'Nombre', onPress: () => { setCanvasSortBy('Nombre'); closeSelectionModal(); showToast('Lienzos ordenados por Nombre'); } },
                { text: 'Fecha de creación', onPress: () => { setCanvasSortBy('Fecha'); closeSelectionModal(); showToast('Lienzos ordenados por Fecha'); } },
                { text: 'Última modificación', onPress: () => { setCanvasSortBy('Modificación'); closeSelectionModal(); showToast('Lienzos ordenados por Modificación'); } },
            ]
        });
    }, [closeSelectionModal, setCanvasSortBy]);

    const [isLoading, setIsLoading] = useState(false);

    const handleExportData = useCallback(async () => {
        setSelectionModal({
            visible: true,
            title: 'Exportar Datos',
            options: [
                {
                    text: 'Exportar ahora',
                    onPress: async () => {
                        closeSelectionModal();
                        setIsLoading(true);
                        try {
                            await exportData();
                            setInfoModal({
                                visible: true,
                                title: 'Éxito',
                                message: 'Datos exportados correctamente.',
                                type: 'success'
                            });
                        } catch (error) {
                            setInfoModal({
                                visible: true,
                                title: 'Error',
                                message: 'No se pudo exportar los datos. Intenta nuevamente.',
                                type: 'error'
                            });
                            console.error(error);
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        });
    }, [closeSelectionModal]);

    const handleImportData = useCallback(async () => {
        setSelectionModal({
            visible: true,
            title: 'Importar Datos (Sobrescribirá todo)',
            options: [
                {
                    text: 'Seleccionar archivo',
                    onPress: async () => {
                        closeSelectionModal();
                        setTimeout(async () => {
                            setIsLoading(true);
                            try {
                                const success = await importData();
                                if (success) {
                                    setInfoModal({
                                        visible: true,
                                        title: 'Éxito',
                                        message: 'Datos importados. Reinicia la app.',
                                        type: 'success'
                                    });
                                }
                            } catch (error) {
                                setInfoModal({
                                    visible: true,
                                    title: 'Error',
                                    message: 'No se pudo importar.',
                                    type: 'error'
                                });
                                console.error(error);
                            } finally {
                                setIsLoading(false);
                            }
                        }, 100);
                    }
                }
            ]
        });
    }, [closeSelectionModal]);

    const { refresh: refreshData, clearDataState } = useData();
    const { clearFinanceState } = useFinance();

    // But useWorkspace IS a hook.
    const { resetWorkspace } = useWorkspace();
    const { licenseInfo, refreshLicense, removeLicense, isLoading: licenseLoading } = useLicense();

    const handleResetData = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1. Strictly Deleting from DB and Storage First
            await performReset();

            // 2. Only if DB deletion succeeds, clear the UI/Context state
            await clearDataState();
            await clearFinanceState();

            // 3. Reset Settings and Workspace
            await resetSettings();
            resetWorkspace();

            setResetModalVisible(false); // Close AFTER success

            setTimeout(() => {
                setInfoModal({
                    visible: true,
                    title: 'Completado',
                    message: 'Todos los datos han sido eliminados correctamente.',
                    type: 'success'
                });
            }, 300);
        } catch (error) {
            setResetModalVisible(false);
            console.error("Reset Data Error:", error); // Log the real error
            setTimeout(() => {
                setInfoModal({
                    visible: true,
                    title: 'Error',
                    message: 'Hubo un problema al eliminar los datos. Intenta nuevamente.',
                    type: 'error'
                });
            }, 300);
        } finally {
            setIsLoading(false);
        }
    }, [clearDataState, clearFinanceState, resetSettings, resetWorkspace, performReset]);

    // License Helpers
    const maskLicenseCode = (code) => {
        if (!code) return 'No disponible';
        // XXXX-XXXX-1234 → ****-****-1234
        const parts = code.split('-');
        if (parts.length === 3) {
            return `****-****-${parts[2]}`;
        }
        return '****-****-****';
    };

    const handleRefreshLicense = async () => {
        setInfoModal({
            visible: true,
            title: 'Verificando',
            message: 'Comprobando estado de la licencia...',
            type: 'info'
        });

        try {
            const result = await refreshLicense();

            if (result && result.valid) {
                setTimeout(() => {
                    setInfoModal({
                        visible: true,
                        title: 'Licencia Activa',
                        message: 'Tu licencia ha sido verificada correctamente.',
                        type: 'success'
                    });
                }, 500);
            } else {
                setTimeout(() => {
                    setInfoModal({
                        visible: true,
                        title: 'Problema de Licencia',
                        message: result?.message || 'No se pudo verificar la licencia. Revisa tu conexión.',
                        type: 'error'
                    });
                }, 500);
            }
        } catch (error) {
            setTimeout(() => {
                setInfoModal({
                    visible: true,
                    title: 'Error',
                    message: 'Hubo un error al conectar con el servidor.',
                    type: 'error'
                });
            }, 500);
        }
    };

    const handleChangeLicense = () => {
        Alert.alert(
            "Cambiar Licencia",
            "¿Estás seguro? Esto cerrará tu sesión actual y necesitarás ingresar un nuevo código de licencia válido para continuar.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Sí, Cambiar",
                    style: "destructive",
                    onPress: async () => {
                        await removeLicense();
                        // App.js manejará el cambio de estado y mostrará LicenseActivationScreen
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom + 100 }
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Ajustes</Text>
                    <Text style={styles.subtitle}>Personaliza tu experiencia</Text>
                </View>

                {/* Sections Section */}
                <SettingSection title="📁 Secciones">
                    <SettingNavItem
                        icon="grid"
                        label="Vista predeterminada"
                        value={viewMode}
                        onPress={handleViewModePress}
                    />
                    <SettingNavItem
                        icon="bar-chart-2"
                        label="Ordenar por"
                        value={sortBy}
                        onPress={handleSortByPress}
                    />
                    <SettingToggle
                        icon="alert-circle"
                        label="Confirmar al eliminar"
                        description="Muestra confirmación antes de borrar"
                        value={confirmDelete}
                        onValueChange={(val) => { setConfirmDelete(val); showToast(val ? 'Confirmación activada' : 'Confirmación desactivada'); }}
                    />
                </SettingSection>

                {/* Products Section */}
                <SettingSection title="📦 Productos">
                    <SettingNavItem
                        icon="grid"
                        label="Vista predeterminada"
                        value={productViewMode}
                        onPress={handleProductViewModePress}
                    />
                    <SettingNavItem
                        icon="bar-chart-2"
                        label="Ordenar por"
                        value={productSortBy}
                        onPress={handleProductSortByPress}
                    />
                    <SettingToggle
                        icon="alert-circle"
                        label="Confirmar al eliminar"
                        description="Muestra confirmación antes de borrar"
                        value={confirmProductDelete}
                        onValueChange={(val) => { setConfirmProductDelete(val); showToast(val ? 'Confirmación activada' : 'Confirmación desactivada'); }}
                    />
                </SettingSection>

                {/* Canvas Section */}
                <SettingSection title="🖼️ Lienzos">
                    <SettingNavItem
                        icon="grid"
                        label="Vista predeterminada"
                        value={canvasViewMode}
                        onPress={handleCanvasViewModePress}
                    />
                    <SettingNavItem
                        icon="bar-chart-2"
                        label="Ordenar por"
                        value={canvasSortBy}
                        onPress={handleCanvasSortByPress}
                    />
                    <SettingToggle
                        icon="alert-circle"
                        label="Confirmar al eliminar"
                        description="Muestra confirmación antes de borrar"
                        value={confirmCanvasDelete}
                        onValueChange={(val) => { setConfirmCanvasDelete(val); showToast(val ? 'Confirmación activada' : 'Confirmación desactivada'); }}
                    />
                    <SettingToggle
                        icon="save"
                        label="Guardado Automático"
                        description="Guardar cambios automáticamente al editar"
                        value={isAutoSaveEnabled}
                        onValueChange={(val) => { setAutoSaveEnabled(val); showToast(val ? 'Auto-guardado activado' : 'Auto-guardado desactivado'); }}
                    />
                </SettingSection>

                {/* Business Info Section */}
                <SettingSection title="🧾 Facturación">
                    <SettingNavItem
                        icon="briefcase"
                        label="Nombre de Empresa"
                        value={businessInfo.name}
                        onPress={() => setEditBusinessVisible(true)}
                    />
                    <SettingNavItem
                        icon="hash"
                        label="RUT / Identificación"
                        value={businessInfo.rut}
                        onPress={() => setEditBusinessVisible(true)}
                    />
                    <SettingNavItem
                        icon="map-pin"
                        label="Dirección"
                        value={businessInfo.address}
                        onPress={() => setEditBusinessVisible(true)}
                    />
                    <SettingNavItem
                        icon="phone"
                        label="Teléfono"
                        value={businessInfo.phone}
                        onPress={() => setEditBusinessVisible(true)}
                    />
                </SettingSection>

                {/* Data Section */}
                <SettingSection title="💾 Datos">
                    <SettingNavItem
                        icon="upload"
                        label="Exportar datos"
                        description="Crea un respaldo de tus secciones"
                        onPress={handleExportData}
                    />
                    <SettingNavItem
                        icon="download"
                        label="Importar datos"
                        description="Restaura desde un respaldo"
                        onPress={handleImportData}
                    />
                    <SettingNavItem
                        icon="trash-2"
                        label="Borrar todos los datos"
                        description="Elimina todas las secciones y ajustes"
                        onPress={() => setResetModalVisible(true)}
                        isDestructive={true}
                    />
                </SettingSection>



                {/* License Section */}
                <SettingSection title="🔑 Licencia">
                    <SettingNavItem
                        icon="key"
                        label="Código de Licencia"
                        value={maskLicenseCode(licenseInfo?.license_code)}
                        onPress={() => showToast('Código de licencia activo')}
                    />

                    {licenseInfo?.end_date && (
                        <SettingNavItem
                            icon="calendar"
                            label="Fecha de Vencimiento"
                            value={new Date(licenseInfo.end_date).toLocaleDateString()}
                            onPress={() => { }}
                        />
                    )}

                    {licenseInfo?.offline_mode && (
                        <SettingNavItem
                            icon="wifi-off"
                            label="Modo Offline"
                            value={`${licenseInfo.offline_days_remaining} días restantes`}
                            description="Conéctate a internet para renovar el período offline"
                            onPress={() => showToast('Necesitas conexión para actualizar la licencia')}
                        />
                    )}

                    <SettingNavItem
                        icon="refresh-cw"
                        label="Verificar licencia"
                        description="Actualizar estado y permisos"
                        onPress={handleRefreshLicense}
                    />

                    <SettingNavItem
                        icon="log-out"
                        label="Cambiar licencia"
                        description="Usar un código diferente"
                        onPress={handleChangeLicense}
                        isDestructive={true}
                    />
                </SettingSection>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Woodland</Text>
                    <Text style={styles.footerVersion}>Versión {APP_VERSION}</Text>
                    <Text style={styles.footerCopyright}>
                        © 2026 Woodland App. Todos los derechos reservados.
                    </Text>
                </View>
            </ScrollView>

            <ToastNotification
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast(prev => ({ ...prev, visible: false }))}
            />

            {/* Modals */}
            <ConfirmResetModal
                visible={resetModalVisible}
                onCancel={() => !isLoading && setResetModalVisible(false)}
                onConfirm={handleResetData}
                loading={isLoading}
            />

            <InfoModal
                visible={infoModal.visible}
                title={infoModal.title}
                message={infoModal.message}
                type={infoModal.type}
                onClose={closeInfoModal}
            />

            <SelectionModal
                visible={selectionModal.visible}
                title={selectionModal.title}
                options={selectionModal.options}
                onCancel={closeSelectionModal}
            />

            {/* Business Edit Modal */}
            <Modal
                visible={editBusinessVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditBusinessVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <TouchableWithoutFeedback onPress={() => setEditBusinessVisible(false)}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                                <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Editar Facturación</Text>
                                        <TouchableOpacity onPress={() => setEditBusinessVisible(false)}>
                                            <Feather name="x" size={24} color={COLORS.text} />
                                        </TouchableOpacity>
                                    </View>

                                    <ScrollView style={{ maxHeight: 400 }}>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Nombre de la Empresa</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={businessForm.name}
                                                onChangeText={(t) => setBusinessForm(prev => ({ ...prev, name: t }))}
                                                placeholder="Ej: Woodland Eventos"
                                            />
                                        </View>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>RUT / Identificación</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={businessForm.rut}
                                                onChangeText={(t) => setBusinessForm(prev => ({ ...prev, rut: t }))}
                                                placeholder="Ej: 1113695670"
                                            />
                                        </View>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Dirección Física</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={businessForm.address}
                                                onChangeText={(t) => setBusinessForm(prev => ({ ...prev, address: t }))}
                                                placeholder="Ej: Calle 28 #21-07"
                                            />
                                        </View>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Teléfono de Contacto</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={businessForm.phone}
                                                onChangeText={(t) => setBusinessForm(prev => ({ ...prev, phone: t }))}
                                                placeholder="Ej: (300) 123-4567"
                                                keyboardType="phone-pad"
                                            />
                                        </View>
                                    </ScrollView>

                                    <View style={styles.modalActions}>
                                        <TouchableOpacity
                                            style={styles.cancelButton}
                                            onPress={() => setEditBusinessVisible(false)}
                                        >
                                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.saveButton}
                                            onPress={handleSaveBusinessInfo}
                                        >
                                            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        width: '100%',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: SPACING.xl,
    },
    header: {
        marginBottom: SPACING['2xl'],
    },
    title: {
        fontSize: TYPOGRAPHY.size['5xl'],
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: TYPOGRAPHY.size.xl,
        color: COLORS.textMuted,
    },
    footer: {
        alignItems: 'center',
        paddingTop: SPACING['2xl'],
        paddingBottom: SPACING.lg,
    },
    footerText: {
        fontSize: TYPOGRAPHY.size['2xl'],
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.primary,
        marginBottom: SPACING.xs,
    },
    footerVersion: {
        fontSize: TYPOGRAPHY.size.base,
        color: COLORS.placeholder,
        marginBottom: SPACING.sm,
    },
    footerCopyright: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.placeholder,
        textAlign: 'center',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: COLORS.overlay,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        padding: SPACING.xl,
        ...SHADOWS.sheet
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    inputGroup: {
        marginBottom: SPACING.lg,
    },
    inputLabel: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs,
        fontWeight: '600',
    },
    input: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: 12, // Increased touch area
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.text,
    },
    modalActions: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginTop: SPACING.xl,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        color: COLORS.textSecondary,
        fontWeight: '600',
        fontSize: TYPOGRAPHY.size.md,
    },
    saveButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.sm,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: TYPOGRAPHY.size.md,
    },
});
