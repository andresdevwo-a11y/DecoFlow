import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Modal, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, TextInput, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../constants/Theme';
import { useData } from '../../../context/DataContext';
import * as Database from '../../../services/Database';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const SPACING_SIZE = SPACING.md;
const ITEM_WIDTH = (width - (SPACING_SIZE * (COLUMN_COUNT + 1))) / COLUMN_COUNT;

export default function ProductPickerModal({ visible, onClose, onSelect }) {
    const { sections } = useData();
    const [selectedTab, setSelectedTab] = useState(0); // 0 = "Todos"
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const insets = useSafeAreaInsets();

    // Prepare tabs: "Todos" + section names
    const tabs = useMemo(() => {
        return [{ id: 'all', name: 'Todos' }, ...sections];
    }, [sections]);

    // Fetch products when selected tab changes
    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoading(true);
            try {
                let loadedProducts = [];
                if (selectedTab === 0) {
                    // Fetch all
                    loadedProducts = await Database.getAllProducts();
                } else {
                    // Fetch by section
                    const section = tabs[selectedTab];
                    if (section) {
                        loadedProducts = await Database.getProductsBySectionId(section.id);
                    }
                }
                setProducts(loadedProducts);
            } catch (error) {
                console.error("Failed to fetch products for picker:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (visible) {
            fetchProducts();
        }
    }, [selectedTab, visible, tabs]);

    // Filter by search text
    const filteredProducts = useMemo(() => {
        return products.filter(p =>
            p.name.toLowerCase().includes(searchText.toLowerCase())
        );
    }, [products, searchText]);

    return (
        <Modal
            animationType="slide"
            presentationStyle="pageSheet" // Nice on iOS
            visible={visible}
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <View style={[styles.container, { paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Feather name="x" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Seleccionar Producto</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <Feather name="search" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
                    <TextInput
                        placeholder="Buscar productos..."
                        placeholderTextColor={COLORS.textMuted}
                        style={styles.searchInput}
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                </View>

                {/* Tabs / Sections */}
                <View style={styles.tabsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
                        {tabs.map((section, index) => (
                            <TouchableOpacity
                                key={section.id}
                                style={[styles.tab, selectedTab === index && styles.activeTab]}
                                onPress={() => setSelectedTab(index)}
                            >
                                <Text style={[styles.tabText, selectedTab === index && styles.activeTabText]}>
                                    {section.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Grid */}
                <ScrollView contentContainerStyle={styles.gridContainer}>
                    <View style={styles.grid}>
                        {filteredProducts.map((item, index) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.gridItem,
                                    (index + 1) % COLUMN_COUNT === 0 && { marginRight: 0 }
                                ]}
                                activeOpacity={0.7}
                                onPress={() => onSelect(item)}
                            >
                                {item.image ? (
                                    <Image source={{ uri: item.image }} style={styles.itemImage} />
                                ) : (
                                    <View style={styles.itemImage}>
                                        <Feather name="image" size={24} color={COLORS.placeholder} />
                                    </View>
                                )}
                                <Text numberOfLines={1} style={styles.itemName}>{item.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {filteredProducts.length === 0 && !isLoading && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No hay productos</Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.text,
    },
    closeBtn: {
        padding: SPACING.xs,
    },
    searchContainer: {
        padding: SPACING.md,
        backgroundColor: COLORS.surface,
    },
    searchInput: {
        height: 40,
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.lg,
        paddingLeft: 40,
        fontSize: TYPOGRAPHY.size.base,
        color: COLORS.text,
    },
    searchIcon: {
        position: 'absolute',
        left: SPACING.md + 10,
        top: SPACING.md + 10,
        zIndex: 1,
    },
    tabsContainer: {
        backgroundColor: COLORS.surface,
        paddingBottom: SPACING.sm,
    },
    tabsContent: {
        paddingHorizontal: SPACING.md,
    },
    tab: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.xs + 2,
        borderRadius: RADIUS.full,
        marginRight: SPACING.sm,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    activeTab: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    tabText: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
        fontWeight: TYPOGRAPHY.weight.medium,
    },
    activeTabText: {
        color: COLORS.surface,
    },
    gridContainer: {
        padding: SPACING_SIZE,
        paddingBottom: 50,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
    },
    gridItem: {
        width: ITEM_WIDTH,
        marginBottom: SPACING_SIZE,
        marginRight: SPACING_SIZE,
    },
    itemImage: {
        width: ITEM_WIDTH,
        height: ITEM_WIDTH,
        backgroundColor: '#E5E7EB',
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemName: {
        marginTop: SPACING.xs,
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.text,
        textAlign: 'center',
    },
    emptyState: {
        padding: SPACING.xl,
        alignItems: 'center',
    },
    emptyText: {
        color: COLORS.textMuted,
        fontSize: TYPOGRAPHY.size.md,
    }
});
