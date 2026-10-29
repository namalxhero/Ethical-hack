/**
 * Example: File Operations
 * Working examples of common file operations
 */

// ===== EXAMPLE 1: READ FILE =====
function readMyFile() {
    const path = '/sdcard/data.txt';
    const content = StorageAPI.readFile(path);
    
    if (content) {
        tp('📄 File contents:');
        tp(content);
    } else {
        tp('❌ File not found: ' + path, 'e');
    }
}

// ===== EXAMPLE 2: WRITE FILE =====
function writeMyFile() {
    const path = '/sdcard/my-output.txt';
    const content = 'Hello World\n' +
                   'Generated at: ' + new Date() + '\n' +
                   'Random: ' + Math.random();
    
    const success = StorageAPI.writeFile(path, content);
    
    if (success) {
        tp('✅ File written to: ' + path);
    } else {
        tp('❌ Failed to write file', 'e');
    }
}

// ===== EXAMPLE 3: LIST FILES =====
function listMyFiles() {
    const path = '/sdcard/Download';
    const files = StorageAPI.listDirectory(path);
    
    if (files.length > 0) {
        tp('📂 Files in ' + path + ' (' + files.length + '):');
        files.forEach(f => {
            tp('  • ' + f);
        });
    } else {
        tp('❌ Directory not found or empty', 'e');
    }
}

// ===== EXAMPLE 4: SEARCH FILES =====
function searchMyFiles() {
    const path = '/sdcard';
    const pattern = '.*\\.txt';  // All .txt files
    
    const results = StorageAPI.searchFiles(path, pattern);
    
    if (results.length > 0) {
        tp('🔍 Found ' + results.length + ' .txt files');
        results.slice(0, 10).forEach(f => {
            tp('  📄 ' + f);
        });
        if (results.length > 10) {
            tp('  ... and ' + (results.length - 10) + ' more');
        }
    } else {
        tp('❌ No .txt files found');
    }
}

// ===== EXAMPLE 5: GET FILE INFO =====
function getMyFileInfo() {
    const path = '/sdcard/file.txt';
    const info = StorageAPI.getFileInfo(path);
    
    if (info.exists) {
        tp('ℹ️ File Information:');
        tp('  Name: ' + info.name);
        tp('  Size: ' + info.size + ' bytes');
        tp('  Path: ' + info.absolutePath);
        tp('  Readable: ' + (info.readable ? '✅' : '❌'));
        tp('  Writable: ' + (info.writable ? '✅' : '❌'));
        tp('  Modified: ' + new Date(info.modified).toLocaleString());
    } else {
        tp('❌ File does not exist', 'e');
    }
}

// ===== EXAMPLE 6: COPY FILE =====
function copyMyFile() {
    const source = '/sdcard/original.txt';
    const dest = '/sdcard/backup.txt';
    
    const success = StorageAPI.copyFile(source, dest);
    
    if (success) {
        tp('✅ File copied');
        tp('  From: ' + source);
        tp('  To: ' + dest);
    } else {
        tp('❌ Failed to copy file', 'e');
    }
}

// ===== EXAMPLE 7: GET DIRECTORY SIZE =====
function getMyDirectorySize() {
    const paths = [
        '/sdcard',
        '/sdcard/Download',
        '/sdcard/DCIM',
        '/sdcard/Pictures'
    ];
    
    tp('💾 Directory Sizes:');
    paths.forEach(path => {
        const size = StorageAPI.getDirectorySize(path);
        tp('  ' + path + ': ' + size);
    });
}

// ===== EXAMPLE 8: CREATE DIRECTORY =====
function createMyDirectory() {
    const path = '/sdcard/MyAppData';
    
    const success = StorageAPI.createDirectory(path);
    
    if (success) {
        tp('✅ Directory created: ' + path);
    } else {
        tp('❌ Failed to create directory', 'e');
    }
}

// ===== EXAMPLE 9: DELETE FILE =====
function deleteMyFile() {
    const path = '/sdcard/old-file.txt';
    
    const success = StorageAPI.deleteFile(path);
    
    if (success) {
        tp('✅ File deleted: ' + path);
    } else {
        tp('❌ Failed to delete file', 'e');
    }
}

// ===== EXAMPLE 10: BATCH OPERATIONS =====
function batchOperations() {
    tp('Starting batch operations...');
    
    // Create folder
    StorageAPI.createDirectory('/sdcard/batch-test');
    tp('✅ Folder created');
    
    // Write multiple files
    for (let i = 1; i <= 3; i++) {
        const path = '/sdcard/batch-test/file' + i + '.txt';
        StorageAPI.writeFile(path, 'Content ' + i);
    }
    tp('✅ 3 files written');
    
    // List them
    const files = StorageAPI.listDirectory('/sdcard/batch-test');
    tp('📂 Files in batch-test (' + files.length + '):');
    files.forEach(f => tp('  ' + f));
    
    // Get total size
    const size = StorageAPI.getDirectorySize('/sdcard/batch-test');
    tp('💾 Total size: ' + size);
    
    tp('✅ Batch operations complete');
}

// ===== EXAMPLE 11: SAFE FILE OPERATIONS =====
function safeFileOperations() {
    // Always check permissions first
    if (!StorageAPI.hasPermissions()) {
        tp('⚠️ No permissions! Requesting...');
        StorageAPI.requestPermissions();
        return;
    }
    
    // Then try operations
    const path = '/sdcard/safe-test.txt';
    
    try {
        // Write
        if (StorageAPI.writeFile(path, 'Test content')) {
            tp('✅ File written');
            
            // Read
            const content = StorageAPI.readFile(path);
            tp('✅ File read: ' + content);
            
            // Get info
            const info = StorageAPI.getFileInfo(path);
            tp('✅ File size: ' + info.size + ' bytes');
        }
    } catch (e) {
        tp('❌ Error: ' + e.message, 'e');
    }
}

// ===== EXAMPLE 12: ALL STORAGE PATHS =====
function showAllPaths() {
    const paths = StorageAPI.getStoragePaths();
    
    tp('📍 All Storage Paths:');
    Object.entries(paths).forEach(([name, path]) => {
        tp(`  ${name}: ${path}`);
    });
}

// ===== HOW TO USE =====
/*
 * Copy these examples to use:
 * 
 * In terminal:
 *   $ js readMyFile()
 *   $ js writeMyFile()
 *   $ js listMyFiles()
 *   $ js searchMyFiles()
 *   $ js getMyFileInfo()
 *   $ js copyMyFile()
 *   $ js getMyDirectorySize()
 *   $ js createMyDirectory()
 *   $ js deleteMyFile()
 *   $ js batchOperations()
 *   $ js safeFileOperations()
 *   $ js showAllPaths()
 * 
 * Or add to a custom button/menu in your app.
 */
