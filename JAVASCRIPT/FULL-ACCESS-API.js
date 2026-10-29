/* ========== FULL STORAGE & TERMUX ACCESS APIS ========== */

/**
 * Storage Access API
 * Access files from anywhere in device storage
 */
const StorageAPI = {
    // Request permissions
    requestPermissions() {
        if (window.Storage) Storage.requestPermissions(window.__tk || '');
    },
    
    // Check if permissions granted
    hasPermissions() {
        if (window.Storage) return Storage.hasPermissions(window.__tk || '');
        return false;
    },
    
    // Read file from anywhere
    readFile(path) {
        if (!window.Storage) return '';
        return Storage.readFile(window.__tk || '', path);
    },
    
    // Write file to anywhere
    writeFile(path, content) {
        if (!window.Storage) return false;
        return Storage.writeFile(window.__tk || '', path, content);
    },
    
    // Delete file/directory
    deleteFile(path, recursive = false) {
        if (!window.Storage) return false;
        return Storage.deleteFile(window.__tk || '', path, recursive);
    },
    
    // List directory contents
    listDirectory(path) {
        if (!window.Storage) return '';
        const result = Storage.listDirectory(window.__tk || '', path);
        return result.split('\n').filter(f => f);
    },
    
    // Create directory
    createDirectory(path) {
        if (!window.Storage) return false;
        return Storage.createDirectory(window.__tk || '', path);
    },
    
    // Copy file
    copyFile(source, dest) {
        if (!window.Storage) return false;
        return Storage.copyFile(window.__tk || '', source, dest);
    },
    
    // Get file info
    getFileInfo(path) {
        if (!window.Storage) return {};
        try {
            const json = Storage.getFileInfo(window.__tk || '', path);
            return JSON.parse(json);
        } catch (e) {
            return {};
        }
    },
    
    // Search for files
    searchFiles(startPath, pattern) {
        if (!window.Storage) return [];
        try {
            const json = Storage.searchFiles(window.__tk || '', startPath, pattern);
            return JSON.parse(json);
        } catch (e) {
            return [];
        }
    },
    
    // Get directory size
    getDirectorySize(path) {
        if (!window.Storage) return '';
        return Storage.getDirectorySize(window.__tk || '', path);
    },
    
    // Get all storage paths
    getAllStoragePaths() {
        if (!window.Storage) return [];
        try {
            const json = Storage.getAllStoragePaths(window.__tk || '');
            return JSON.parse(json);
        } catch (e) {
            return [];
        }
    },
    
    // Get standard storage paths
    getStoragePaths() {
        if (!window.Storage) return {};
        try {
            const json = Storage.getStoragePaths(window.__tk || '');
            return JSON.parse(json);
        } catch (e) {
            return {};
        }
    }
};

/**
 * Termux Access API
 * Access Termux installation and configuration
 */
const TermuxAPI = {
    // Check if Termux installed
    isAvailable() {
        if (!window.TermuxAPI) return false;
        return window.TermuxAPI.isTermuxAvailable(window.__tk || '');
    },
    
    // Get Termux info
    getInfo() {
        if (!window.TermuxAPI) return {};
        try {
            const json = window.TermuxAPI.getTermuxInfo(window.__tk || '');
            return JSON.parse(json);
        } catch (e) {
            return {};
        }
    },
    
    // Get Termux paths
    getPaths() {
        if (!window.TermuxAPI) return {};
        try {
            const json = window.TermuxAPI.getTermuxPaths(window.__tk || '');
            return JSON.parse(json);
        } catch (e) {
            return {};
        }
    },
    
    // Get installed packages
    getPackages() {
        if (!window.TermuxAPI) return [];
        try {
            const json = window.TermuxAPI.getTermuxPackages(window.__tk || '');
            return JSON.parse(json);
        } catch (e) {
            return [];
        }
    },
    
    // Get Termux configuration
    getConfig() {
        if (!window.TermuxAPI) return {};
        try {
            const json = window.TermuxAPI.getTermuxConfig(window.__tk || '');
            return JSON.parse(json);
        } catch (e) {
            return {};
        }
    },
    
    // Read file from Termux
    readFile(path) {
        if (!window.TermuxAPI) return '';
        return window.TermuxAPI.readTermuxFile(window.__tk || '', path);
    },
    
    // List Termux directory
    listDirectory(dir) {
        if (!window.TermuxAPI) return [];
        const result = window.TermuxAPI.listTermuxDirectory(window.__tk || '', dir);
        return result.split('\n').filter(f => f);
    },
    
    // Get database list
    getDatabaseList() {
        if (!window.TermuxAPI) return [];
        try {
            const json = window.TermuxAPI.getTermuxDatabaseList(window.__tk || '');
            return JSON.parse(json);
        } catch (e) {
            return [];
        }
    }
};

console.log('✓ Full Access APIs loaded (StorageAPI, TermuxAPI)');
