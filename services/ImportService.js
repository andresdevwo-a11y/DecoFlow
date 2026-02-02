import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Database from './Database';
import * as ImageService from './ImageService';
import * as ZipService from './ZipService';
import * as SQLite from 'expo-sqlite';

const IMPORT_TEMP_DIR = FileSystem.cacheDirectory + 'import_temp/';

export const importData = async () => {
    try {
        // 1. Pick File
        const result = await DocumentPicker.getDocumentAsync({
            type: '*/*', // Allow all files to ensure visibility in all apps (WhatsApp, etc)
            copyToCacheDirectory: true
        });

        if (result.canceled) return false;

        const zipUri = result.assets[0].uri;

        // 2. Clean/Create temp directory
        const dirInfo = await FileSystem.getInfoAsync(IMPORT_TEMP_DIR);
        if (dirInfo.exists) {
            await FileSystem.deleteAsync(IMPORT_TEMP_DIR);
        }
        await FileSystem.makeDirectoryAsync(IMPORT_TEMP_DIR, { intermediates: true });

        // 3. Unzip
        await ZipService.unzip(zipUri, IMPORT_TEMP_DIR);

        // 4. Validate Meta
        const metaFile = IMPORT_TEMP_DIR + 'meta.json';
        const metaInfo = await FileSystem.getInfoAsync(metaFile);
        if (!metaInfo.exists) {
            throw new Error("Invalid backup file: meta.json missing");
        }
        // Could parse and check version here

        // 5. Read Data
        let sectionsJson = null;
        const sectionsFile = IMPORT_TEMP_DIR + 'data/sections.json';
        const foldersFile = IMPORT_TEMP_DIR + 'data/folders.json';

        if ((await FileSystem.getInfoAsync(sectionsFile)).exists) {
            sectionsJson = await FileSystem.readAsStringAsync(sectionsFile);
        } else if ((await FileSystem.getInfoAsync(foldersFile)).exists) {
            // Backward compatibility
            sectionsJson = await FileSystem.readAsStringAsync(foldersFile);
        } else {
            // Just assume empty if neither exist
            sectionsJson = "[]";
        }

        const productsJson = await FileSystem.readAsStringAsync(IMPORT_TEMP_DIR + 'data/products.json');

        // Financials
        let transactionsJson = "[]";
        let rentalsJson = "[]";
        let expensesJson = "[]";
        let decorationsJson = "[]";
        let savedReportsJson = "[]";

        if ((await FileSystem.getInfoAsync(IMPORT_TEMP_DIR + 'data/transactions.json')).exists) {
            transactionsJson = await FileSystem.readAsStringAsync(IMPORT_TEMP_DIR + 'data/transactions.json');
        }
        if ((await FileSystem.getInfoAsync(IMPORT_TEMP_DIR + 'data/rentals.json')).exists) {
            rentalsJson = await FileSystem.readAsStringAsync(IMPORT_TEMP_DIR + 'data/rentals.json');
        }
        if ((await FileSystem.getInfoAsync(IMPORT_TEMP_DIR + 'data/expenses.json')).exists) {
            expensesJson = await FileSystem.readAsStringAsync(IMPORT_TEMP_DIR + 'data/expenses.json');
        }
        if ((await FileSystem.getInfoAsync(IMPORT_TEMP_DIR + 'data/decorations.json')).exists) {
            decorationsJson = await FileSystem.readAsStringAsync(IMPORT_TEMP_DIR + 'data/decorations.json');
        }
        if ((await FileSystem.getInfoAsync(IMPORT_TEMP_DIR + 'data/saved_reports.json')).exists) {
            savedReportsJson = await FileSystem.readAsStringAsync(IMPORT_TEMP_DIR + 'data/saved_reports.json');
        }

        let clientsJson = "[]";
        if ((await FileSystem.getInfoAsync(IMPORT_TEMP_DIR + 'data/clients.json')).exists) {
            clientsJson = await FileSystem.readAsStringAsync(IMPORT_TEMP_DIR + 'data/clients.json');
        }

        const settingsJson = await FileSystem.readAsStringAsync(IMPORT_TEMP_DIR + 'settings.json');

        let canvasesJson = "[]";
        if ((await FileSystem.getInfoAsync(IMPORT_TEMP_DIR + 'data/canvases.json')).exists) {
            canvasesJson = await FileSystem.readAsStringAsync(IMPORT_TEMP_DIR + 'data/canvases.json');
        }

        const sections = JSON.parse(sectionsJson);
        const products = JSON.parse(productsJson);
        const canvases = JSON.parse(canvasesJson);
        const transactions = JSON.parse(transactionsJson);
        const rentals = JSON.parse(rentalsJson);
        const expenses = JSON.parse(expensesJson);
        const decorations = JSON.parse(decorationsJson);
        const savedReports = JSON.parse(savedReportsJson);
        const settings = JSON.parse(settingsJson);
        const clients = JSON.parse(clientsJson);

        let quotationsJson = "[]";
        if ((await FileSystem.getInfoAsync(IMPORT_TEMP_DIR + 'data/quotations.json')).exists) {
            quotationsJson = await FileSystem.readAsStringAsync(IMPORT_TEMP_DIR + 'data/quotations.json');
        }

        let notesJson = "[]";
        if ((await FileSystem.getInfoAsync(IMPORT_TEMP_DIR + 'data/notes.json')).exists) {
            notesJson = await FileSystem.readAsStringAsync(IMPORT_TEMP_DIR + 'data/notes.json');
        }

        const quotations = JSON.parse(quotationsJson);
        const notes = JSON.parse(notesJson);

        // 6. Restore Images & Wipe DB & Insert

        // Wipe Database content
        await Database.deleteAllData();

        // Clear internal images to ensure clean state
        await ImageService.deleteAllImages();

        // Insert Settings
        for (const key in settings) {
            await Database.saveSetting(key, settings[key]);
        }

        // Insert Sections (and restore images)
        for (const section of sections) {
            if (section.image && !section.image.startsWith('http')) {
                // It's a relative path in the zip
                // Could be 'images/sections/...' or legacy 'images/folders/...'
                const newPath = await ImageService.restoreFromImport(section.image, IMPORT_TEMP_DIR);
                section.image = newPath;
            }
            // Remove 'productCount' if it exists in JSON, as it's computed
            const { productCount, ...cleanSection } = section;
            await Database.createSection(cleanSection);
        }

        // Insert Products (and restore images)
        for (const product of products) {
            // Imagen principal
            if (product.image && !product.image.startsWith('http')) {
                const newPath = await ImageService.restoreFromImport(product.image, IMPORT_TEMP_DIR);
                product.image = newPath;
            }
            // Imagen secundaria 1
            if (product.imageSecondary1 && !product.imageSecondary1.startsWith('http')) {
                const newPath = await ImageService.restoreFromImport(product.imageSecondary1, IMPORT_TEMP_DIR);
                product.imageSecondary1 = newPath;
            }
            // Imagen secundaria 2
            if (product.imageSecondary2 && !product.imageSecondary2.startsWith('http')) {
                const newPath = await ImageService.restoreFromImport(product.imageSecondary2, IMPORT_TEMP_DIR);
                product.imageSecondary2 = newPath;
            }
            // Ensure product uses 'sectionId' if coming from legacy backup
            if (product.folderId && !product.sectionId) {
                product.sectionId = product.folderId;
                delete product.folderId;
            }
            await Database.createProduct(product);
        }

        // Insert Canvases (and restore thumbnails & internal images)
        if (canvases && Array.isArray(canvases)) {
            for (const canvas of canvases) {
                // 1. Restore Thumbnail
                if (canvas.thumbnail && !canvas.thumbnail.startsWith('http')) {
                    const newPath = await ImageService.restoreFromImport(canvas.thumbnail, IMPORT_TEMP_DIR);
                    canvas.thumbnail = newPath;
                }

                // 2. Restore Internal Images
                let canvasDataObj = null;
                if (canvas.data) {
                    try {
                        canvasDataObj = typeof canvas.data === 'string' ? JSON.parse(canvas.data) : canvas.data;

                        if (canvasDataObj && Array.isArray(canvasDataObj.images)) {
                            const processedImages = [];
                            for (const img of canvasDataObj.images) {
                                const newImg = { ...img };
                                if (newImg.source && newImg.source.uri) {
                                    if (!newImg.source.uri.startsWith('file://') && !newImg.source.uri.startsWith('http') && !newImg.source.uri.startsWith('data:')) {
                                        const newPath = await ImageService.restoreFromImport(newImg.source.uri, IMPORT_TEMP_DIR);
                                        if (newPath) {
                                            newImg.source = { ...newImg.source, uri: newPath };
                                        }
                                    }
                                }
                                processedImages.push(newImg);
                            }
                            canvasDataObj.images = processedImages;
                        }
                    } catch (e) {
                        console.warn(`Failed to process internal images for canvas ${canvas.id} import:`, e);
                    }
                }

                const finalCanvas = {
                    ...canvas,
                    data: canvasDataObj || {}
                };

                await Database.saveCanvas(finalCanvas);
            }
        }

        // Insert Financial Data
        for (const t of transactions) {
            // Check if 'items' needs parsing if it was stored as string but Database.createTransaction expects object?
            // createTransaction expects 'items' to be an object (array) if it's passed, or it stringifies it.
            // But from DB, it comes as string. JSON.stringify(string) = escaped string.
            // We should parse it if it is a string before passing to createTransaction because createTransaction will stringify it again.
            // ACTUALLY: getTransactions parses it: items: t.items ? JSON.parse(t.items) : []
            // So 'transactions' array here has items as Array.
            // createTransaction takes object and stringifies it. So we are good.
            await Database.createTransaction(t);
        }

        for (const r of rentals) {
            await Database.createRental(r);
        }

        for (const d of decorations) {
            await Database.createDecoration(d);
        }

        for (const e of expenses) {
            if (e.receiptImage && !e.receiptImage.startsWith('http')) {
                const newPath = await ImageService.restoreFromImport(e.receiptImage, IMPORT_TEMP_DIR);
                e.receiptImage = newPath;
            }
            await Database.createExpense(e);
        }

        for (const sr of savedReports) {
            // saveReport expects objects for filters, etc, but also checks internal logic?
            // Database.saveReport takes object and stringifies filters, summary, etc.
            // Database.getSavedReports parses them.
            // So 'sr' comes with parsed objects. saveReport will stringify them. Perfect.
            await Database.saveReport(sr);
        }

        for (const client of clients) {
            // Create client handles ID insertion if it's passed in the object? 
            // Currently createClient inserts a new entry.
            // We need to make sure we use the ID from the backup if possible to maintain relationships.
            // Let's check Database.createClient.
            // It takes { id, name, ... }.
            // So simply passing the client object from backup (which has id) should work fine.
            await Database.createClient(client);
        }

        // Insert Quotations
        for (const q of quotations) {
            await Database.createQuotation(q);
        }

        // Insert Notes
        for (const n of notes) {
            await Database.createNote(n);
        }

        return true;
    } catch (error) {
        console.error("Import failed:", error);
        throw error;
    }
};
