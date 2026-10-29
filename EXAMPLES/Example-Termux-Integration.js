/**
 * Example: Termux Integration
 * Working examples of Termux operations
 */

// ===== EXAMPLE 1: CHECK IF TERMUX AVAILABLE =====
function checkTermux() {
    if (TermuxAPI.isAvailable()) {
        tp('✅ Termux is installed');
    } else {
        tp('❌ Termux not found', 'e');
        tp('Install from Google Play or F-Droid');
    }
}

// ===== EXAMPLE 2: GET TERMUX INFO =====
function getTermuxInfo() {
    const info = TermuxAPI.getInfo();
    
    tp('ℹ️ Termux Information:');
    Object.entries(info).forEach(([key, value]) => {
        tp('  ' + key + ': ' + value);
    });
}

// ===== EXAMPLE 3: GET TERMUX PATHS =====
function getTermuxPaths() {
    const paths = TermuxAPI.getPaths();
    
    tp('📁 Termux Paths:');
    
    // Important paths
    tp('  Home: ' + paths.home);
    tp('  Bin: ' + paths.bin);
    tp('  Usr: ' + paths.usr);
    tp('  Lib: ' + paths.lib);
    tp('  Etc: ' + paths.etc);
    tp('  Databases: ' + paths.databases);
}

// ===== EXAMPLE 4: GET INSTALLED PACKAGES =====
function getTermuxPackages() {
    const packages = TermuxAPI.getPackages();
    
    if (packages.length === 0) {
        tp('❌ No packages found or Termux not accessible', 'e');
        return;
    }
    
    tp('📦 Installed Packages (' + packages.length + ' total):');
    
    // Show first 20
    packages.slice(0, 20).forEach(pkg => {
        tp('  • ' + pkg);
    });
    
    if (packages.length > 20) {
        tp('  ... and ' + (packages.length - 20) + ' more');
    }
}

// ===== EXAMPLE 5: CHECK AVAILABLE TOOLS =====
function checkTermuxTools() {
    const config = TermuxAPI.getConfig();
    
    tp('⚙️ Termux Tools:');
    
    const tools = [
        { name: 'Bash', key: 'bash_available' },
        { name: 'Python 3', key: 'python3_available' },
        { name: 'Node.js', key: 'node_available' },
        { name: 'GCC', key: 'gcc_available' },
        { name: 'Git', key: 'git_available' },
        { name: 'Zsh', key: 'zsh_available' }
    ];
    
    tools.forEach(tool => {
        const available = config[tool.key];
        const icon = available ? '✅' : '❌';
        tp('  ' + icon + ' ' + tool.name);
    });
}

// ===== EXAMPLE 6: READ TERMUX CONFIG FILE =====
function readTermuxBashrc() {
    const paths = TermuxAPI.getPaths();
    const bashrcPath = paths.home + '/.bashrc';
    
    const content = TermuxAPI.readFile(bashrcPath);
    
    if (content) {
        tp('📄 .bashrc contents:');
        const lines = content.split('\n').slice(0, 10);
        lines.forEach(line => tp('  ' + line));
        tp('  ... (showing first 10 lines)');
    } else {
        tp('❌ Could not read .bashrc', 'e');
    }
}

// ===== EXAMPLE 7: LIST TERMUX BINARIES =====
function listTermuxBinaries() {
    const paths = TermuxAPI.getPaths();
    const binaries = TermuxAPI.listDirectory(paths.bin);
    
    if (binaries.length === 0) {
        tp('❌ Could not list binaries', 'e');
        return;
    }
    
    tp('🔧 Termux Binaries (' + binaries.length + ' total):');
    
    // Show first 20
    binaries.slice(0, 20).forEach(bin => {
        tp('  • ' + bin);
    });
    
    if (binaries.length > 20) {
        tp('  ... and ' + (binaries.length - 20) + ' more');
    }
}

// ===== EXAMPLE 8: GET TERMUX DATABASES =====
function getTermuxDatabases() {
    const databases = TermuxAPI.getDatabaseList();
    
    if (databases.length === 0) {
        tp('💾 No databases found');
        return;
    }
    
    tp('💾 Termux Databases (' + databases.length + '):');
    databases.forEach(db => {
        tp('  • ' + db);
    });
}

// ===== EXAMPLE 9: COMPREHENSIVE TERMUX CHECK =====
function comprehensiveTermuxCheck() {
    if (!TermuxAPI.isAvailable()) {
        tp('❌ Termux not installed', 'e');
        return;
    }
    
    tp('🔍 Comprehensive Termux Check:');
    tp('');
    
    // Check tools
    const config = TermuxAPI.getConfig();
    const tools = Object.keys(config)
        .filter(k => config[k] === true)
        .length;
    tp('✅ ' + tools + ' tools available');
    
    // Check packages
    const packages = TermuxAPI.getPackages();
    tp('✅ ' + packages.length + ' packages installed');
    
    // Check databases
    const databases = TermuxAPI.getDatabaseList();
    tp('✅ ' + databases.length + ' databases');
    
    // Home path
    const paths = TermuxAPI.getPaths();
    tp('✅ Home: ' + paths.home);
    
    // Check important tools
    tp('');
    tp('📦 Important Tools:');
    if (config.gcc_available) tp('  ✅ GCC (compiler)');
    if (config.python3_available) tp('  ✅ Python 3');
    if (config.node_available) tp('  ✅ Node.js');
    if (config.git_available) tp('  ✅ Git');
    if (config.bash_available) tp('  ✅ Bash');
}

// ===== EXAMPLE 10: COMPARE WITH STORAGE =====
function compareTermuxAndStorage() {
    tp('📊 System Comparison:');
    tp('');
    
    // Storage
    tp('📱 Storage Access:');
    const hasStorage = StorageAPI.hasPermissions();
    tp('  ' + (hasStorage ? '✅' : '❌') + ' Storage: ' + 
       (hasStorage ? 'Full Access' : 'No Access'));
    
    const storagePaths = StorageAPI.getStoragePaths();
    tp('  ✅ SD Card: ' + storagePaths.sdcard);
    
    // Termux
    tp('');
    tp('🖥️ Termux:');
    if (TermuxAPI.isAvailable()) {
        const packages = TermuxAPI.getPackages();
        tp('  ✅ Installed: Yes');
        tp('  ✅ Packages: ' + packages.length);
        
        const config = TermuxAPI.getConfig();
        if (config.gcc_available) tp('  ✅ GCC available');
        if (config.python3_available) tp('  ✅ Python 3 available');
    } else {
        tp('  ❌ Installed: No');
    }
}

// ===== EXAMPLE 11: SETUP WORK ENVIRONMENT =====
function setupWorkEnvironment() {
    if (!TermuxAPI.isAvailable()) {
        tp('❌ Termux required for this operation', 'e');
        return;
    }
    
    tp('🔧 Setting up work environment...');
    
    const paths = TermuxAPI.getPaths();
    
    // Create workspace
    const workspace = paths.home + '/workspace';
    tp('📂 Workspace: ' + workspace);
    
    // Create project directory
    const projectDir = workspace + '/my-project';
    tp('📂 Project dir: ' + projectDir);
    
    // Check for tools
    const config = TermuxAPI.getConfig();
    tp('');
    tp('🔧 Tools available:');
    if (config.git_available) tp('  ✅ Git - version control');
    if (config.python3_available) tp('  ✅ Python 3 - scripting');
    if (config.node_available) tp('  ✅ Node.js - runtime');
    if (config.gcc_available) tp('  ✅ GCC - compilation');
    
    tp('');
    tp('✅ Environment ready!');
}

// ===== EXAMPLE 12: QUICK STATUS =====
function quickStatus() {
    tp('⚡ Quick Status:');
    tp('');
    
    // Storage
    const storage = StorageAPI.hasPermissions() ? '✅' : '❌';
    tp('Storage: ' + storage);
    
    // Termux
    const termux = TermuxAPI.isAvailable() ? '✅' : '❌';
    tp('Termux: ' + termux);
    
    // Packages
    if (TermuxAPI.isAvailable()) {
        const pkgs = TermuxAPI.getPackages().length;
        tp('Packages: ' + pkgs);
    }
    
    // Tools
    if (TermuxAPI.isAvailable()) {
        const config = TermuxAPI.getConfig();
        const tools = Object.values(config)
            .filter(v => v === true).length;
        tp('Tools: ' + tools);
    }
}

// ===== HOW TO USE =====
/*
 * Copy these examples to use:
 * 
 * In terminal:
 *   $ js checkTermux()
 *   $ js getTermuxInfo()
 *   $ js getTermuxPaths()
 *   $ js getTermuxPackages()
 *   $ js checkTermuxTools()
 *   $ js readTermuxBashrc()
 *   $ js listTermuxBinaries()
 *   $ js getTermuxDatabases()
 *   $ js comprehensiveTermuxCheck()
 *   $ js compareTermuxAndStorage()
 *   $ js setupWorkEnvironment()
 *   $ js quickStatus()
 * 
 * Or add to a custom button/menu in your app.
 */
