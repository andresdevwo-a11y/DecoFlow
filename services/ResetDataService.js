import * as Database from './Database';
import * as ImageService from './ImageService';

export const performReset = async () => {
    try {
        // 1. Delete DB Data
        await Database.deleteAllData();

        // 2. Delete Local Images
        await ImageService.deleteAllImages();

        // 3. Clear Cache
        await ImageService.clearCache();

        return true;
    } catch (error) {
        console.error("Reset failed:", error);
        throw error;
    }
};
