import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, RADIUS } from '../../constants/Theme';
import { getClients, searchClients, updateClient, deactivateClient } from '../../services/Database';
import ClientForm from './forms/ClientForm';
import DeleteConfirmationModal from '../DeleteConfirmationModal';

const ClientSelectorModal = ({ visible, onClose, onSelect }) => {
    const insets = useSafeAreaInsets();
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Edit Mode State
    const [editingClient, setEditingClient] = useState(null);
    const [formValues, setFormValues] = useState({});
    const [formErrors, setFormErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [clientToDelete, setClientToDelete] = useState(null);

    useEffect(() => {
        if (visible) {
            loadClients();
            setSearchQuery('');
            setEditingClient(null);
            setFormValues({});
            setFormErrors({});
            setClientToDelete(null);
            setShowDeleteModal(false);
        }
    }, [visible]);

    const loadClients = async () => {
        setIsLoading(true);
        try {
            const allClients = await getClients();
            setClients(allClients);
            setFilteredClients(allClients);
        } catch (error) {
            console.error("Error loading clients:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLocalSearch = (text) => {
        setSearchQuery(text);
        if (!text.trim()) {
            setFilteredClients(clients);
            return;
        }
        const query = text.toLowerCase();
        const filtered = clients.filter(c =>
            c.name.toLowerCase().includes(query) ||
            (c.documentId && c.documentId.includes(query)) ||
            (c.phone && c.phone.includes(query))
        );
        setFilteredClients(filtered);
    };

    // Actions
    const handleEdit = (client) => {
        setEditingClient(client);
        setFormValues(client); // Pre-fill form
        setFormErrors({});
    };

    const handleDelete = (client) => {
        setClientToDelete(client);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!clientToDelete) return;

        try {
            await deactivateClient(clientToDelete.id);
            await loadClients(); // Refresh list
        } catch (error) {
            Alert.alert("Error", "No se pudo eliminar el cliente.");
            console.error(error);
        } finally {
            setShowDeleteModal(false);
            setClientToDelete(null);
        }
    };

    const handleSave = async () => {
        if (!formValues.name?.trim()) {
            setFormErrors({ name: 'El nombre es obligatorio' });
            return;
        }

        setIsSaving(true);
        try {
            await updateClient({
                ...formValues,
                updatedAt: new Date().toISOString()
            });
            await loadClients();
            setEditingClient(null); // Exit edit mode
        } catch (error) {
            console.error("Error updating client:", error);
            Alert.alert("Error", "No se pudo actualizar el cliente");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingClient(null);
        setFormValues({});
        setFormErrors({});
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.clientItem}
            onPress={() => {
                onSelect(item);
                onClose();
            }}
        >
            <View style={styles.clientAvatar}>
                <Feather name="user" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{item.name}</Text>
                <View style={styles.clientDetails}>
                    {item.documentId ? (
                        <View style={styles.detailBadge}>
                            <Feather name="credit-card" size={12} color={COLORS.textSecondary} />
                            <Text style={styles.detailText}>{item.documentId}</Text>
                        </View>
                    ) : null}
                    {item.phone ? (
                        <View style={[styles.detailBadge, { marginLeft: SPACING.sm }]}>
                            <Feather name="phone" size={12} color={COLORS.textSecondary} />
                            <Text style={styles.detailText}>{item.phone}</Text>
                        </View>
                    ) : null}
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={(e) => {
                        e.stopPropagation(); // Prevent selecting the item
                        handleEdit(item);
                    }}
                >
                    <Feather name="edit-2" size={18} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={(e) => {
                        e.stopPropagation();
                        handleDelete(item);
                    }}
                >
                    <Feather name="trash-2" size={18} color={COLORS.error} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>
                        {editingClient ? "Editar Cliente" : "Seleccionar Cliente"}
                    </Text>
                    {!editingClient && (
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Feather name="x" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    )}
                </View>

                {editingClient ? (
                    // Edit Mode View
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={{ flex: 1 }}
                    >
                        <ScrollView contentContainerStyle={styles.editFormContent}>
                            <ClientForm
                                values={formValues}
                                onChange={setFormValues}
                                errors={formErrors}
                            />

                            <View style={styles.formActions}>
                                <TouchableOpacity
                                    style={[styles.formButton, styles.cancelButton]}
                                    onPress={handleCancelEdit}
                                    disabled={isSaving}
                                >
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.formButton, styles.saveButton]}
                                    onPress={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Feather name="save" size={18} color="#fff" style={{ marginRight: 8 }} />
                                            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                ) : (
                    // List Mode View
                    <>
                        {/* Search */}
                        <View style={styles.searchContainer}>
                            <Feather name="search" size={20} color={COLORS.primary} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Buscar por nombre, cédula o teléfono..."
                                placeholderTextColor={COLORS.textMuted}
                                value={searchQuery}
                                onChangeText={handleLocalSearch}
                                autoFocus={false}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => handleLocalSearch('')}>
                                    <Feather name="x-circle" size={16} color={COLORS.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* List */}
                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                            </View>
                        ) : (
                            <FlatList
                                data={filteredClients}
                                keyExtractor={(item) => item.id}
                                renderItem={renderItem}
                                contentContainerStyle={[
                                    styles.listContent,
                                    { paddingBottom: insets.bottom + SPACING.xl }
                                ]}
                                ListEmptyComponent={() => (
                                    <View style={styles.emptyContainer}>
                                        <Feather name="users" size={48} color={COLORS.textMuted} />
                                        <Text style={styles.emptyText}>
                                            {searchQuery ? "No se encontraron clientes" : "No hay clientes registrados"}
                                        </Text>
                                    </View>
                                )}
                            />
                        )}
                    </>
                )}

                {/* Delete Confirmation Modal */}
                <DeleteConfirmationModal
                    visible={showDeleteModal}
                    onCancel={() => {
                        setShowDeleteModal(false);
                        setClientToDelete(null);
                    }}
                    onConfirm={confirmDelete}
                    sectionName={clientToDelete?.name || 'este cliente'}
                    title="Eliminar cliente"
                    message={`¿Estás seguro de que deseas eliminar a "${clientToDelete?.name}"? Dejará de aparecer en la lista pero se mantendrá en transacciones pasadas.`}
                />
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    title: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
    },
    closeButton: {
        padding: SPACING.xs,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        margin: SPACING.md,
        paddingHorizontal: SPACING.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        height: 48,
    },
    searchIcon: {
        marginRight: SPACING.sm,
    },
    searchInput: {
        flex: 1,
        marginLeft: SPACING.sm,
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.text,
    },
    listContent: {
        padding: SPACING.md,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clientItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.sm,
    },
    clientAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.md,
    },
    clientInfo: {
        flex: 1,
    },
    clientName: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
        marginBottom: 4,
    },
    clientDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    detailBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: SPACING.sm,
    },
    detailText: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.textSecondary,
        marginLeft: 4,
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: SPACING.sm,
    },
    actionButton: {
        padding: SPACING.xs,
        marginLeft: SPACING.xs,
    },
    editButton: {
        backgroundColor: COLORS.primary + '15', // Light primary
        borderRadius: RADIUS.sm,
        padding: 6,
    },
    deleteButton: {
        backgroundColor: COLORS.error + '15', // Light error
        borderRadius: RADIUS.sm,
        padding: 6,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
        marginTop: SPACING.xl,
    },
    emptyText: {
        marginTop: SPACING.md,
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.textMuted,
    },
    // Edit Form Styles
    editFormContent: {
        padding: SPACING.lg,
    },
    formActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: SPACING.xl,
    },
    formButton: {
        flex: 1,
        height: 50,
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    cancelButton: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: SPACING.md,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        ...SHADOWS.md,
    },
    cancelButtonText: {
        color: COLORS.textSecondary,
        fontWeight: TYPOGRAPHY.weight.bold,
        fontSize: TYPOGRAPHY.size.md,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: TYPOGRAPHY.weight.bold,
        fontSize: TYPOGRAPHY.size.md,
    }
});

export default ClientSelectorModal;
