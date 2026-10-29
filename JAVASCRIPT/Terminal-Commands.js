/* ========== TERMINAL COMMANDS - STORAGE & TERMUX ========== */

/**
 * Handle full access terminal commands
 */
function handleFullAccessCommand(input) {
    const cmd = input.trim();
    
    // ===== STORAGE COMMANDS =====
    
    if (cmd === 'help storage') {
        tp('STORAGE COMMANDS:');
        tp('  storage info PATH - File information');
        tp('  storage read PATH - Read file contents');
        tp('  storage list PATH - List directory');
        tp('  storage size PATH - Directory size');
        tp('  storage search PATH PATTERN - Search files');
        tp('  storage paths - Show all storage paths');
        return true;
    }
    
    if (cmd.startsWith('storage info ')) {
        const path = cmd.substring(13);
        const info = StorageAPI.getFileInfo(path);
        tp('📁 ' + path);
        if (info.exists) {
            Object.entries(info).forEach(([k, v]) => {
                tp(`  ${k}: ${v}`);
            });
        } else {
            tp('❌ File not found', 'e');
        }
        return true;
    }
    
    if (cmd.startsWith('storage read ')) {
        const path = cmd.substring(13);
        const content = StorageAPI.readFile(path);
        if (content) {
            tp('📄 ' + path);
            content.split('\n').forEach(line => tp(line));
        } else {
            tp('❌ Cannot read file', 'e');
        }
        return true;
    }
    
    if (cmd.startsWith('storage list ')) {
        const path = cmd.substring(13);
        const files = StorageAPI.listDirectory(path);
        if (files.length > 0) {
            tp('📂 ' + path + ' (' + files.length + ' items)');
            files.forEach(f => tp('  ' + f));
        } else {
            tp('❌ Directory not found or empty', 'e');
        }
        return true;
    }
    
    if (cmd.startsWith('storage size ')) {
        const path = cmd.substring(13);
        const size = StorageAPI.getDirectorySize(path);
        if (size) {
            tp('💾 ' + path + ': ' + size);
        } else {
            tp('❌ Cannot read directory', 'e');
        }
        return true;
    }
    
    if (cmd.startsWith('storage search ')) {
        const parts = cmd.substring(15).split(' ');
        const path = parts[0];
        const pattern = parts.slice(1).join(' ');
        const files = StorageAPI.searchFiles(path, pattern);
        if (files.length > 0) {
            tp('🔍 Found ' + files.length + ' matches');
            files.slice(0, 20).forEach(f => tp('  ' + f));
            if (files.length > 20) tp('  ... and ' + (files.length - 20) + ' more');
        } else {
            tp('🔍 No matches found');
        }
        return true;
    }
    
    if (cmd === 'storage paths') {
        const paths = StorageAPI.getStoragePaths();
        tp('📍 Storage Paths:');
        Object.entries(paths).forEach(([k, v]) => {
            tp(`  ${k}: ${v}`);
        });
        return true;
    }
    
    if (cmd === 'storage all-paths') {
        const paths = StorageAPI.getAllStoragePaths();
        tp('📍 All Available Paths (' + paths.length + '):');
        paths.forEach(p => tp('  ' + p));
        return true;
    }
    
    // ===== TERMUX COMMANDS =====
    
    if (cmd === 'help termux') {
        tp('TERMUX COMMANDS:');
        tp('  termux info - Termux information');
        tp('  termux paths - Termux directory paths');
        tp('  termux config - Termux configuration');
        tp('  termux packages - List installed packages');
        tp('  termux databases - List databases');
        return true;
    }
    
    if (cmd === 'termux info') {
        if (!TermuxAPI.isAvailable()) {
            tp('❌ Termux not found', 'e');
            return true;
        }
        const info = TermuxAPI.getInfo();
        tp('ℹ️ Termux Info:');
        Object.entries(info).forEach(([k, v]) => {
            tp(`  ${k}: ${v}`);
        });
        return true;
    }
    
    if (cmd === 'termux paths') {
        if (!TermuxAPI.isAvailable()) {
            tp('❌ Termux not found', 'e');
            return true;
        }
        const paths = TermuxAPI.getPaths();
        tp('📁 Termux Paths:');
        Object.entries(paths).forEach(([k, v]) => {
            tp(`  ${k}: ${v}`);
        });
        return true;
    }
    
    if (cmd === 'termux config') {
        if (!TermuxAPI.isAvailable()) {
            tp('❌ Termux not found', 'e');
            return true;
        }
        const config = TermuxAPI.getConfig();
        tp('⚙️ Termux Configuration:');
        Object.entries(config).forEach(([k, v]) => {
            const icon = v === true ? '✅' : v === false ? '❌' : 'ℹ️';
            tp(`  ${icon} ${k}: ${v}`);
        });
        return true;
    }
    
    if (cmd === 'termux packages') {
        if (!TermuxAPI.isAvailable()) {
            tp('❌ Termux not found', 'e');
            return true;
        }
        const packages = TermuxAPI.getPackages();
        if (packages.length > 0) {
            tp('📦 Installed Packages (' + packages.length + '):');
            packages.slice(0, 20).forEach(p => tp('  ' + p));
            if (packages.length > 20) tp('  ... and ' + (packages.length - 20) + ' more');
        } else {
            tp('❌ No packages found', 'e');
        }
        return true;
    }
    
    if (cmd === 'termux databases') {
        if (!TermuxAPI.isAvailable()) {
            tp('❌ Termux not found', 'e');
            return true;
        }
        const databases = TermuxAPI.getDatabaseList();
        if (databases.length > 0) {
            tp('💾 Termux Databases (' + databases.length + '):');
            databases.forEach(db => tp('  ' + db));
        } else {
            tp('💾 No databases found');
        }
        return true;
    }
    
    // ===== ACCESS COMMANDS =====
    
    if (cmd === 'help access') {
        tp('ACCESS COMMANDS:');
        tp('  help storage - Storage commands');
        tp('  help termux - Termux commands');
        tp('  access info - Show access status');
        tp('  access request - Request permissions');
        return true;
    }
    
    if (cmd === 'access info') {
        const hasPerms = StorageAPI.hasPermissions();
        const termuxAvailable = TermuxAPI.isAvailable();
        tp('🔐 Access Status:');
        tp(`  Storage: ${hasPerms ? '✅ Full Access' : '❌ No Access'}`);
        tp(`  Termux: ${termuxAvailable ? '✅ Available' : '❌ Not Found'}`);
        return true;
    }
    
    if (cmd === 'access request') {
        tp('📍 Requesting storage permissions...');
        StorageAPI.requestPermissions();
        return true;
    }
    
    return false;
}

// Integrate into terminal input handler
console.log('✓ Full Access terminal commands loaded');
