import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Database from './Database';
import * as ImageService from './ImageService';
import * as ZipService from './ZipService';
import { getLocalDateString } from '../utils/dateHelpers';

const EXPORT_TEMP_DIR = FileSystem.cacheDirectory + 'export_temp/';

export const exportData = async () => {
    try {
        // 1. Clean/Create temp directory
        const dirInfo = await FileSystem.getInfoAsync(EXPORT_TEMP_DIR);
        if (dirInfo.exists) {
            await FileSystem.deleteAsync(EXPORT_TEMP_DIR);
        }
        await FileSystem.makeDirectoryAsync(EXPORT_TEMP_DIR, { intermediates: true });
        await FileSystem.makeDirectoryAsync(EXPORT_TEMP_DIR + 'data/', { intermediates: true });
        await FileSystem.makeDirectoryAsync(EXPORT_TEMP_DIR + 'images/', { intermediates: true });
        await FileSystem.makeDirectoryAsync(EXPORT_TEMP_DIR + 'images/sections/', { intermediates: true }); // Renamed folders -> sections
        await FileSystem.makeDirectoryAsync(EXPORT_TEMP_DIR + 'images/products/', { intermediates: true });
        await FileSystem.makeDirectoryAsync(EXPORT_TEMP_DIR + 'images/canvases/', { intermediates: true });
        await FileSystem.makeDirectoryAsync(EXPORT_TEMP_DIR + 'images/canvases_content/', { intermediates: true });
        await FileSystem.makeDirectoryAsync(EXPORT_TEMP_DIR + 'images/expenses/', { intermediates: true });

        // 2. Fetch Data
        const sections = await Database.getSections(); // Includes productCount, need to clean? Ideally yes but JSON ignores extra
        const settings = await Database.getSettings();

        // We need all products
        const allProducts = await Database.getAllProducts();

        // We need all canvases
        const canvases = await Database.getCanvases();

        // 4. Financial Data
        const transactions = await Database.getTransactions();
        const rentals = await Database.getAllRentals();
        const expenses = await Database.getExpenses();
        const decorations = await Database.getAllDecorations();
        const savedReports = await Database.getSavedReports();
        const clients = await Database.getAllClients();
        const quotations = await Database.getQuotations();
        const notes = await Database.getNotes();

        // 3. Process Images & Prepare JSONs

        // 3. Process Images & Prepare JSONs (Sequential to avoid race conditions/memory issues)

        // Sections
        const processedSections = [];
        for (const section of sections) {
            const s = { ...section };
            if (s.image) {
                // Store images in 'images/sections/'
                const relativePath = await ImageService.prepareForExport(s.image, EXPORT_TEMP_DIR, 'sections/');
                if (relativePath) {
                    s.image = relativePath;
                } else {
                    s.image = null;
                }
            }
            processedSections.push(s);
        }

        // Products
        const processedProducts = [];
        for (const product of allProducts) {
            const p = { ...product };
            // Imagen principal
            if (p.image) {
                const relativePath = await ImageService.prepareForExport(p.image, EXPORT_TEMP_DIR, 'products/');
                if (relativePath) {
                    p.image = relativePath;
                } else {
                    p.image = null;
                }
            }
            // Imagen secundaria 1
            if (p.imageSecondary1) {
                const relativePath = await ImageService.prepareForExport(p.imageSecondary1, EXPORT_TEMP_DIR, 'products/');
                if (relativePath) {
                    p.imageSecondary1 = relativePath;
                } else {
                    p.imageSecondary1 = null;
                }
            }
            // Imagen secundaria 2
            if (p.imageSecondary2) {
                const relativePath = await ImageService.prepareForExport(p.imageSecondary2, EXPORT_TEMP_DIR, 'products/');
                if (relativePath) {
                    p.imageSecondary2 = relativePath;
                } else {
                    p.imageSecondary2 = null;
                }
            }
            processedProducts.push(p);
        }

        // Canvases
        const processedCanvases = [];
        for (const canvas of canvases) {
            const c = { ...canvas };

            // 1. Process Thumbnail
            if (c.thumbnail) {
                const relativePath = await ImageService.prepareForExport(c.thumbnail, EXPORT_TEMP_DIR, 'canvases/');
                if (relativePath) {
                    c.thumbnail = relativePath;
                } else {
                    c.thumbnail = null;
                }
            }

            // 2. Process Internal Images (inside c.data JSON)
            if (c.data) {
                try {
                    const canvasData = JSON.parse(c.data);
                    if (canvasData && Array.isArray(canvasData.images)) {
                        const processedImages = [];
                        for (const img of canvasData.images) {
                            const newImg = { ...img };
                            if (newImg.source && newImg.source.uri) {
                                // Check if it's a local file
                                if (!newImg.source.uri.startsWith('http') && !newImg.source.uri.startsWith('data:')) {
                                    const relativePath = await ImageService.prepareForExport(newImg.source.uri, EXPORT_TEMP_DIR, 'canvases_content/');
                                    if (relativePath) {
                                        newImg.source = { ...newImg.source, uri: relativePath };
                                    }
                                }
                            }
                            processedImages.push(newImg);
                        }
                        canvasData.images = processedImages;
                        c.data = JSON.stringify(canvasData);
                    }
                } catch (e) {
                    console.warn(`Failed to process canvas data images for canvas ${c.id}:`, e);
                }
            }
            processedCanvases.push(c);
        }

        // Expenses (Images)
        const processedExpenses = [];
        for (const expense of expenses) {
            const e = { ...expense };
            if (e.receiptImage) {
                const relativePath = await ImageService.prepareForExport(e.receiptImage, EXPORT_TEMP_DIR, 'expenses/');
                if (relativePath) {
                    e.receiptImage = relativePath;
                } else {
                    e.receiptImage = null;
                }
            }
            processedExpenses.push(e);
        }

        // 4. Write JSON files
        // Write 'sections.json' instead of 'folders.json'
        await FileSystem.writeAsStringAsync(EXPORT_TEMP_DIR + 'data/sections.json', JSON.stringify(processedSections));
        await FileSystem.writeAsStringAsync(EXPORT_TEMP_DIR + 'data/products.json', JSON.stringify(processedProducts));
        await FileSystem.writeAsStringAsync(EXPORT_TEMP_DIR + 'data/canvases.json', JSON.stringify(processedCanvases));
        await FileSystem.writeAsStringAsync(EXPORT_TEMP_DIR + 'settings.json', JSON.stringify(settings));

        // Financials
        await FileSystem.writeAsStringAsync(EXPORT_TEMP_DIR + 'data/transactions.json', JSON.stringify(transactions));
        await FileSystem.writeAsStringAsync(EXPORT_TEMP_DIR + 'data/rentals.json', JSON.stringify(rentals));
        await FileSystem.writeAsStringAsync(EXPORT_TEMP_DIR + 'data/expenses.json', JSON.stringify(processedExpenses));
        await FileSystem.writeAsStringAsync(EXPORT_TEMP_DIR + 'data/decorations.json', JSON.stringify(decorations));
        await FileSystem.writeAsStringAsync(EXPORT_TEMP_DIR + 'data/saved_reports.json', JSON.stringify(savedReports));
        await FileSystem.writeAsStringAsync(EXPORT_TEMP_DIR + 'data/clients.json', JSON.stringify(clients));
        await FileSystem.writeAsStringAsync(EXPORT_TEMP_DIR + 'data/quotations.json', JSON.stringify(quotations));
        await FileSystem.writeAsStringAsync(EXPORT_TEMP_DIR + 'data/notes.json', JSON.stringify(notes));

        // Meta
        const meta = {
            appName: 'Woodland',
            version: require('../constants/Config').APP_VERSION, // Should match app version
            exportDate: new Date().toISOString(),
            counts: {
                sections: sections.length,
                products: allProducts.length,
                canvases: canvases.length,
                transactions: transactions.length,
                rentals: rentals.length,
                expenses: expenses.length,
                decorations: decorations.length,
                savedReports: savedReports.length,
                clients: clients.length,
                quotations: quotations.length,
                notes: notes.length
            }
        };
        await FileSystem.writeAsStringAsync(EXPORT_TEMP_DIR + 'meta.json', JSON.stringify(meta));

        // 5. Zip
        const dateStr = getLocalDateString();
        const zipFileName = `woodland_backup_${dateStr}.zip`;
        const zipFilePath = FileSystem.cacheDirectory + zipFileName;

        await ZipService.createZip(EXPORT_TEMP_DIR, zipFilePath);

        // 6. Share
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(zipFilePath);
        } else {
            alert("Sharing is not available on this device");
        }

        // Cleanup temp (optional immediately, or rely on OS cache clearing)
        // await FileSystem.deleteAsync(EXPORT_TEMP_DIR);

        return true;

    } catch (error) {
        console.error("Export failed:", error);
        throw error;
    }
};
