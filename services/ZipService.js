import JSZip from 'jszip';
import * as FileSystem from 'expo-file-system/legacy';

// recursively add files to zip
const addFolderToZip = async (zip, folderPath, rootPath) => {
    const contents = await FileSystem.readDirectoryAsync(folderPath);

    for (const item of contents) {
        const itemPath = folderPath + (folderPath.endsWith('/') ? '' : '/') + item;
        const info = await FileSystem.getInfoAsync(itemPath);

        // Calculate relative path for ZIP structure
        // rootPath: .../temp/
        // itemPath: .../temp/images/file.jpg
        // relative: images/file.jpg
        const relativePath = itemPath.replace(rootPath, '');

        if (info.isDirectory) {
            // JSZip creates folders implicitly when adding files, but we can verify
            // We just recurse
            await addFolderToZip(zip, itemPath, rootPath);
        } else {
            // Read file as base64
            const content = await FileSystem.readAsStringAsync(itemPath, { encoding: FileSystem.EncodingType.Base64 });
            zip.file(relativePath, content, { base64: true });
        }
    }
};

export const createZip = async (sourceDir, destPath) => {
    const zip = new JSZip();

    // Ensure sourceDir ends with /
    const root = sourceDir.endsWith('/') ? sourceDir : sourceDir + '/';

    await addFolderToZip(zip, root, root);

    const content = await zip.generateAsync({ type: 'base64' });
    await FileSystem.writeAsStringAsync(destPath, content, { encoding: FileSystem.EncodingType.Base64 });
    return destPath;
};

export const unzip = async (zipFilePath, targetDir) => {
    try {
        // Read zip file
        const fileContent = await FileSystem.readAsStringAsync(zipFilePath, { encoding: FileSystem.EncodingType.Base64 });
        const zip = await JSZip.loadAsync(fileContent, { base64: true });

        // Ensure target dir
        if (!(await FileSystem.getInfoAsync(targetDir)).exists) {
            await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
        }

        const keys = Object.keys(zip.files);
        for (const filename of keys) {
            const file = zip.files[filename];
            if (file.dir) {
                await FileSystem.makeDirectoryAsync(targetDir + filename, { intermediates: true });
            } else {
                const content = await file.async('base64');
                const destPath = targetDir + filename;

                // Ensure parent directory exists (just in case)
                const parentDir = destPath.substring(0, destPath.lastIndexOf('/'));
                if (!(await FileSystem.getInfoAsync(parentDir)).exists) {
                    await FileSystem.makeDirectoryAsync(parentDir, { intermediates: true });
                }

                await FileSystem.writeAsStringAsync(destPath, content, { encoding: FileSystem.EncodingType.Base64 });
            }
        }
        return true;
    } catch (error) {
        console.error("Unzip error:", error);
        throw error;
    }
};
