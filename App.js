import 'react-native-url-polyfill/auto';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, BackHandler, Alert } from 'react-native';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { COLORS, SPACING, SIZES } from './constants/Theme';

import Header from './components/Header';
import BottomNavBar from './components/BottomNavBar';

import InventoryScreen from './screens/InventoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import CreateSectionModal from './components/CreateSectionModal';
import SectionContentsScreen from './screens/SectionContentsScreen';
import WorkspaceScreen from './screens/WorkspaceScreen';
import CanvasesScreen from './screens/CanvasesScreen';

import CreateProductScreen from './screens/CreateProductScreen';
import EditProductScreen from './screens/EditProductScreen';
import CreateCanvasModal from './components/CreateCanvasModal';
import { SettingsProvider } from './context/SettingsContext';
import { DataProvider, useData } from './context/DataContext';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import LoadingScreen from './components/LoadingScreen';
import { LoadingProvider, useLoading } from './context/LoadingContext';
import { AlertProvider, useAlert } from './context/AlertContext';
import { NotesProvider, useNotes } from './context/NotesContext';
import NotesScreen from './screens/NotesScreen';
import NoteEditorScreen from './screens/NoteEditorScreen';
import { LicenseProvider, useLicense } from './context/LicenseContext';
import LicenseActivationScreen from './screens/LicenseActivationScreen';
import LicenseBlockedScreen from './screens/LicenseBlockedScreen';
import LicenseWarningBanner from './components/LicenseWarningBanner';
import LicenseGraceModal from './components/LicenseGraceModal';
import GraceCountdownBadge from './components/GraceCountdownBadge';
import AnimatedScreenTransition from './components/AnimatedScreenTransition';

// Finance Screens
import FinancesScreen from './screens/FinancesScreen';
import CreateSaleScreen from './screens/CreateSaleScreen';
import CreateRentalScreen from './screens/CreateRentalScreen';
import CreateExpenseScreen from './screens/CreateExpenseScreen';
import ReportsScreen from './screens/ReportsScreen';
import TransactionDetailScreen from './screens/TransactionDetailScreen';
import CreateDecorationScreen from './screens/CreateDecorationScreen';
import AllTransactionsScreen from './screens/AllTransactionsScreen';
import CreateQuotationScreen from './screens/CreateQuotationScreen';
import QuotationsListScreen from './screens/QuotationsListScreen';
import QuotationDetailScreen from './screens/QuotationDetailScreen';

const FULLSCREEN_TABS = [

  'create_product',
  'edit_product',
  'create_sale',
  'create_rental',
  'create_decoration',
  'create_expense',
  'create_quotation',
  'quotations_list',
  'quotation_detail',
  'reports',
  'transaction_detail',
  'transaction_detail',
  'all_transactions',
  'create_note',
  'edit_note'
];

function AppContent() {
  const {
    warningLevel,
    isInGracePeriod,
    gracePeriodEndsAt,
    isWarningDismissed,
    isGraceModalDismissed
  } = useLicense();
  const [activeTab, setActiveTab] = useState('home');
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [allTransactionsInitialTab, setAllTransactionsInitialTab] = useState('ingresos');

  const { showAlert } = useAlert();

  const {
    sections,
    activeSection,
    products,
    setActiveSection,
    addSection,
    updateSection,
    deleteSection,
    duplicateSection,
    addProduct,
    updateProduct,
    duplicateProduct,
    deleteProduct,
    isLoading,
    initializationError,
    saveCanvas,
  } = useData();

  const finance = useFinance();

  const workspace = useWorkspace();
  const { addNote, updateNote, deleteNote } = useNotes();

  useEffect(() => {
    const backAction = () => {
      if (activeTab === 'home' && activeSection) {
        setActiveSection(null);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [activeTab, activeSection, setActiveSection]);

  const handleCreateSection = useCallback(async (sectionData) => {
    try {
      await addSection(sectionData);
      setCreateModalVisible(false);
    } catch (error) {
      console.error("Error creating section:", error);
      showAlert("error", "Error", "No se pudo crear la sección. Inténtalo de nuevo.");
    }
  }, [addSection]);

  const handleBackToHome = useCallback(() => {
    setActiveSection(null);
  }, [setActiveSection]);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  // Specific Action Handlers
  const handleCreateCanvas = useCallback(() => {
    workspace.resetWorkspace();
    setActiveTab('workspace');
  }, [workspace]);

  const handleCreateSectionRequest = useCallback(() => {
    setCreateModalVisible(true);
  }, []);

  const handleCreateProductRequest = useCallback(() => {
    setActiveTab('create_product');
  }, []);

  const handleEditProductRequest = useCallback((product) => {
    setEditingProduct(product);
    setActiveTab('edit_product');
  }, []);

  const handleOpenCanvas = useCallback((canvas) => {
    workspace.loadCanvas(canvas);
    setActiveTab('workspace');
  }, [workspace]);

  // Transaction Actions
  const handleEditTransaction = (transaction) => {
    // Transaction editing is handled within TransactionDetailScreen
    console.log("Edit requested for:", transaction.id);
  };

  const handleDeleteTransaction = async (transaction) => {
    try {
      if (transaction.type === 'expense' && finance.deleteExpense) {
        await finance.deleteExpense(transaction.id);
      } else if (finance.deleteTransaction) {
        // Generic delete for Sales and Rentals
        await finance.deleteTransaction(transaction.id);
      } else {
        console.error("Deleting transaction method not found");
      }
      setSelectedTransaction(null);
      setActiveTab('finances');
    } catch (e) {
      console.error(e);
      showAlert("error", "Error", "No se pudo eliminar la transacción.");
    }
  };

  const handleCreateNoteRequest = useCallback(() => {
    setActiveTab('create_note');
  }, []);

  const handleNotePress = useCallback((note) => {
    setSelectedNote(note);
    setActiveTab('edit_note');
  }, []);


  const renderContent = useMemo(() => {
    if (activeTab === 'home') {
      if (activeSection) {
        return (
          <SectionContentsScreen
            section={activeSection}
            products={products}
            onBack={handleBackToHome}
            onEditProduct={handleEditProductRequest}
            onDuplicateProduct={duplicateProduct}
            onDeleteProduct={deleteProduct}
            onCreateProduct={handleCreateProductRequest}
            onUpdateProduct={updateProduct}
          />
        );
      }
      return (
        <InventoryScreen
          sections={sections}
          onDeleteSection={deleteSection}
          onDuplicateSection={duplicateSection}
          onEditSection={updateSection}
          onSectionPress={setActiveSection}
          onCreateSection={handleCreateSectionRequest}
        />
      );
    } else if (activeTab === 'settings') {
      return <SettingsScreen />;
    } else if (activeTab === 'files') {
      return <CanvasesScreen
        onOpenCanvas={handleOpenCanvas}
        onCreateCanvas={handleCreateCanvas}
      />;
    } else if (activeTab === 'notes') {
      return (
        <NotesScreen
          onCreateNote={handleCreateNoteRequest}
          onNotePress={handleNotePress}
        />
      );
    } else if (activeTab === 'create_note') {
      return (
        <NoteEditorScreen
          onBack={() => setActiveTab('notes')}
          onSave={async (noteData) => {
            try {
              const newNote = await addNote(noteData);
              setSelectedNote(newNote);
              setActiveTab('edit_note');
            } catch (error) {
              console.error(error);
              showAlert("error", "Error", "No se pudo crear la nota");
            }
          }}
        />
      );
    } else if (activeTab === 'edit_note' && selectedNote) {
      return (
        <NoteEditorScreen
          note={selectedNote}
          onBack={() => {
            setSelectedNote(null);
            setActiveTab('notes');
          }}
          onDelete={async (id) => {
            try {
              await deleteNote(id);
              setSelectedNote(null);
              setActiveTab('notes');
            } catch (error) {
              console.error(error);
              showAlert("error", "Error", "No se pudo eliminar la nota");
            }
          }}
          onSave={async (noteData) => {
            try {
              await updateNote(noteData);
              // No navegamos "back", nos quedamos aquí
              // Pero actualizamos la nota seleccionada con los nuevos datos para que la UI no parpadee datos viejos
              setSelectedNote({ ...selectedNote, ...noteData, updatedAt: new Date().toISOString() });
            } catch (error) {
              console.error(error);
              showAlert("error", "Error", "No se pudo actualizar la nota");
            }
          }}
        />
      );
    } else if (activeTab === 'create_product') {
      return (
        <CreateProductScreen
          onBack={() => setActiveTab('home')}
          onCreate={async (productData) => {
            try {
              await addProduct(productData);
              setActiveTab('home');
            } catch (error) {
              console.error(error);
              showAlert("error", "Error", "No se pudo crear el producto");
            }
          }}
        />
      );
    } else if (activeTab === 'edit_product' && editingProduct) {
      return (
        <EditProductScreen
          product={editingProduct}
          onBack={() => {
            setEditingProduct(null);
            setActiveTab('home');
          }}
          onSave={async (updatedProduct) => {
            try {
              await updateProduct(updatedProduct);
              setEditingProduct(null);
              setActiveTab('home');
            } catch (error) {
              console.error(error);
              showAlert("error", "Error", "No se pudo actualizar el producto");
            }
          }}
        />
      );
    } else if (activeTab === 'finances') {
      return (
        <FinancesScreen
          onCreateSale={() => setActiveTab('create_sale')}
          onCreateRental={() => setActiveTab('create_rental')}
          onCreateDecoration={() => setActiveTab('create_decoration')}
          onCreateExpense={() => setActiveTab('create_expense')}
          onCreateQuotation={() => setActiveTab('create_quotation')}
          onViewReports={() => setActiveTab('reports')}
          onViewQuotations={() => setActiveTab('quotations_list')}
          onViewAllTransactions={(tab) => {
            setAllTransactionsInitialTab(tab);
            setActiveTab('all_transactions');
          }}
          onTransactionPress={(tx) => {
            setSelectedTransaction(tx);
            setActiveTab('transaction_detail');
          }}
        />
      );
    } else if (activeTab === 'all_transactions') {
      return (
        <AllTransactionsScreen
          initialTab={allTransactionsInitialTab}
          onBack={() => setActiveTab('finances')}
          onTransactionPress={(tx) => {
            setSelectedTransaction(tx);
            setActiveTab('transaction_detail');
          }}
        />
      );
    } else if (activeTab === 'create_sale') {
      return <CreateSaleScreen onBack={() => setActiveTab('finances')} />;
    } else if (activeTab === 'create_rental') {
      return <CreateRentalScreen onBack={() => setActiveTab('finances')} />;
    } else if (activeTab === 'create_decoration') {
      return <CreateDecorationScreen onBack={() => setActiveTab('finances')} />;
    } else if (activeTab === 'create_expense') {
      return <CreateExpenseScreen onBack={() => setActiveTab('finances')} />;
    } else if (activeTab === 'create_quotation') {
      return <CreateQuotationScreen onBack={() => setActiveTab('finances')} />;
    } else if (activeTab === 'quotations_list') {
      return (
        <QuotationsListScreen
          onBack={() => setActiveTab('finances')}
          onQuotationPress={(q) => {
            setSelectedQuotation(q);
            setActiveTab('quotation_detail');
          }}
        />
      );
    } else if (activeTab === 'quotation_detail' && selectedQuotation) {
      return (
        <QuotationDetailScreen
          quotation={selectedQuotation}
          onBack={() => {
            setSelectedQuotation(null);
            setActiveTab('quotations_list');
          }}
          onConvert={(tx) => {
            setSelectedTransaction(tx);
            setActiveTab('transaction_detail');
          }}
        />
      );
    } else if (activeTab === 'reports') {
      return <ReportsScreen onBack={() => setActiveTab('finances')} />;
    } else if (activeTab === 'transaction_detail' && selectedTransaction) {
      return (
        <TransactionDetailScreen
          transaction={selectedTransaction}
          onBack={() => {
            setSelectedTransaction(null);
            setActiveTab('finances');
          }}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
          onShare={(tx) => {
            showAlert("info", "Compartir", `Compartiendo ${tx.productName}...`);
          }}
        />
      );
    }
    return null;
  }, [activeTab, activeSection, sections, products, handleBackToHome, deleteSection, duplicateSection, updateSection, setActiveSection, updateProduct, duplicateProduct, deleteProduct, handleCreateSectionRequest, handleCreateProductRequest, handleCreateCanvas, addProduct, selectedTransaction]);

  const { setIsLayoutReady } = useLoading();
  const insets = useSafeAreaInsets();

  if (initializationError) {
    return (
      <View style={[styles.container, styles.center, styles.errorContainer]}>
        <Text style={styles.errorTitle}>
          Error al iniciar la aplicación
        </Text>
        <Text style={styles.errorMessage}>
          {initializationError.message || "Ocurrió un error inesperado al cargar la base de datos."}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={() => setIsLayoutReady(true)}>
      {!FULLSCREEN_TABS.includes(activeTab) && activeTab !== 'finances' && activeTab !== 'workspace' && activeTab !== 'notes' && !(activeTab === 'home' && activeSection) && <Header />}

      <View style={[styles.body, { paddingBottom: FULLSCREEN_TABS.includes(activeTab) ? 0 : SIZES.navBarHeight + insets.bottom }]}>

        {/* Persistent Workspace Layer */}
        <View style={[styles.layer, { display: activeTab === 'workspace' ? 'flex' : 'none' }]}>
          <WorkspaceScreen
            isVisible={activeTab === 'workspace'}
            onBack={() => setActiveTab('files')}
          />
        </View>

        {/* Other Tabs Layer */}
        <View style={[styles.layer, { display: activeTab !== 'workspace' ? 'flex' : 'none' }]}>
          {renderContent}
          <StatusBar style="auto" />
        </View>
      </View>

      {/* Hide Bottom Nav on full screen tabs */}
      {!FULLSCREEN_TABS.includes(activeTab) && (
        <BottomNavBar
          currentTab={activeTab}
          onTabChange={handleTabChange}
        />
      )}

      <CreateSectionModal
        visible={isCreateModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreate={handleCreateSection}
      />

      {/* COMPONENTES DE SISTEMA DE LICENCIAS */}
      {!isWarningDismissed && warningLevel && warningLevel !== 'EXPIRED' && (
        <View style={{ position: 'absolute', top: SIZES.navBarHeight + insets.top, width: '100%', zIndex: 999 }}>
          <LicenseWarningBanner level={warningLevel} />
        </View>
      )}

      <LicenseGraceModal
        visible={isInGracePeriod}
        endsAt={gracePeriodEndsAt}
      />

      {isInGracePeriod && isGraceModalDismissed && (
        <GraceCountdownBadge endsAt={gracePeriodEndsAt} />
      )}

    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AlertProvider>
          <LicenseProvider>
            <LicenseGate />
          </LicenseProvider>
        </AlertProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function LicenseGate() {
  const { isActivated, isValid, isLoading, licenseInfo, isEnteringNewCode } = useLicense();

  // Calcular screenKey para animaciones
  const getScreenKey = () => {
    if (isLoading) return 'loading';
    if (isEnteringNewCode || !isActivated) return 'activation';
    if (!isValid) return 'blocked';
    return 'app';
  };

  const screenKey = getScreenKey();

  const renderScreen = () => {
    if (isLoading) {
      return <LoadingScreen />;
    }

    if (isEnteringNewCode || !isActivated) {
      return <LicenseActivationScreen />;
    }

    if (!isValid) {
      return <LicenseBlockedScreen info={licenseInfo} />;
    }

    return (
      <DataProvider>
        <SettingsProvider>
          <FinanceProvider>
            <WorkspaceProvider>
              <LoadingProvider>
                <NotesProvider>
                  <AppContent />
                </NotesProvider>
              </LoadingProvider>
            </WorkspaceProvider>
          </FinanceProvider>
        </SettingsProvider>
      </DataProvider>
    );
  };

  return (
    <AnimatedScreenTransition screenKey={screenKey}>
      {renderScreen()}
    </AnimatedScreenTransition>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  body: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  layer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorContainer: {
    padding: 20,
  },
  errorTitle: {
    color: 'red',
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  }
});
