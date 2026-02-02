import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';

const IMAGES_DIR = FileSystem.documentDirectory + 'images/';

// Ensure images directory exists
const ensureDirExists = async (dir) => {
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
};

export const checkImageExists = async (uri) => {
    try {
        const info = await FileSystem.getInfoAsync(uri);
        return info.exists;
    } catch (e) {
        return false;
    }
};

// Copy an image from a picker URI (cache) to the app's permanent storage
export const copyToInternal = async (uri) => {
    try {
        if (!uri) return null;

        // Check if already in internal storage to avoid duplication/deletion cycles
        if (uri.includes(IMAGES_DIR) || (IMAGES_DIR.startsWith('file://') && uri.startsWith(IMAGES_DIR))) {
            const info = await FileSystem.getInfoAsync(uri);
            if (info.exists) {
                return uri;
            }
            // If it points to internal but doesn't exist, we can't copy it anyway (source missing)
            // Proceeding leads to error, so catching it here is better?
            // But if we return strict URI, the caller might fail later. 
            // Let's let it try to copy to revive it? No, copy source must exist.
        }

        await ensureDirExists(IMAGES_DIR);
        const filename = Crypto.randomUUID() + '.jpg'; // Assume JPG for simplicity, or extract extension
        const destination = IMAGES_DIR + filename;
        await FileSystem.copyAsync({ from: uri, to: destination });
        return destination;
    } catch (error) {
        console.error('Error copying image to internal storage:', error);
        throw error;
    }
};

// Copy a stored image to a temporary folder for export
// Returns the relative path that will be used in the ZIP
export const prepareForExport = async (uri, tempFolder, subfolder = '') => {
    try {
        if (!uri) return null;

        // Handle if URI is already local or remote. 
        // For this app, we expect local file:// URIs in documentDirectory.

        const filename = uri.split('/').pop();
        const destFolder = tempFolder + 'images/' + subfolder;
        await ensureDirExists(destFolder);

        const destination = destFolder + filename;
        await FileSystem.copyAsync({ from: uri, to: destination });

        return `images/${subfolder}${filename}`;
    } catch (error) {
        console.warn(`Could not prepare image for export: ${uri}`, error);
        return null;
    }
};

// Copy an image from the import temp folder to internal storage
export const restoreFromImport = async (relativePath, tempFolder) => {
    try {
        // relativePath e.g. "images/products/abc.jpg"
        const source = tempFolder + relativePath;
        const filename = relativePath.split('/').pop();

        await ensureDirExists(IMAGES_DIR);
        const destination = IMAGES_DIR + filename;

        // Check if source exists
        const info = await FileSystem.getInfoAsync(source);
        if (info.exists) {
            await FileSystem.copyAsync({ from: source, to: destination });
            return destination;
        }
        return null;
    } catch (error) {
        console.warn(`Could not restore image: ${relativePath}`, error);
        return null;
    }
};

export const deleteAllImages = async () => {
    try {
        const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
        if (dirInfo.exists) {
            await FileSystem.deleteAsync(IMAGES_DIR);
            await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
        }
    } catch (error) {
        console.error("Error deleting all images:", error);
        throw error;
    }
};

export const clearCache = async () => {
    try {
        const cacheDir = FileSystem.cacheDirectory;
        const files = await FileSystem.readDirectoryAsync(cacheDir);

        for (const file of files) {
            try {
                await FileSystem.deleteAsync(cacheDir + file);
            } catch (e) {
                console.warn(`Failed to delete cache file ${file}:`, e);
            }
        }
    } catch (error) {
        console.warn("Error clearing cache:", error);
    }
};


export const getImagesDir = () => IMAGES_DIR;

// Delete a specific image file from internal storage
export const deleteImage = async (uri) => {
    try {
        if (!uri) return;

        // Ensure we are deleting from our internal directory
        if (uri.startsWith(IMAGES_DIR) || uri.includes('file://' + IMAGES_DIR)) {
            const fileInfo = await FileSystem.getInfoAsync(uri);
            if (fileInfo.exists) {
                await FileSystem.deleteAsync(uri);
                console.log(`[ImageService] Deleted image: ${uri}`);
            } else {
                console.log(`[ImageService] Image not found (already deleted?): ${uri}`);
            }
        } else {
            console.log(`[ImageService] Skipped deletion (external/invalid uri): ${uri}`);
        }
    } catch (error) {
        console.warn(`Error deleting image ${uri}:`, error);
        // We don't throw here to prevent blocking main flow, just log it.
    }
};

// Garbage Collector: Delete files in IMAGES_DIR that are not in the usedUris list
export const cleanOrphanedImages = async (usedUris) => {
    try {
        await ensureDirExists(IMAGES_DIR);

        // Normalize used URIs to ensure consistency (handle file:// prefix)
        // We really just need the filename usually, but let's compare full paths if possible
        // or just filenames. Since usedUris come from DB, they are likely full paths.

        const usedFilenames = new Set();
        usedUris.forEach(uri => {
            if (typeof uri === 'string' && uri.includes('images/')) {
                const parts = uri.split('/');
                const filename = parts[parts.length - 1];
                if (filename) usedFilenames.add(filename);
            }
        });

        const files = await FileSystem.readDirectoryAsync(IMAGES_DIR);

        let deletedCount = 0;
        for (const file of files) {
            if (!usedFilenames.has(file)) {
                try {
                    await FileSystem.deleteAsync(IMAGES_DIR + file);
                    deletedCount++;
                } catch (e) {
                    console.warn(`Failed to delete orphaned file ${file}:`, e);
                }
            }
        }

        if (deletedCount > 0) {
            console.log(`Garbage Collector: Removed ${deletedCount} orphaned images.`);
        }
    } catch (error) {
        console.error("Error in garbage collection:", error);
    }
};

