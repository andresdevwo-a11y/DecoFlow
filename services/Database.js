import * as SQLite from 'expo-sqlite';

let db = null;
let initError = null;

try {
    // Attempt to open the database synchronously.
    // Ensure we are using the correct API for the installed SDK version.
    db = SQLite.openDatabaseSync('decoflow.db');
} catch (error) {
    console.error("CRITICAL: Failed to open database synchronously:", error);
    initError = error;
    // We do NOT re-throw here so the app can start and display the error screen via DataContext.
}

// Helper to ensure DB is ready, or throw the specific init error
const getDb = () => {
    if (initError) {
        throw new Error(`Database failed to initialize: ${initError.message}`);
    }
    if (!db) {
        throw new Error("Database is not initialized");
    }
    return db;
};

// UUID generator for migration
export const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const initDatabase = async () => {
    try {
        const database = getDb();

        // --- Migrations for renaming Folders -> Sections ---
        // Check if 'folders' table exists and rename it to 'sections'
        try {
            const folderTableCheck = await database.getAllAsync("SELECT name FROM sqlite_master WHERE type='table' AND name='folders'");
            if (folderTableCheck.length > 0) {
                console.log("Migration: Renaming 'folders' table to 'sections'...");
                await database.execAsync("ALTER TABLE folders RENAME TO sections");
            }
        } catch (e) {
            console.warn("Migration: Error checking/renaming folders table:", e);
        }

        // Check if 'products' table has 'folderId' column and rename to 'sectionId'
        try {
            const productsInfo = await database.getAllAsync("PRAGMA table_info(products)");
            const hasFolderId = productsInfo.some(col => col.name === 'folderId');
            if (hasFolderId) {
                console.log("Migration: Renaming 'folderId' column in products/sections...");
                await database.execAsync("ALTER TABLE products RENAME COLUMN folderId TO sectionId");
            }
        } catch (e) {
            console.warn("Migration: Error renaming folderId column:", e);
        }

        await database.execAsync(`
            PRAGMA journal_mode = WAL;
            PRAGMA foreign_keys = ON;
            CREATE TABLE IF NOT EXISTS sections (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                color TEXT,
                icon TEXT,
                image TEXT,
                createdAt TEXT,
                updatedAt TEXT
            );
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY NOT NULL,
                sectionId TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                price REAL,
                rentPrice REAL,
                image TEXT,
                createdAt TEXT,
                updatedAt TEXT,
                FOREIGN KEY (sectionId) REFERENCES sections (id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY NOT NULL,
                value TEXT
            );
            CREATE TABLE IF NOT EXISTS canvases (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT,
                data TEXT,
                thumbnail TEXT,
                createdAt TEXT,
                updatedAt TEXT
            );
            CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY NOT NULL,
                type TEXT NOT NULL,
                productId TEXT,
                productName TEXT NOT NULL,
                quantity INTEGER DEFAULT 1,
                unitPrice REAL NOT NULL,
                discount REAL DEFAULT 0,
                totalAmount REAL NOT NULL,
                customerName TEXT,
                notes TEXT,
                date TEXT NOT NULL,
                items TEXT,
                clientData TEXT,
                createdAt TEXT,
                updatedAt TEXT
            );
            CREATE TABLE IF NOT EXISTS rentals (
                id TEXT PRIMARY KEY NOT NULL,
                transactionId TEXT UNIQUE NOT NULL,
                status TEXT DEFAULT 'active',
                startDate TEXT NOT NULL,
                endDate TEXT,
                deposit REAL DEFAULT 0,
                returnedAt TEXT,
                createdAt TEXT,
                updatedAt TEXT,
                FOREIGN KEY (transactionId) REFERENCES transactions (id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS expenses (
                id TEXT PRIMARY KEY NOT NULL,
                category TEXT NOT NULL,
                description TEXT NOT NULL,
                amount REAL NOT NULL,
                date TEXT NOT NULL,
                receiptImage TEXT,
                notes TEXT,
                createdAt TEXT,
                updatedAt TEXT
            );
            CREATE TABLE IF NOT EXISTS decorations (
                id TEXT PRIMARY KEY NOT NULL,
                transactionId TEXT UNIQUE NOT NULL,
                status TEXT DEFAULT 'active',
                startDate TEXT NOT NULL,
                endDate TEXT,
                deposit REAL DEFAULT 0,
                createdAt TEXT,
                updatedAt TEXT,
                FOREIGN KEY (transactionId) REFERENCES transactions (id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS saved_reports (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT,
                periodType TEXT,
                startDate TEXT NOT NULL,
                endDate TEXT NOT NULL,
                filters TEXT,
                summary TEXT NOT NULL,
                expensesByCategory TEXT,
                transactions TEXT,
                createdAt TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS clients (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                phone TEXT,
                documentId TEXT,
                email TEXT,
                address TEXT,
                createdAt TEXT,
                updatedAt TEXT
            );
            CREATE TABLE IF NOT EXISTS quotations (
                id TEXT PRIMARY KEY NOT NULL,
                quotationNumber TEXT,
                type TEXT NOT NULL,
                productId TEXT,
                productName TEXT NOT NULL,
                quantity INTEGER DEFAULT 1,
                unitPrice REAL NOT NULL,
                discount REAL DEFAULT 0,
                totalAmount REAL NOT NULL,
                customerName TEXT,
                clientData TEXT,
                clientId TEXT,
                notes TEXT,
                date TEXT NOT NULL,
                deliveryDate TEXT,
                startDate TEXT,
                endDate TEXT,
                deposit REAL DEFAULT 0,
                items TEXT,
                status TEXT DEFAULT 'pending',
                createdAt TEXT,
                updatedAt TEXT
            );
            CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY NOT NULL,
                title TEXT NOT NULL,
                content TEXT,
                date TEXT NOT NULL,
                createdAt TEXT,
                updatedAt TEXT
            );

        `);

        // Migration: Ensure 'clients' table has all columns (fix for existing table without new cols)
        try {
            const clientsInfo = await database.getAllAsync("PRAGMA table_info(clients)");

            const hasDocumentId = clientsInfo.some(col => col.name === 'documentId');
            if (!hasDocumentId) {
                console.log("Migration: Adding 'documentId' column to clients...");
                await database.execAsync("ALTER TABLE clients ADD COLUMN documentId TEXT");
            }

            const hasEmail = clientsInfo.some(col => col.name === 'email');
            if (!hasEmail) {
                await database.execAsync("ALTER TABLE clients ADD COLUMN email TEXT");
            }

            const hasAddress = clientsInfo.some(col => col.name === 'address');
            if (!hasAddress) {
                await database.execAsync("ALTER TABLE clients ADD COLUMN address TEXT");
            }

            const hasPhone = clientsInfo.some(col => col.name === 'phone');
            if (!hasPhone) {
                await database.execAsync("ALTER TABLE clients ADD COLUMN phone TEXT");
            }

        } catch (e) {
            console.warn("Migration: Error checking/migrating clients table columns:", e);
        }

        // Create indexes after ensuring columns exist
        await database.execAsync(`
            CREATE INDEX IF NOT EXISTS idx_clients_documentId ON clients(documentId);
            CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
        `);

        // Migration: Add isActive column to clients
        try {
            const clientsInfo = await database.getAllAsync("PRAGMA table_info(clients)");
            const hasIsActive = clientsInfo.some(col => col.name === 'isActive');
            if (!hasIsActive) {
                console.log("Migration: Adding 'isActive' column to clients...");
                await database.execAsync("ALTER TABLE clients ADD COLUMN isActive INTEGER DEFAULT 1");
            }
        } catch (e) {
            console.warn("Migration: Error adding isActive column to clients:", e);
        }

        // Run migrations
        await migrateClientsFromTransactions(database);

        // Migration: Add transactions column to saved_reports if it doesn't exist
        try {
            const savedReportsInfo = await database.getAllAsync("PRAGMA table_info(saved_reports)");
            const hasTransactions = savedReportsInfo.some(col => col.name === 'transactions');
            if (!hasTransactions) {
                console.log("Migration: Adding 'transactions' column to saved_reports...");
                await database.execAsync("ALTER TABLE saved_reports ADD COLUMN transactions TEXT");
            }
        } catch (e) {
            console.warn("Migration: Error checking/adding transactions column:", e);
        }

        // Migration: Add secondary image columns if they don't exist
        try {
            const productsInfo = await database.getAllAsync("PRAGMA table_info(products)");
            const hasSecondary1 = productsInfo.some(col => col.name === 'imageSecondary1');
            if (!hasSecondary1) {
                console.log("Migration: Adding 'imageSecondary1' column to products...");
                await database.execAsync("ALTER TABLE products ADD COLUMN imageSecondary1 TEXT");
            }
            const hasSecondary2 = productsInfo.some(col => col.name === 'imageSecondary2');
            if (!hasSecondary2) {
                console.log("Migration: Adding 'imageSecondary2' column to products...");
                await database.execAsync("ALTER TABLE products ADD COLUMN imageSecondary2 TEXT");
            }
        } catch (e) {
            console.warn("Migration: Error adding secondary image columns:", e);
        }

        // Migration: Add rentPrice column if it doesn't exist (for existing tables)
        try {
            await database.execAsync('ALTER TABLE products ADD COLUMN rentPrice REAL');
            console.log('Migration: Added rentPrice column to products table');
        } catch (e) {
            // fast-fail if column exists, which is expected for most runs
        }

        // Migration: Add kvs for Decoration items support
        try {
            await database.execAsync('ALTER TABLE decorations ADD COLUMN items TEXT');
        } catch (e) { }

        // Migration: Add clientId column to transactions if it doesn't exist
        try {
            const transactionsInfo = await database.getAllAsync("PRAGMA table_info(transactions)");
            const hasClientId = transactionsInfo.some(col => col.name === 'clientId');
            if (!hasClientId) {
                console.log("Migration: Adding 'clientId' column to transactions...");
                await database.execAsync("ALTER TABLE transactions ADD COLUMN clientId TEXT");
            }
        } catch (e) {
            console.warn("Migration: Error checking/adding clientId column:", e);
        }
        // Migration: Add items column to transactions (fix for broken try-catch)
        try {
            const transactionsInfo = await database.getAllAsync("PRAGMA table_info(transactions)");
            const hasItems = transactionsInfo.some(col => col.name === 'items');
            if (!hasItems) {
                console.log("Migration: Adding 'items' column to transactions table...");
                await database.execAsync("ALTER TABLE transactions ADD COLUMN items TEXT");
            }
        } catch (e) {
            console.warn("Migration: Error checking/adding items column:", e);
        }

        // Migration: Add clientData column
        try {
            const transactionsInfo = await database.getAllAsync("PRAGMA table_info(transactions)");
            const hasClientData = transactionsInfo.some(col => col.name === 'clientData');
            if (!hasClientData) {
                console.log("Migration: Adding 'clientData' column to transactions table...");
                await database.execAsync("ALTER TABLE transactions ADD COLUMN clientData TEXT");
            }
        } catch (e) {
            console.warn("Migration: Error checking/adding clientData column:", e);
        }

        // Migration: Add installment columns to transactions
        try {
            const transactionsInfo = await database.getAllAsync("PRAGMA table_info(transactions)");
            const hasIsInstallment = transactionsInfo.some(col => col.name === 'isInstallment');
            if (!hasIsInstallment) {
                console.log("Migration: Adding installment columns to transactions table...");
                await database.execAsync("ALTER TABLE transactions ADD COLUMN isInstallment INTEGER DEFAULT 0");
                await database.execAsync("ALTER TABLE transactions ADD COLUMN totalPrice REAL");
                await database.execAsync("ALTER TABLE transactions ADD COLUMN amountPaid REAL DEFAULT 0");
            }
        } catch (e) {
            console.warn("Migration: Error checking/adding installment columns:", e);
        }

        // Migration: Add deliveryDate column to transactions
        try {
            const transactionsInfo = await database.getAllAsync("PRAGMA table_info(transactions)");
            const hasDeliveryDate = transactionsInfo.some(col => col.name === 'deliveryDate');
            if (!hasDeliveryDate) {
                console.log("Migration: Adding 'deliveryDate' column to transactions table...");
                await database.execAsync("ALTER TABLE transactions ADD COLUMN deliveryDate TEXT");
            }
        } catch (e) {
            console.warn("Migration: Error checking/adding deliveryDate column:", e);
        }

        // --- Performance Optimizations: Indexes ---
        try {
            await database.execAsync(`
                CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
                CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
                CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
                CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
                CREATE INDEX IF NOT EXISTS idx_products_sectionId ON products(sectionId);
                CREATE INDEX IF NOT EXISTS idx_sections_createdAt ON sections(createdAt);
                CREATE INDEX IF NOT EXISTS idx_rentals_transactionId ON rentals(transactionId);
                CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
                CREATE INDEX IF NOT EXISTS idx_decorations_transactionId ON decorations(transactionId);
                CREATE INDEX IF NOT EXISTS idx_decorations_status ON decorations(status);
                CREATE INDEX IF NOT EXISTS idx_quotations_type ON quotations(type);
                CREATE INDEX IF NOT EXISTS idx_notes_date ON notes(date);
        `);
            console.log('Performance: Database indexes verified/created');
        } catch (e) {
            console.warn("Performance: Error creating indexes:", e);
        }

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database schema:', error);
        // If schema init fails, we should probably treat it as a critical init error too
        if (!initError) initError = error;
        throw error;
    }
};

// Sections
export const getSections = async () => {
    const database = getDb();
    const result = await database.getAllAsync(`
        SELECT s.*, COUNT(p.id) as productCount 
        FROM sections s 
        LEFT JOIN products p ON s.id = p.sectionId 
        GROUP BY s.id 
        ORDER BY s.createdAt DESC
    `);
    return result;
};

export const createSection = async (section) => {
    const database = getDb();
    const { id, name, color, icon, image, createdAt, updatedAt } = section;
    await database.runAsync(
        'INSERT INTO sections (id, name, color, icon, image, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, name, color || null, icon || null, image || null, createdAt, updatedAt]
    );
    return section;
};

export const updateSection = async (section) => {
    const database = getDb();
    const { name, color, icon, image, updatedAt, id } = section;
    await database.runAsync(
        'UPDATE sections SET name = ?, color = ?, icon = ?, image = ?, updatedAt = ? WHERE id = ?',
        [name, color || null, icon || null, image || null, updatedAt, id]
    );
    return section;
};

export const deleteSection = async (id) => {
    const database = getDb();
    await database.runAsync('DELETE FROM sections WHERE id = ?', [id]);
};

// Products
export const getProductsBySectionId = async (sectionId) => {
    const database = getDb();
    const result = await database.getAllAsync('SELECT * FROM products WHERE sectionId = ? ORDER BY createdAt DESC', [sectionId]);
    return result;
};

export const getAllProducts = async () => {
    const database = getDb();
    const result = await database.getAllAsync('SELECT * FROM products ORDER BY createdAt DESC');
    return result;
};

export const createProduct = async (product) => {
    const database = getDb();
    const { id, sectionId, name, description, price, rentPrice, image, imageSecondary1, imageSecondary2, createdAt, updatedAt } = product;
    await database.runAsync(
        'INSERT INTO products (id, sectionId, name, description, price, rentPrice, image, imageSecondary1, imageSecondary2, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, sectionId, name, description || null, (price !== undefined && price !== '') ? price : null, rentPrice || 0, image || null, imageSecondary1 || null, imageSecondary2 || null, createdAt, updatedAt]
    );
    return product;
};

export const updateProduct = async (product) => {
    const database = getDb();
    const { name, description, price, rentPrice, image, imageSecondary1, imageSecondary2, updatedAt, id } = product;
    await database.runAsync(
        'UPDATE products SET name = ?, description = ?, price = ?, rentPrice = ?, image = ?, imageSecondary1 = ?, imageSecondary2 = ?, updatedAt = ? WHERE id = ?',
        [name, description || null, (price !== undefined && price !== '') ? price : null, rentPrice || 0, image || null, imageSecondary1 || null, imageSecondary2 || null, updatedAt, id]
    );
    return product;
};

export const deleteProduct = async (id) => {
    const database = getDb();
    await database.runAsync('DELETE FROM products WHERE id = ?', [id]);
};

// Canvases
export const getCanvases = async () => {
    const database = getDb();
    const result = await database.getAllAsync('SELECT * FROM canvases ORDER BY updatedAt DESC');
    return result;
};

export const saveCanvas = async (canvas) => {
    const database = getDb();
    const { id, name, data, thumbnail, createdAt, updatedAt } = canvas;
    await database.runAsync(
        `INSERT OR REPLACE INTO canvases(id, name, data, thumbnail, createdAt, updatedAt)
        VALUES(?, ?, ?, ?, ?, ?)`,
        [id, name || 'Sin nombre', JSON.stringify(data), thumbnail || null, createdAt, updatedAt]
    );
    return canvas;
};

export const renameCanvas = async (id, newName) => {
    const database = getDb();
    await database.runAsync(
        'UPDATE canvases SET name = ?, updatedAt = ? WHERE id = ?',
        [newName, new Date().toISOString(), id]
    );
};

export const deleteCanvas = async (id) => {
    const database = getDb();
    await database.runAsync('DELETE FROM canvases WHERE id = ?', [id]);
};


// Settings
export const getSettings = async () => {
    const database = getDb();
    const result = await database.getAllAsync('SELECT * FROM settings');
    const settings = {};
    result.forEach(row => {
        settings[row.key] = row.value;
    });
    return settings;
};

export const saveSetting = async (key, value) => {
    const database = getDb();
    await database.runAsync(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
        [key, String(value), String(value)]
    );
};

export const deleteAllData = async () => {
    const database = getDb();
    try {
        console.log("Starting full data reset...");
        // Disable foreign keys to allow deleting in any order without constraint violations
        await database.execAsync('PRAGMA foreign_keys = OFF;');

        // Execute deletes sequentially to ensure thorough cleaning
        await database.runAsync('DELETE FROM quotations');
        await database.runAsync('DELETE FROM decorations');
        await database.runAsync('DELETE FROM rentals');
        await database.runAsync('DELETE FROM transactions');
        await database.runAsync('DELETE FROM products');
        await database.runAsync('DELETE FROM sections');
        await database.runAsync('DELETE FROM expenses');
        await database.runAsync('DELETE FROM saved_reports');
        await database.runAsync('DELETE FROM clients');
        await database.runAsync('DELETE FROM canvases');
        await database.runAsync('DELETE FROM notes');
        await database.runAsync('DELETE FROM settings');

        // Re-enable foreign keys
        await database.execAsync('PRAGMA foreign_keys = ON;');
        console.log("All data deleted successfully.");
    } catch (error) {
        console.error("Error deleting all data:", error);
        // Attempt to re-enable FKs in case of failure so the app doesn't remain in a weird state
        try { await database.execAsync('PRAGMA foreign_keys = ON;'); } catch (e) { /* ignore */ }
        throw error;
    }
};

// ==================== TRANSACTIONS ====================

export const createTransaction = async (transaction) => {
    const database = getDb();
    const {
        id, type, productId, productName, quantity, unitPrice, totalAmount,
        customerName, clientData, clientId, notes, date, deliveryDate, items, createdAt, updatedAt,
        isInstallment, totalPrice, amountPaid
    } = transaction;

    await database.runAsync(
        `INSERT INTO transactions(
            id, type, productId, productName, quantity, unitPrice, discount, totalAmount,
            customerName, clientData, clientId, notes, date, deliveryDate, items, createdAt, updatedAt,
            isInstallment, totalPrice, amountPaid
        ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            id, type, productId || null, productName, quantity || 1, unitPrice, 0, totalAmount,
            customerName || null, clientData ? JSON.stringify(clientData) : null, clientId || null,
            notes || null, date, deliveryDate || null, items ? JSON.stringify(items) : null, createdAt, updatedAt,
            isInstallment ? 1 : 0, totalPrice || null, amountPaid || 0
        ]
    );
    return transaction;
};

export const getTransactions = async (type = null) => {
    const database = getDb();
    let results;
    if (type) {
        results = await database.getAllAsync('SELECT * FROM transactions WHERE type = ? ORDER BY date DESC', [type]);
    } else {
        results = await database.getAllAsync('SELECT * FROM transactions ORDER BY date DESC');
    }
    return results.map(t => ({
        ...t,
        items: t.items ? JSON.parse(t.items) : [],
        clientData: t.clientData ? JSON.parse(t.clientData) : null
    }));
};

export const getTransactionsByDateRange = async (startDate, endDate, type = null) => {
    const database = getDb();
    if (type) {
        return await database.getAllAsync(
            'SELECT * FROM transactions WHERE date >= ? AND date <= ? AND type = ? ORDER BY date DESC',
            [startDate, endDate, type]
        );
    }
    return await database.getAllAsync(
        'SELECT * FROM transactions WHERE date >= ? AND date <= ? ORDER BY date DESC',
        [startDate, endDate]
    );
};

export const getTransactionsForReport = async (startDate, endDate) => {
    const database = getDb();
    const results = await database.getAllAsync(`
        SELECT t.*, r.startDate as rentalStartDate, r.endDate as rentalEndDate, r.status as rentalStatus
        FROM transactions t
        LEFT JOIN rentals r ON t.id = r.transactionId
        WHERE t.date >= ? AND t.date <= ?
            ORDER BY t.date DESC
                `, [startDate, endDate]);

    return results.map(t => ({
        ...t,
        items: t.items ? JSON.parse(t.items) : [],
        clientData: t.clientData ? JSON.parse(t.clientData) : null
    }));
};

export const updateTransaction = async (transaction) => {
    const database = getDb();
    const { id, productId, productName, quantity, unitPrice, totalAmount, customerName, clientData, notes, date, deliveryDate, items, updatedAt, isInstallment, totalPrice, amountPaid } = transaction;
    await database.runAsync(
        'UPDATE transactions SET productId = ?, productName = ?, quantity = ?, unitPrice = ?, discount = 0, totalAmount = ?, customerName = ?, clientData = ?, notes = ?, date = ?, deliveryDate = ?, items = ?, updatedAt = ?, isInstallment = ?, totalPrice = ?, amountPaid = ? WHERE id = ?',
        [productId || null, productName, quantity, unitPrice, totalAmount, customerName || null, clientData ? JSON.stringify(clientData) : null, notes || null, date, deliveryDate || null, items ? JSON.stringify(items) : null, updatedAt, isInstallment ? 1 : 0, totalPrice || null, amountPaid || 0, id]
    );
    return transaction;
};

// Update installment payment - adds a new payment to an existing installment transaction
export const updateInstallmentPayment = async (transactionId, newPaymentAmount) => {
    const database = getDb();
    const now = new Date().toISOString();

    // Get current transaction
    const results = await database.getAllAsync('SELECT * FROM transactions WHERE id = ?', [transactionId]);
    if (results.length === 0) {
        throw new Error('Transaction not found');
    }

    const transaction = results[0];
    const currentAmountPaid = transaction.amountPaid || 0;
    const newAmountPaid = currentAmountPaid + newPaymentAmount;
    const totalPrice = transaction.totalPrice || transaction.totalAmount;

    // Update the transaction with new payment
    await database.runAsync(
        'UPDATE transactions SET amountPaid = ?, totalAmount = ?, isInstallment = ?, updatedAt = ? WHERE id = ?',
        [
            newAmountPaid,
            newAmountPaid, // totalAmount reflects what has been paid for income calculations
            newAmountPaid >= totalPrice ? 0 : 1, // Mark as non-installment when fully paid
            now,
            transactionId
        ]
    );

    return {
        ...transaction,
        items: transaction.items ? JSON.parse(transaction.items) : [],
        clientData: transaction.clientData ? JSON.parse(transaction.clientData) : null,
        amountPaid: newAmountPaid,
        totalAmount: newAmountPaid,
        isInstallment: newAmountPaid >= totalPrice ? 0 : 1,
        updatedAt: now
    };
};

export const deleteTransaction = async (id) => {
    const database = getDb();
    await database.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
};

// ==================== RENTALS ====================

export const createRental = async (rental) => {
    const database = getDb();
    const { id, transactionId, status, startDate, endDate, createdAt, updatedAt } = rental;
    await database.runAsync(
        'INSERT INTO rentals (id, transactionId, status, startDate, endDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, transactionId, status || 'active', startDate, endDate || null, createdAt, updatedAt]
    );
    return rental;
};

export const getRentalByTransactionId = async (transactionId) => {
    const database = getDb();
    const result = await database.getAllAsync('SELECT * FROM rentals WHERE transactionId = ?', [transactionId]);
    return result.length > 0 ? result[0] : null;
};

export const getAllRentals = async () => {
    const database = getDb();
    return await database.getAllAsync('SELECT * FROM rentals');
};

export const getActiveRentals = async () => {
    const database = getDb();
    const results = await database.getAllAsync(`
        SELECT t.*, r.status, r.startDate, r.endDate, r.returnedAt
        FROM transactions t
        INNER JOIN rentals r ON t.id = r.transactionId
        WHERE r.status = 'active'
        ORDER BY r.startDate DESC
    `);

    return results.map(t => ({
        ...t,
        items: t.items ? JSON.parse(t.items) : [],
        clientData: t.clientData ? JSON.parse(t.clientData) : null
    }));
};

export const getAllRentalsWithDetails = async () => {
    const database = getDb();
    const results = await database.getAllAsync(`
        SELECT t.*, r.status, r.startDate, r.endDate, r.returnedAt, r.id as rentalId
        FROM transactions t
        INNER JOIN rentals r ON t.id = r.transactionId
        ORDER BY r.startDate DESC
    `);

    return results.map(t => ({
        ...t,
        items: t.items ? JSON.parse(t.items) : [],
        clientData: t.clientData ? JSON.parse(t.clientData) : null
    }));
};

export const updateRentalStatus = async (transactionId, status, returnedAt = null) => {
    const database = getDb();
    await database.runAsync(
        'UPDATE rentals SET status = ?, returnedAt = ?, updatedAt = ? WHERE transactionId = ?',
        [status, returnedAt, new Date().toISOString(), transactionId]
    );
};

export const updateRental = async (rental) => {
    const database = getDb();
    const { transactionId, startDate, endDate, updatedAt } = rental;
    await database.runAsync(
        'UPDATE rentals SET startDate = ?, endDate = ?, updatedAt = ? WHERE transactionId = ?',
        [startDate, endDate || null, updatedAt, transactionId]
    );
};

// ==================== EXPENSES ====================

export const createExpense = async (expense) => {
    const database = getDb();
    const { id, category, description, amount, date, receiptImage, notes, createdAt, updatedAt } = expense;
    await database.runAsync(
        'INSERT INTO expenses (id, category, description, amount, date, receiptImage, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, category, description, amount, date, receiptImage || null, notes || null, createdAt, updatedAt]
    );
    return expense;
};

export const getExpenses = async () => {
    const database = getDb();
    return await database.getAllAsync('SELECT * FROM expenses ORDER BY date DESC');
};

export const getExpensesByDateRange = async (startDate, endDate) => {
    const database = getDb();
    return await database.getAllAsync(
        'SELECT * FROM expenses WHERE date >= ? AND date <= ? ORDER BY date DESC',
        [startDate, endDate]
    );
};

export const getExpensesByCategory = async (category) => {
    const database = getDb();
    return await database.getAllAsync('SELECT * FROM expenses WHERE category = ? ORDER BY date DESC', [category]);
};

export const updateExpense = async (expense) => {
    const database = getDb();
    const { id, category, description, amount, date, receiptImage, notes, updatedAt } = expense;
    await database.runAsync(
        'UPDATE expenses SET category = ?, description = ?, amount = ?, date = ?, receiptImage = ?, notes = ?, updatedAt = ? WHERE id = ?',
        [category, description, amount, date, receiptImage || null, notes || null, updatedAt, id]
    );
    return expense;
};

export const deleteExpense = async (id) => {
    const database = getDb();
    await database.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
};

// ==================== DECORATIONS ====================

export const createDecoration = async (decoration) => {
    const database = getDb();
    const { id, transactionId, status, startDate, endDate, createdAt, updatedAt } = decoration;
    await database.runAsync(
        'INSERT INTO decorations (id, transactionId, status, startDate, endDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, transactionId, status || 'active', startDate, endDate || null, createdAt, updatedAt]
    );
    return decoration;
};

export const getDecorationByTransactionId = async (transactionId) => {
    const database = getDb();
    const decoration = await database.getFirstAsync(
        'SELECT * FROM decorations WHERE transactionId = ?',
        [transactionId]
    );

    if (!decoration) return null;

    // Obtener los items de la transacción asociada
    const transaction = await database.getFirstAsync(
        'SELECT items FROM transactions WHERE id = ?',
        [transactionId]
    );

    if (transaction && transaction.items) {
        // Parse items if they're stored as JSON string
        if (typeof transaction.items === 'string') {
            try {
                decoration.items = JSON.parse(transaction.items);
            } catch (e) {
                console.error("Error parsing decoration items:", e);
                decoration.items = [];
            }
        } else {
            decoration.items = transaction.items;
        }
    } else {
        decoration.items = [];
    }

    return decoration;
};

export const getAllDecorations = async () => {
    const database = getDb();
    return await database.getAllAsync('SELECT * FROM decorations');
};

export const updateDecoration = async (decoration) => {
    const database = getDb();
    const { transactionId, startDate, endDate, status, updatedAt } = decoration;
    await database.runAsync(
        'UPDATE decorations SET startDate = ?, endDate = ?, status = ?, updatedAt = ? WHERE transactionId = ?',
        [startDate, endDate || null, status || 'active', updatedAt, transactionId]
    );
};






// ==================== QUOTATIONS ====================

// Helper to generate a short unique quotation number
const generateQuotationNumber = async (database) => {
    // Get count of existing quotations to generate sequential ID logic
    const countResult = await database.getFirstAsync('SELECT COUNT(*) as count FROM quotations');
    const nextNum = countResult.count + 1;
    return `COT-${String(nextNum).padStart(4, '0')}`;
};

export const createQuotation = async (quotation) => {
    const database = getDb();

    // Generate quotation number if not provided
    let quotationNumber = quotation.quotationNumber;
    if (!quotationNumber) {
        quotationNumber = await generateQuotationNumber(database);
    }

    const {
        id, type, productId, productName, quantity, unitPrice, discount, totalAmount,
        customerName, clientData, clientId, notes, date, deliveryDate,
        startDate, endDate, deposit, items, status, createdAt, updatedAt
    } = quotation;

    await database.runAsync(
        `INSERT INTO quotations(
            id, quotationNumber, type, productId, productName, quantity, unitPrice, discount, totalAmount,
            customerName, clientData, clientId, notes, date, deliveryDate, 
            startDate, endDate, deposit, items, status, createdAt, updatedAt
        ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            id, quotationNumber, type, productId || null, productName, quantity || 1, unitPrice, discount || 0, totalAmount,
            customerName || null, clientData ? JSON.stringify(clientData) : null, clientId || null,
            notes || null, date, deliveryDate || null,
            startDate || null, endDate || null, deposit || 0,
            items ? JSON.stringify(items) : null, status || 'pending', createdAt, updatedAt
        ]
    );

    return { ...quotation, quotationNumber };
};

export const getQuotations = async (type = null, searchQuery = null) => {
    const database = getDb();
    let query = 'SELECT * FROM quotations';
    let params = [];
    let conditions = [];

    if (type) {
        conditions.push('type = ?');
        params.push(type);
    }

    if (searchQuery) {
        conditions.push('(productName LIKE ? OR customerName LIKE ? OR quotationNumber LIKE ?)');
        const search = `%${searchQuery}%`;
        params.push(search, search, search);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY date DESC, createdAt DESC';

    const results = await database.getAllAsync(query, params);

    return results.map(q => ({
        ...q,
        items: q.items ? JSON.parse(q.items) : [],
        clientData: q.clientData ? JSON.parse(q.clientData) : null
    }));
};

export const getQuotationById = async (id) => {
    const database = getDb();
    const result = await database.getFirstAsync('SELECT * FROM quotations WHERE id = ?', [id]);

    if (!result) return null;

    return {
        ...result,
        items: result.items ? JSON.parse(result.items) : [],
        clientData: result.clientData ? JSON.parse(result.clientData) : null
    };
};

export const updateQuotation = async (quotation) => {
    const database = getDb();
    const {
        id, type, productId, productName, quantity, unitPrice, discount, totalAmount,
        customerName, clientData, clientId, notes, date, deliveryDate,
        startDate, endDate, deposit, items, status, updatedAt
    } = quotation;

    await database.runAsync(
        `UPDATE quotations SET 
            type = ?, productId = ?, productName = ?, quantity = ?, unitPrice = ?, discount = ?, totalAmount = ?,
            customerName = ?, clientData = ?, clientId = ?, notes = ?, date = ?, deliveryDate = ?,
            startDate = ?, endDate = ?, deposit = ?, items = ?, status = ?, updatedAt = ?
        WHERE id = ?`,
        [
            type, productId || null, productName, quantity, unitPrice, discount || 0, totalAmount,
            customerName || null, clientData ? JSON.stringify(clientData) : null, clientId || null, notes || null, date, deliveryDate || null,
            startDate || null, endDate || null, deposit || 0, items ? JSON.stringify(items) : null, status || 'pending', updatedAt,
            id
        ]
    );
    return quotation;
};

export const deleteQuotation = async (id) => {
    const database = getDb();
    await database.runAsync('DELETE FROM quotations WHERE id = ?', [id]);
};

export const convertQuotationToTransaction = async (quotationId, options = {}) => {
    const database = getDb();
    const now = new Date().toISOString();
    const { isInstallment = false, amountPaid = null } = options;

    // 1. Get the quotation
    const quotation = await getQuotationById(quotationId);
    if (!quotation) throw new Error('Cotización no encontrada');

    // 2. Prepare Transaction Data
    const transactionId = generateUUID();
    const transaction = {
        id: transactionId,
        type: quotation.type,
        productId: quotation.productId,
        productName: quotation.productName,
        quantity: quotation.quantity,
        unitPrice: quotation.unitPrice,
        discount: quotation.discount,
        totalAmount: quotation.totalAmount,
        customerName: quotation.customerName,
        clientData: quotation.clientData,
        clientId: quotation.clientId,
        notes: `Convertido desde Cotización #${quotation.quotationNumber}. ${quotation.notes || ''}`,
        date: now.split('T')[0], // Use current date for conversion
        deliveryDate: quotation.deliveryDate,
        items: quotation.items,
        isInstallment: isInstallment,
        totalPrice: quotation.totalAmount, // Full price
        amountPaid: isInstallment ? (amountPaid ?? 0) : quotation.totalAmount, // If installment, use paid amount, else full amount
        createdAt: now,
        updatedAt: now
    };

    // 3. Create Transaction
    await createTransaction(transaction);

    // 4. Handle Type-Specific Logic (Rentals/Decorations)
    if (quotation.type === 'rental') {
        const rental = {
            id: generateUUID(),
            transactionId: transactionId,
            status: 'active',
            startDate: quotation.startDate || now.split('T')[0],
            endDate: quotation.endDate,
            deposit: quotation.deposit || 0,
            createdAt: now,
            updatedAt: now
        };
        await createRental(rental);
    } else if (quotation.type === 'decoration') {
        const decoration = {
            id: generateUUID(),
            transactionId: transactionId,
            status: 'active',
            startDate: quotation.startDate || now.split('T')[0],
            endDate: quotation.endDate,
            deposit: quotation.deposit || 0,
            createdAt: now,
            updatedAt: now
        };
        await createDecoration(decoration);
    }

    // 5. Update Quotation Status
    await database.runAsync(
        'UPDATE quotations SET status = ?, updatedAt = ? WHERE id = ?',
        ['converted', now, quotationId]
    );

    return transaction;
};

// ==================== FINANCE SUMMARY ====================

// Balance Offsets
export const resetFinanceCounters = async () => {
    const database = getDb();

    // 1. Calculate current raw totals
    const salesResult = await database.getAllAsync('SELECT COALESCE(SUM(totalAmount), 0) as total FROM transactions WHERE type = ?', ['sale']);
    const rentalsResult = await database.getAllAsync('SELECT COALESCE(SUM(totalAmount), 0) as total FROM transactions WHERE type = ?', ['rental']);
    const decorationsResult = await database.getAllAsync('SELECT COALESCE(SUM(totalAmount), 0) as total FROM transactions WHERE type = ?', ['decoration']);
    const expensesResult = await database.getAllAsync('SELECT COALESCE(SUM(amount), 0) as total FROM expenses');

    const totalIncome = salesResult[0].total + rentalsResult[0].total + decorationsResult[0].total;
    const totalExpenses = expensesResult[0].total;

    // 2. Save as offsets
    await saveSetting('incomeOffset', totalIncome.toString());
    await saveSetting('expenseOffset', totalExpenses.toString());
    await saveSetting('balanceOffset', '0'); // Reset legacy/derived offset
};

// Balance Offset Management
export const getBalanceOffset = async () => {
    const settings = await getSettings();
    return parseFloat(settings.balanceOffset) || 0;
};

export const setBalanceOffset = async (value) => {
    await saveSetting('balanceOffset', value.toString());
};

// Bulk Delete Operations
export const deleteAllTransactionsByType = async (type) => {
    const database = getDb();

    // 1. Get IDs to delete from child tables
    const result = await database.getAllAsync('SELECT id FROM transactions WHERE type = ?', [type]);
    const ids = result.map(r => r.id);

    if (ids.length === 0) return;

    // 2. Delete from child tables based on type
    if (type === 'rental') {
        const placeholders = ids.map(() => '?').join(',');
        await database.runAsync(`DELETE FROM rentals WHERE transactionId IN (${placeholders})`, ids);
    } else if (type === 'decoration') {
        const placeholders = ids.map(() => '?').join(',');
        await database.runAsync(`DELETE FROM decorations WHERE transactionId IN (${placeholders})`, ids);
    }

    // 3. Delete from transactions
    await database.runAsync('DELETE FROM transactions WHERE type = ?', [type]);
};

export const deleteAllExpenses = async () => {
    const database = getDb();
    await database.runAsync('DELETE FROM expenses');
};

export const deleteAllQuotations = async () => {
    const database = getDb();
    await database.runAsync('DELETE FROM quotations');
};

export const deleteAllFinanceData = async () => {
    const database = getDb();
    // Delete child tables first to avoid orphans just in case
    await database.runAsync('DELETE FROM rentals');
    await database.runAsync('DELETE FROM decorations');
    await database.runAsync('DELETE FROM transactions');
    await database.runAsync('DELETE FROM expenses');
    await database.runAsync('DELETE FROM quotations');
    // Align offsets to 0 since data is gone
    await saveSetting('incomeOffset', '0');
    await saveSetting('expenseOffset', '0');
    await saveSetting('balanceOffset', '0');
};

export const getFinanceSummary = async (startDate = null, endDate = null) => {
    const database = getDb();
    let incomeOffset = 0;
    let expenseOffset = 0;
    let balanceOffset = 0;

    // Only apply offset when viewing total summary (no dates)
    if (!startDate && !endDate) {
        const settings = await getSettings();
        incomeOffset = parseFloat(settings.incomeOffset) || 0;
        expenseOffset = parseFloat(settings.expenseOffset) || 0;
        balanceOffset = parseFloat(settings.balanceOffset) || 0;
    }

    if (startDate && endDate) {
        const salesQuery = 'SELECT COALESCE(SUM(totalAmount), 0) as total, COUNT(*) as count FROM transactions WHERE type = ? AND date >= ? AND date <= ?';
        const rentalsQuery = 'SELECT COALESCE(SUM(totalAmount), 0) as total, COUNT(*) as count FROM transactions WHERE type = ? AND date >= ? AND date <= ?';
        const decorationsQuery = 'SELECT COALESCE(SUM(totalAmount), 0) as total, COUNT(*) as count FROM transactions WHERE type = ? AND date >= ? AND date <= ?';
        const expensesQuery = 'SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM expenses WHERE date >= ? AND date <= ?';

        const salesResult = await database.getAllAsync(salesQuery, ['sale', startDate, endDate]);
        const rentalsResult = await database.getAllAsync(rentalsQuery, ['rental', startDate, endDate]);
        const decorationsResult = await database.getAllAsync(decorationsQuery, ['decoration', startDate, endDate]);
        const expensesResult = await database.getAllAsync(expensesQuery, [startDate, endDate]);

        const totalIncome = salesResult[0].total + rentalsResult[0].total + decorationsResult[0].total;

        return {
            sales: { total: salesResult[0].total, count: salesResult[0].count },
            rentals: { total: rentalsResult[0].total, count: rentalsResult[0].count },
            decorations: { total: decorationsResult[0].total, count: decorationsResult[0].count },
            expenses: { total: expensesResult[0].total, count: expensesResult[0].count },
            totalIncome: totalIncome,
            balance: totalIncome - expensesResult[0].total
        };
    } else {
        const salesResult = await database.getAllAsync('SELECT COALESCE(SUM(totalAmount), 0) as total, COUNT(*) as count FROM transactions WHERE type = ?', ['sale']);
        const rentalsResult = await database.getAllAsync('SELECT COALESCE(SUM(totalAmount), 0) as total, COUNT(*) as count FROM transactions WHERE type = ?', ['rental']);
        const decorationsResult = await database.getAllAsync('SELECT COALESCE(SUM(totalAmount), 0) as total, COUNT(*) as count FROM transactions WHERE type = ?', ['decoration']);
        const expensesResult = await database.getAllAsync('SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM expenses');

        const rawTotalIncome = salesResult[0].total + rentalsResult[0].total + decorationsResult[0].total;
        const rawTotalExpenses = expensesResult[0].total;

        // Apply offsets
        const displayedTotalIncome = Math.max(0, rawTotalIncome - incomeOffset);
        const displayedTotalExpenses = Math.max(0, rawTotalExpenses - expenseOffset);

        // displayedBalance = displayedIncome - displayedExpenses - balanceOffset (if any)
        const displayedBalance = displayedTotalIncome - displayedTotalExpenses - balanceOffset;

        return {
            sales: { total: salesResult[0].total, count: salesResult[0].count },
            rentals: { total: rentalsResult[0].total, count: rentalsResult[0].count },
            decorations: { total: decorationsResult[0].total, count: decorationsResult[0].count },
            expenses: { total: displayedTotalExpenses, count: expensesResult[0].count },
            totalIncome: displayedTotalIncome,
            balance: displayedBalance
        };
    }
};

export const getProductStats = async (productId, startDate = null, endDate = null) => {
    const database = getDb();

    let salesQuery = 'SELECT COALESCE(SUM(totalAmount), 0) as total, COUNT(*) as count FROM transactions WHERE type = ? AND productId = ?';
    let rentalsQuery = 'SELECT COALESCE(SUM(totalAmount), 0) as total, COUNT(*) as count FROM transactions WHERE type = ? AND productId = ?';
    let params = [productId];

    if (startDate && endDate) {
        const dateFilter = ' AND date >= ? AND date <= ?';
        salesQuery += dateFilter;
        rentalsQuery += dateFilter;
        params = [productId, startDate, endDate];
    } else {
        // Create params array for queries without date
        params = [productId];
    }

    // Get Sales Stats
    const salesResult = await database.getAllAsync(
        salesQuery,
        ['sale', ...params]
    );

    // Get Rental Stats
    const rentalsResult = await database.getAllAsync(
        rentalsQuery,
        ['rental', ...params]
    );

    const salesTotal = salesResult[0].total;
    const rentalsTotal = rentalsResult[0].total;
    const totalRevenue = salesTotal + rentalsTotal;

    return {
        sales: {
            count: salesResult[0].count,
            total: salesTotal
        },
        rentals: {
            count: rentalsResult[0].count,
            total: rentalsTotal
        },
        totalRevenue: totalRevenue
    };
};

export const getExpensesSummaryByCategory = async (startDate = null, endDate = null) => {
    const database = getDb();

    if (startDate && endDate) {
        return await database.getAllAsync(
            'SELECT category, COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM expenses WHERE date >= ? AND date <= ? GROUP BY category ORDER BY total DESC',
            [startDate, endDate]
        );
    }
    return await database.getAllAsync(
        'SELECT category, COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM expenses GROUP BY category ORDER BY total DESC'
    );
};

// ==================== SAVED REPORTS ====================

export const saveReport = async (report) => {
    const database = getDb();
    const { id, name, periodType, startDate, endDate, filters, summary, expensesByCategory, createdAt } = report;

    await database.runAsync(
        `INSERT INTO saved_reports(id, name, periodType, startDate, endDate, filters, summary, expensesByCategory, transactions, createdAt)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            id,
            name,
            periodType,
            startDate,
            endDate,
            JSON.stringify(filters),
            JSON.stringify(summary),
            JSON.stringify(expensesByCategory),
            JSON.stringify(report.transactions || []),
            createdAt
        ]
    );
    return report;
};

export const getSavedReports = async () => {
    const database = getDb();
    const results = await database.getAllAsync('SELECT * FROM saved_reports ORDER BY createdAt DESC');

    // Parse JSON fields
    return results.map(report => ({
        ...report,
        filters: report.filters ? JSON.parse(report.filters) : {},
        summary: report.summary ? JSON.parse(report.summary) : {},
        expensesByCategory: report.expensesByCategory ? JSON.parse(report.expensesByCategory) : [],
        transactions: report.transactions ? JSON.parse(report.transactions) : []
    }));
};

export const updateReportName = async (id, name) => {
    const database = getDb();
    await database.runAsync('UPDATE saved_reports SET name = ? WHERE id = ?', [name, id]);
};

export const deleteReport = async (id) => {
    const database = getDb();
    await database.runAsync('DELETE FROM saved_reports WHERE id = ?', [id]);
};

// ==================== CLIENTS ====================

// Migration helper
const migrateClientsFromTransactions = async (database) => {
    try {
        const clientCount = await database.getFirstAsync('SELECT count(*) as count FROM clients');
        if (clientCount.count > 0) return; // Already populated

        console.log("Migrating clients from transactions...");
        const transactions = await database.getAllAsync('SELECT clientData, createdAt FROM transactions WHERE clientData IS NOT NULL');

        const uniqueClients = new Map();

        transactions.forEach(t => {
            try {
                const data = JSON.parse(t.clientData);
                if (data.name) {
                    // Create a unique key based on documentId if available, otherwise name
                    // Normalize inputs slightly
                    const name = data.name.trim();
                    const documentId = data.documentId ? data.documentId.trim() : null;

                    const key = documentId || name;

                    if (!uniqueClients.has(key)) {
                        uniqueClients.set(key, {
                            ...data,
                            name: name,
                            documentId: documentId,
                            createdAt: t.createdAt // Use first seen date
                        });
                    }
                }
            } catch (e) {
                // Ignore parse errors
            }
        });

        const stmt = await database.prepareAsync(
            'INSERT INTO clients (id, name, phone, documentId, email, address, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );

        for (const client of uniqueClients.values()) {
            await stmt.executeAsync([
                generateUUID(),
                client.name,
                client.phone || null,
                client.documentId || null,
                client.email || null,
                client.address || null,
                client.createdAt || new Date().toISOString(),
                new Date().toISOString()
            ]);
        }
        await stmt.finalizeAsync();
        console.log(`Migrated ${uniqueClients.size} clients.`);

    } catch (error) {
        console.error("Error migrating clients:", error);
    }
};

export const createClient = async (client) => {
    const database = getDb();
    const { id, name, phone, documentId, email, address, isActive, createdAt, updatedAt } = client;
    await database.runAsync(
        'INSERT INTO clients (id, name, phone, documentId, email, address, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, name, phone || null, documentId || null, email || null, address || null, isActive !== undefined ? isActive : 1, createdAt, updatedAt]
    );
    return client;
};

export const updateClient = async (client) => {
    const database = getDb();
    const { id, name, phone, documentId, email, address, updatedAt } = client;
    await database.runAsync(
        'UPDATE clients SET name = ?, phone = ?, documentId = ?, email = ?, address = ?, updatedAt = ? WHERE id = ?',
        [name, phone || null, documentId || null, email || null, address || null, updatedAt, id]
    );
    return client;
};

export const deactivateClient = async (id) => {
    const database = getDb();
    const updatedAt = new Date().toISOString();
    await database.runAsync(
        'UPDATE clients SET isActive = 0, updatedAt = ? WHERE id = ?',
        [updatedAt, id]
    );
};

export const upsertClient = async (clientData) => {
    const database = getDb();
    // Try to find existing client by documentId (if present) or name
    let existing = null;

    if (clientData.documentId) {
        existing = await database.getFirstAsync('SELECT * FROM clients WHERE documentId = ?', [clientData.documentId]);
    }

    // If not found by ID, try strict name match if no ID provided or just as fallback? 
    // Usually name matches are risky, but for this app it might be expected.
    // Let's stick to documentId priority. If no documentId, we treat name as unique key for now or create new.
    // If user provided documentId but it wasn't found, we surely create/update that specific docId.

    if (!existing && !clientData.documentId && clientData.name) {
        existing = await database.getFirstAsync('SELECT * FROM clients WHERE name = ?', [clientData.name]);
    }

    const now = new Date().toISOString();

    if (existing) {
        // Update
        await database.runAsync(
            `UPDATE clients SET
        name = ?, phone = ?, email = ?, address = ?, updatedAt = ?
            WHERE id = ? `,
            [
                clientData.name,
                clientData.phone || existing.phone,
                clientData.email || existing.email,
                clientData.address || existing.address,
                now,
                existing.id
            ]
        );
        return { ...existing, ...clientData, updatedAt: now };
    } else {
        // Create
        const id = clientData.id || generateUUID(); // Use provided ID or gen new
        const newClient = {
            id,
            name: clientData.name,
            phone: clientData.phone,
            documentId: clientData.documentId,
            email: clientData.email,
            address: clientData.address,
            createdAt: now,
            updatedAt: now
        };
        await createClient(newClient);
        return newClient;
    }
};

export const getClients = async () => {
    const database = getDb();
    // Only return active clients
    return await database.getAllAsync('SELECT * FROM clients WHERE isActive = 1 ORDER BY name ASC');
};

export const getAllClients = async () => {
    const database = getDb();
    return await database.getAllAsync('SELECT * FROM clients ORDER BY name ASC');
};

export const searchClients = async (query) => {
    const database = getDb();
    const safeQuery = `%${query}%`;
    return await database.getAllAsync(
        'SELECT * FROM clients WHERE isActive = 1 AND (name LIKE ? OR documentId LIKE ? OR phone LIKE ?) ORDER BY name ASC',
        [safeQuery, safeQuery, safeQuery]
    );
};

// ==================== NOTES ====================

export const createNote = async (note) => {
    const database = getDb();
    const { id, title, content, date, createdAt, updatedAt } = note;
    await database.runAsync(
        'INSERT INTO notes (id, title, content, date, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
        [id, title, content || null, date, createdAt, updatedAt]
    );
    return note;
};

export const getNotes = async () => {
    const database = getDb();
    return await database.getAllAsync('SELECT * FROM notes ORDER BY date DESC');
};

export const updateNote = async (note) => {
    const database = getDb();
    const { id, title, content, date, updatedAt } = note;
    await database.runAsync(
        'UPDATE notes SET title = ?, content = ?, date = ?, updatedAt = ? WHERE id = ?',
        [title, content || null, date, updatedAt, id]
    );
    return note;
};

export const deleteNote = async (id) => {
    const database = getDb();
    await database.runAsync('DELETE FROM notes WHERE id = ?', [id]);
};

