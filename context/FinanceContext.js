import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as Database from '../services/Database';
import * as ImageService from '../services/ImageService';
import { getPeriodDates } from '../utils/dateHelpers';

const FinanceContext = createContext();

// Expense categories with labels and icons
export const EXPENSE_CATEGORIES = {
    transport: { label: 'Transporte', icon: 'truck' },
    materials: { label: 'Materiales', icon: 'package' },
    services: { label: 'Servicios', icon: 'tool' },
    personnel: { label: 'Personal', icon: 'users' },
    marketing: { label: 'Marketing', icon: 'trending-up' },
    other: { label: 'Otros', icon: 'more-horizontal' }
};

export const FinanceProvider = ({ children }) => {
    const [transactions, setTransactions] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [activeRentals, setActiveRentals] = useState([]);
    const [summary, setSummary] = useState({
        sales: { total: 0, count: 0 },
        rentals: { total: 0, count: 0 },
        decorations: { total: 0, count: 0 },
        expenses: { total: 0, count: 0 },
        totalIncome: 0,
        balance: 0
    });
    const [quotations, setQuotations] = useState([]);
    const [quotationsLoading, setQuotationsLoading] = useState(true);

    const [isLoading, setIsLoading] = useState(true);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [savedReports, setSavedReports] = useState([]);

    const isMounted = useRef(true);

    // Initial mount and cleanup
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Load initial data
    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                loadTransactions(),
                loadExpenses(),
                loadActiveRentals(),
                loadSummary(),
                loadSavedReports(),
                loadQuotations() // Added loadQuotations here
            ]);
        } catch (error) {
            console.error("Error loading finance data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadTransactions = async () => {
        try {
            const result = await Database.getTransactions();
            setTransactions(result);
            // Get last 5 transactions for recent view
            setRecentTransactions(result.slice(0, 5));
        } catch (error) {
            console.error("Error loading transactions:", error);
        }
    };

    const loadExpenses = async () => {
        try {
            const result = await Database.getExpenses();
            setExpenses(result);
        } catch (error) {
            console.error("Error loading expenses:", error);
        }
    };

    const loadActiveRentals = async () => {
        try {
            const result = await Database.getActiveRentals();
            setActiveRentals(result);
        } catch (error) {
            console.error("Error loading active rentals:", error);
        }
    };

    const loadSummary = async () => {
        try {
            const result = await Database.getFinanceSummary();
            setSummary(result);
        } catch (error) {
            console.error("Error loading finance summary:", error);
        }
    };

    const loadSavedReports = async () => {
        try {
            const result = await Database.getSavedReports();
            setSavedReports(result);
        } catch (error) {
            console.error("Error loading saved reports:", error);
        }
    };

    // ==================== SALES ====================

    const addSale = useCallback(async (saleData) => {
        const now = new Date().toISOString();
        const transaction = {
            id: `sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            type: 'sale',
            productId: saleData.productId || null,
            productName: saleData.productName,
            quantity: saleData.quantity || 1,
            unitPrice: parseFloat(saleData.unitPrice) || 0,
            discount: parseFloat(saleData.discount) || 0,
            totalAmount: parseFloat(saleData.totalAmount) || 0,
            customerName: saleData.customerName || null,
            clientData: saleData.clientData || null,
            notes: saleData.notes || null,
            date: saleData.date || now.split('T')[0],
            items: saleData.items || null,
            // Installment fields
            isInstallment: saleData.isInstallment || false,
            totalPrice: saleData.totalPrice || null,
            amountPaid: saleData.amountPaid || 0,
            createdAt: now,
            updatedAt: now
        };

        try {
            await Database.createTransaction(transaction);
            setTransactions(prev => [transaction, ...prev]);
            setRecentTransactions(prev => [transaction, ...prev].slice(0, 5));
            await loadSummary();
            return transaction;
        } catch (error) {
            console.error("Error creating sale:", error);
            throw error;
        }
    }, []);

    // ==================== RENTALS ====================

    const addRental = useCallback(async (rentalData) => {
        const now = new Date().toISOString();
        const transactionId = `rental-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const transaction = {
            id: transactionId,
            type: 'rental',
            productId: rentalData.productId || null,
            productName: rentalData.productName,
            quantity: rentalData.quantity || 1,
            unitPrice: parseFloat(rentalData.unitPrice) || 0,
            discount: parseFloat(rentalData.discount) || 0,
            totalAmount: parseFloat(rentalData.totalAmount) || 0,
            customerName: rentalData.customerName || null,
            clientData: rentalData.clientData || null,
            notes: rentalData.notes || null,
            date: rentalData.startDate || now.split('T')[0],
            items: rentalData.items || null,
            // Installment fields
            isInstallment: rentalData.isInstallment || false,
            totalPrice: rentalData.totalPrice || null,
            amountPaid: rentalData.amountPaid || 0,
            createdAt: now,
            updatedAt: now
        };

        const rental = {
            id: `rental-info-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            transactionId: transactionId,
            status: 'active',
            startDate: rentalData.startDate || now.split('T')[0],
            endDate: rentalData.endDate || null,
            createdAt: now,
            updatedAt: now
        };

        try {
            await Database.createTransaction(transaction);
            await Database.createRental(rental);

            const fullRental = { ...transaction, ...rental };
            setTransactions(prev => [transaction, ...prev]);
            setRecentTransactions(prev => [transaction, ...prev].slice(0, 5));
            setActiveRentals(prev => [fullRental, ...prev]);
            await loadSummary();
            return transaction;
        } catch (error) {
            console.error("Error creating rental:", error);
            throw error;
        }
    }, []);

    // ==================== DECORATIONS ====================

    const addDecoration = useCallback(async (decorationData) => {
        const now = new Date().toISOString();
        const transactionId = `decoration-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const transaction = {
            id: transactionId,
            type: 'decoration',
            productId: null,
            productName: decorationData.productName,
            quantity: 1,
            unitPrice: parseFloat(decorationData.totalAmount) || 0,
            discount: 0,
            totalAmount: parseFloat(decorationData.totalAmount) || 0,
            customerName: decorationData.customerName || null,
            clientData: decorationData.clientData || null,
            notes: decorationData.notes || null,
            date: decorationData.startDate || now.split('T')[0],
            items: decorationData.items || null,
            // Installment fields
            isInstallment: decorationData.isInstallment || false,
            totalPrice: decorationData.totalPrice || null,
            amountPaid: decorationData.amountPaid || 0,
            createdAt: now,
            updatedAt: now
        };

        const decoration = {
            id: `decoration-info-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            transactionId: transactionId,
            status: 'active',
            startDate: decorationData.startDate || now.split('T')[0],
            endDate: decorationData.endDate || null,
            createdAt: now,
            updatedAt: now
        };

        try {
            await Database.createTransaction(transaction);
            await Database.createDecoration(decoration);

            setTransactions(prev => [transaction, ...prev]);
            setRecentTransactions(prev => [transaction, ...prev].slice(0, 5));
            await loadSummary();
            return transaction;
        } catch (error) {
            console.error("Error creating decoration:", error);
            throw error;
        }
    }, []);

    const completeRental = useCallback(async (transactionId) => {
        try {
            const now = new Date().toISOString();
            await Database.updateRentalStatus(transactionId, 'completed', now);
            setActiveRentals(prev => prev.filter(r => r.id !== transactionId));
            await loadSummary();
        } catch (error) {
            console.error("Error completing rental:", error);
            throw error;
        }
    }, []);

    const cancelRental = useCallback(async (transactionId) => {
        try {
            await Database.updateRentalStatus(transactionId, 'cancelled');
            setActiveRentals(prev => prev.filter(r => r.id !== transactionId));
            await loadSummary();
        } catch (error) {
            console.error("Error cancelling rental:", error);
            throw error;
        }
    }, []);

    // ==================== EXPENSES ====================

    const addExpense = useCallback(async (expenseData) => {
        const now = new Date().toISOString();

        let finalReceiptImage = expenseData.receiptImage;
        if (finalReceiptImage) {
            try {
                finalReceiptImage = await ImageService.copyToInternal(finalReceiptImage);
            } catch (e) {
                console.error("Failed to save receipt image:", e);
            }
        }

        const expense = {
            id: `expense-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            category: expenseData.category,
            description: expenseData.description,
            amount: parseFloat(expenseData.amount) || 0,
            date: expenseData.date || now.split('T')[0],
            receiptImage: finalReceiptImage,
            notes: expenseData.notes || null,
            createdAt: now,
            updatedAt: now
        };

        try {
            await Database.createExpense(expense);
            setExpenses(prev => [expense, ...prev]);
            await loadSummary();
            return expense;
        } catch (error) {
            console.error("Error creating expense:", error);
            throw error;
        }
    }, []);

    // ==================== QUOTATIONS ====================

    const loadQuotations = async () => {
        try {
            setQuotationsLoading(true);
            const data = await Database.getQuotations();
            if (isMounted.current) {
                setQuotations(data);
            }
        } catch (error) {
            console.error("Error loading quotations:", error);
        } finally {
            if (isMounted.current) {
                setQuotationsLoading(false);
            }
        }
    };

    const addQuotation = async (quotationData) => {
        try {
            const now = new Date().toISOString();
            const today = now.split('T')[0]; // YYYY-MM-DD

            // Database.createQuotation handles number generation if missing
            // But we can generate ID here if needed for optimistic UI, 
            // though createQuotation also accepts ID. 
            // Let's rely on Database logic where possible but ensure required fields.

            const newQuotation = {
                id: Database.generateUUID(),
                ...quotationData,
                // Ensure required fields have defaults
                unitPrice: quotationData.unitPrice ?? quotationData.totalAmount ?? 0,
                date: quotationData.date ?? quotationData.startDate ?? today,
                createdAt: now,
                updatedAt: now,
                status: 'pending'
            };

            await Database.createQuotation(newQuotation);
            await loadQuotations();
            return newQuotation;
        } catch (error) {
            console.error("Error adding quotation:", error);
            throw error;
        }
    };

    const updateQuotation = async (quotationData) => {
        try {
            const updatedQuotation = {
                ...quotationData,
                updatedAt: new Date().toISOString()
            };
            await Database.updateQuotation(updatedQuotation);
            await loadQuotations();
            return updatedQuotation;
        } catch (error) {
            console.error("Error updating quotation:", error);
            throw error;
        }
    };

    const deleteQuotation = async (id) => {
        try {
            await Database.deleteQuotation(id);
            await loadQuotations();
            return true;
        } catch (error) {
            console.error("Error deleting quotation:", error);
            throw error;
        }
    };

    const convertQuotation = async (quotationId, options = {}) => {
        try {
            // Delegate completely to Database layer which handles:
            // 1. Transaction creation
            // 2. Rental/Decoration specific record creation
            // 3. Status update
            const transaction = await Database.convertQuotationToTransaction(quotationId, options);

            // Refresh all relevant data
            await loadTransactions();
            await loadActiveRentals();
            // await loadActiveDecorations(); // future proofing
            await loadSummary();
            await loadQuotations();

            return transaction.id;
        } catch (error) {
            console.error("Error converting quotation:", error);
            throw error;
        }
    };

    const updateExpense = useCallback(async (updatedExpense) => {
        const now = new Date().toISOString();

        // Handle image update
        let finalReceiptImage = updatedExpense.receiptImage;
        const currentExpense = expenses.find(e => e.id === updatedExpense.id);

        if (finalReceiptImage && currentExpense && finalReceiptImage !== currentExpense.receiptImage) {
            try {
                finalReceiptImage = await ImageService.copyToInternal(finalReceiptImage);
                if (currentExpense.receiptImage) {
                    await ImageService.deleteImage(currentExpense.receiptImage);
                }
            } catch (e) {
                console.error("Failed to update receipt image:", e);
            }
        }

        const expenseWithTimestamp = {
            ...updatedExpense,
            receiptImage: finalReceiptImage,
            updatedAt: now
        };

        try {
            await Database.updateExpense(expenseWithTimestamp);
            setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? expenseWithTimestamp : e));
            await loadSummary();
            return expenseWithTimestamp;
        } catch (error) {
            console.error("Error updating expense:", error);
            throw error;
        }
    }, [expenses]);

    const deleteExpense = useCallback(async (expenseId) => {
        try {
            const expense = expenses.find(e => e.id === expenseId);
            if (expense && expense.receiptImage) {
                await ImageService.deleteImage(expense.receiptImage);
            }

            await Database.deleteExpense(expenseId);
            setExpenses(prev => prev.filter(e => e.id !== expenseId));
            await loadSummary();
        } catch (error) {
            console.error("Error deleting expense:", error);
            throw error;
        }
    }, [expenses]);

    // ==================== TRANSACTIONS ====================

    const deleteTransaction = useCallback(async (transactionId) => {
        try {
            await Database.deleteTransaction(transactionId);
            setTransactions(prev => prev.filter(t => t.id !== transactionId));
            setRecentTransactions(prev => prev.filter(t => t.id !== transactionId));
            setActiveRentals(prev => prev.filter(r => r.id !== transactionId));
            await loadSummary();
        } catch (error) {
            console.error("Error deleting transaction:", error);
            throw error;
        }
    }, []);

    // Update installment payment - adds a new payment to an existing installment transaction
    const updateInstallmentPayment = useCallback(async (transactionId, newPaymentAmount) => {
        try {
            const updatedTransaction = await Database.updateInstallmentPayment(transactionId, newPaymentAmount);

            // Update local state
            setTransactions(prev => prev.map(t =>
                t.id === transactionId
                    ? { ...t, ...updatedTransaction }
                    : t
            ));
            setRecentTransactions(prev => prev.map(t =>
                t.id === transactionId
                    ? { ...t, ...updatedTransaction }
                    : t
            ));

            await loadSummary();
            return updatedTransaction;
        } catch (error) {
            console.error("Error updating installment payment:", error);
            throw error;
        }
    }, []);

    const updateTransaction = useCallback(async (transactionId, updateData) => {
        try {
            const now = new Date().toISOString();

            // 1. Get current transaction to determine type
            const currentTransaction = transactions.find(t => t.id === transactionId);
            if (!currentTransaction) throw new Error("Transaction not found");

            const { type } = currentTransaction;

            // 2. Prepare common update data
            const commonUpdate = {
                id: transactionId,
                productId: updateData.productId !== undefined ? updateData.productId : currentTransaction.productId,
                productName: updateData.productName || currentTransaction.productName,
                quantity: updateData.quantity || currentTransaction.quantity,
                unitPrice: updateData.unitPrice || currentTransaction.unitPrice,
                discount: updateData.discount || currentTransaction.discount,
                totalAmount: updateData.totalAmount || currentTransaction.totalAmount,
                customerName: updateData.customerName || currentTransaction.customerName,
                clientData: updateData.clientData !== undefined ? updateData.clientData : currentTransaction.clientData,
                notes: updateData.notes !== undefined ? updateData.notes : currentTransaction.notes,
                date: updateData.date || currentTransaction.date,
                items: updateData.items !== undefined ? updateData.items : currentTransaction.items,
                updatedAt: now
            };

            // 3. Update generic transaction record
            await Database.updateTransaction(commonUpdate);

            // 4. Handle specific type updates
            if (type === 'rental') {
                const rentalUpdate = {
                    transactionId: transactionId,
                    startDate: updateData.startDate || commonUpdate.date,
                    endDate: updateData.endDate || null,
                    updatedAt: now
                };
                await Database.updateRental(rentalUpdate);
            }

            if (type === 'decoration') {
                const decorationUpdate = {
                    transactionId: transactionId,
                    startDate: updateData.startDate || commonUpdate.date,
                    endDate: updateData.endDate || null,
                    updatedAt: now
                };
                // We'll perform an update on the decorations table
                // Note: Database.updateDecoration must be imported/available. I just added it.
                await Database.updateDecoration(decorationUpdate);
            }

            // 5. Update local state
            setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, ...commonUpdate } : t));
            setRecentTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, ...commonUpdate } : t));

            if (type === 'rental') {
                // For rentals, we need to update activeRentals too if it's there
                // We might need to fetch the full rental details again or merge carefully
                // For simplicity, let's reload active rentals
                await loadActiveRentals();
            }

            await loadSummary();

            return { ...currentTransaction, ...commonUpdate };
        } catch (error) {
            console.error("Error updating transaction:", error);
            throw error;
        }
    }, [transactions]);

    // Helper to validate filters
    const validateFilters = (filters) => {
        if (!filters) return { isValid: false, message: 'Filtros no definidos' };
        if (!filters.sales && !filters.rentals && !filters.expenses && !filters.decorations) {
            return { isValid: false, message: 'Selecciona al menos un tipo de transacción para el reporte.' };
        }
        return { isValid: true };
    };

    // Helper to filter and build report data
    const buildReportFromData = (transactions, expenses, periodData, filters) => {
        // Filter transactions by type based on filters
        const filteredTransactions = transactions.filter(t => {
            if (t.type === 'sale' && !filters.sales) return false;
            if (t.type === 'rental' && !filters.rentals) return false;
            if (t.type === 'decoration' && !filters.decorations) return false;
            return true;
        });

        // Filter expenses
        const filteredExpenses = filters.expenses ? expenses : [];

        // Pre-process transactions by type for optimized UI rendering
        const transactionsByType = {
            sales: filteredTransactions.filter(t => t.type === 'sale'),
            rentals: filteredTransactions.filter(t => t.type === 'rental'),
            decorations: filteredTransactions.filter(t => t.type === 'decoration'),
            expenses: filteredExpenses
        };

        // Calculate sales summary
        const salesTotal = transactionsByType.sales.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

        // Calculate rentals summary
        const rentalsTotal = transactionsByType.rentals.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

        // Calculate decorations summary
        const decorationsTotal = transactionsByType.decorations.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

        // Calculate expenses summary
        const expensesTotal = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

        // Calculate expenses by category
        const expensesByCategory = [];
        if (filters.expenses) {
            const categoryMap = {};
            filteredExpenses.forEach(e => {
                if (!categoryMap[e.category]) {
                    categoryMap[e.category] = { category: e.category, total: 0, count: 0 };
                }
                categoryMap[e.category].total += e.amount || 0;
                categoryMap[e.category].count += 1;
            });
            expensesByCategory.push(...Object.values(categoryMap).sort((a, b) => b.total - a.total));
        }

        // Determine period label based on type
        let periodLabel = 'Reporte';
        const { type, startDate, endDate } = periodData;

        switch (type) {
            case 'today': periodLabel = 'Hoy'; break;
            case 'week': periodLabel = 'Semana actual'; break;
            case 'month': periodLabel = 'Mes actual'; break;
            case 'year': periodLabel = 'Año actual'; break;
            case 'custom': periodLabel = 'Rango personalizado'; break;
        }

        const totalIncome = salesTotal + rentalsTotal + decorationsTotal;

        return {
            transactions: filteredTransactions, // Keep for backward compatibility if needed
            expenses: filteredExpenses,         // Keep for backward compatibility if needed
            transactionsByType,                 // New optimized structure
            summary: {
                sales: { total: salesTotal, count: transactionsByType.sales.length },
                rentals: { total: rentalsTotal, count: transactionsByType.rentals.length },
                decorations: { total: decorationsTotal, count: transactionsByType.decorations.length },
                expenses: { total: expensesTotal, count: filteredExpenses.length },
                totalIncome: totalIncome,
                balance: totalIncome - expensesTotal
            },
            expensesByCategory,
            period: {
                type,
                label: periodLabel,
                startDate,
                endDate
            },
            filters
        };
    };

    // ==================== REPORTS ====================

    // Unified Report Generation Function
    const generateReportByPeriod = useCallback(async (periodType, options = {}) => {
        const { startDate: customStartDate, endDate: customEndDate, filters = { sales: true, rentals: true, decorations: true, expenses: true } } = options;

        // 1. Validate filters
        const validation = validateFilters(filters);
        if (!validation.isValid) {
            throw new Error(validation.message);
        }

        try {
            // 2. Calculate dates
            const { startDate, endDate } = getPeriodDates(periodType, customStartDate, customEndDate);

            // 3. Fetch data
            const [transactionsInRange, expensesInRange] = await Promise.all([
                Database.getTransactionsForReport(startDate, endDate),
                Database.getExpensesByDateRange(startDate, endDate)
            ]);

            // 4. Build report
            return buildReportFromData(
                transactionsInRange,
                expensesInRange,
                { type: periodType, startDate, endDate },
                filters
            );
        } catch (error) {
            console.error(`Error generating ${periodType} report:`, error);
            throw error;
        }
    }, []);

    // Legacy support wrappers - kept for backward compatibility but using new system
    const getReportByDateRange = useCallback(async (startDate, endDate, filters) => {
        return generateReportByPeriod('custom', { startDate, endDate, filters });
    }, [generateReportByPeriod]);

    const getTodayReport = useCallback(async (filters) => {
        return generateReportByPeriod('today', { filters });
    }, [generateReportByPeriod]);

    const getWeekReport = useCallback(async (filters) => {
        return generateReportByPeriod('week', { filters });
    }, [generateReportByPeriod]);

    const getMonthReport = useCallback(async (filters) => {
        return generateReportByPeriod('month', { filters });
    }, [generateReportByPeriod]);

    const getYearReport = useCallback(async (filters) => {
        return generateReportByPeriod('year', { filters });
    }, [generateReportByPeriod]);

    const saveReport = useCallback(async (reportData) => {
        try {
            const now = new Date().toISOString();
            const reportToSave = {
                id: `report-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                ...reportData,
                createdAt: now
            };
            await Database.saveReport(reportToSave);
            setSavedReports(prev => [reportToSave, ...prev]);
            return reportToSave;
        } catch (error) {
            console.error("Error saving report:", error);
            throw error;
        }
    }, []);

    const deleteReport = useCallback(async (reportId) => {
        try {
            await Database.deleteReport(reportId);
            setSavedReports(prev => prev.filter(r => r.id !== reportId));
        } catch (error) {
            console.error("Error deleting report:", error);
            throw error;
        }
    }, []);

    const updateReportName = useCallback(async (reportId, newName) => {
        try {
            await Database.updateReportName(reportId, newName);
            setSavedReports(prev => prev.map(r => r.id === reportId ? { ...r, name: newName } : r));
        } catch (error) {
            console.error("Error updating report name:", error);
            throw error;
        }
    }, []);

    // Management Functions
    const resetBalance = useCallback(async () => {
        try {
            await Database.resetFinanceCounters();
            await loadSummary();
        } catch (error) {
            console.error("Error resetting balance:", error);
            throw error;
        }
    }, [loadSummary]);

    const deleteDataByType = useCallback(async (type) => {
        try {
            if (type === 'all') {
                await Database.deleteAllFinanceData();
            } else if (type === 'expense') {
                await Database.deleteAllExpenses();
            } else if (type === 'quotation') {
                await Database.deleteAllQuotations();
            } else {
                await Database.deleteAllTransactionsByType(type);
            }
            // Refresh everything
            await loadAllData();
        } catch (error) {
            console.error("Error deleting data:", error);
            throw error;
        }
    }, []);
    const refresh = useCallback(async () => {
        await loadAllData();
    }, []);

    // Clear State (for Reset Data)
    const clearFinanceState = useCallback(async () => {
        setTransactions([]);
        setExpenses([]);
        setActiveRentals([]);
        setSummary({
            sales: { total: 0, count: 0 },
            rentals: { total: 0, count: 0 },
            decorations: { total: 0, count: 0 },
            expenses: { total: 0, count: 0 },
            totalIncome: 0,
            balance: 0
        });
        setQuotations([]);
        setRecentTransactions([]);
        setSavedReports([]);
    }, []);

    return (
        <FinanceContext.Provider value={{
            // State
            transactions,
            expenses,
            activeRentals,
            summary,
            recentTransactions,
            isLoading,
            quotations,
            quotationsLoading,
            savedReports,

            // Sales
            addSale,

            // Rentals
            addRental,
            completeRental,
            cancelRental,

            // Decorations
            addDecoration,
            getDecorationByTransactionId: Database.getDecorationByTransactionId, // Expose direct DB access for details
            getProductStats: Database.getProductStats, // Expose stats calculation

            // Expenses
            addExpense,
            updateExpense,
            deleteExpense,

            // Quotations
            addQuotation,
            updateQuotation,
            deleteQuotation,
            convertQuotation,

            // Transactions
            deleteTransaction,
            updateTransaction,
            updateInstallmentPayment,

            // Reports
            generateReportByPeriod,
            getReportByDateRange, // Deprecated but kept for safety
            getTodayReport,
            getWeekReport,
            getMonthReport,
            getYearReport,
            saveReport,
            deleteReport,
            updateReportName,
            savedReports,

            // Refresh
            refresh,
            clearFinanceState,
            resetBalance,
            deleteDataByType
        }}>
            {children}
        </FinanceContext.Provider>
    );
};

export const useFinance = () => {
    const context = useContext(FinanceContext);
    if (!context) {
        throw new Error('useFinance must be used within a FinanceProvider');
    }
    return context;
};
