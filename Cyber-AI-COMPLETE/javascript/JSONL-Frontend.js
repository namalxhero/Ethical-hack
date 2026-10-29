/* ========== JSONL FILE HANDLER ========== */

let currentJSONLData = null;

/**
 * Load JSONL file from file system or input
 */
async function loadJSONLFile(file) {
    if (!file || !file.name.toLowerCase().endsWith('.jsonl')) {
        alert('Please select a .jsonl file');
        return;
    }
    
    try {
        tp('📂 Loading JSONL file: ' + file.name);
        
        const text = await file.text();
        const lines = text.split('\n').filter(l => l.trim());
        
        const data = {
            name: file.name,
            lineCount: 0,
            rows: [],
            headers: new Set(),
            errors: 0
        };
        
        // Parse each line as JSON
        lines.forEach((line, idx) => {
            try {
                const obj = JSON.parse(line);
                data.rows.push(obj);
                Object.keys(obj).forEach(key => data.headers.add(key));
                data.lineCount++;
            } catch (e) {
                data.errors++;
                if (data.errors <= 3) {
                    tp('⚠️ Line ' + (idx + 1) + ' invalid JSON', 'e');
                }
            }
        });
        
        data.headers = Array.from(data.headers);
        currentJSONLData = data;
        
        tp('✅ Loaded: ' + data.lineCount + ' rows, ' + data.headers.length + ' columns');
        if (data.errors > 0) tp('⚠️ ' + data.errors + ' invalid lines skipped', 'e');
        
        // Display preview table
        displayJSONLTable(data);
        
        // Show in terminal
        document.getElementById('sb')?.classList.add('on');
        tab('cn');
        
    } catch (e) {
        tp('❌ Error reading file: ' + e.message, 'e');
    }
}

/**
 * Display JSONL data as table in terminal
 */
function displayJSONLTable(data, limit = 10) {
    tp('📊 ' + data.name + ' (' + data.lineCount + ' rows)');
    tp('Columns: ' + data.headers.join(', '));
    tp('─'.repeat(80));
    
    // Header row
    const headerRow = data.headers.map(h => h.padEnd(15)).join(' ');
    tp(headerRow);
    tp('─'.repeat(80));
    
    // Data rows
    data.rows.slice(0, limit).forEach((row, idx) => {
        const values = data.headers.map(h => 
            String(row[h] || '').substring(0, 15).padEnd(15)
        ).join(' ');
        tp((idx + 1) + '. ' + values);
    });
    
    if (data.rows.length > limit) {
        tp('... and ' + (data.rows.length - limit) + ' more rows');
    }
}

/**
 * Filter JSONL data
 * Usage: filterJSONL('columnName', 'searchValue')
 */
function filterJSONL(column, value) {
    if (!currentJSONLData) {
        tp('❌ No JSONL data loaded', 'e');
        return;
    }
    
    const filtered = {
        ...currentJSONLData,
        rows: currentJSONLData.rows.filter(row => 
            String(row[column] || '').toLowerCase().includes(value.toLowerCase())
        )
    };
    
    tp('🔍 Filtered ' + column + '="' + value + '": ' + filtered.rows.length + ' matches');
    displayJSONLTable(filtered);
}

/**
 * Sort JSONL by column
 * Usage: sortJSONL('columnName', 'asc')
 */
function sortJSONL(column, direction = 'asc') {
    if (!currentJSONLData) {
        tp('❌ No JSONL data loaded', 'e');
        return;
    }
    
    const sorted = {
        ...currentJSONLData,
        rows: [...currentJSONLData.rows].sort((a, b) => {
            const aVal = a[column];
            const bVal = b[column];
            
            // Handle numbers
            if (!isNaN(aVal) && !isNaN(bVal)) {
                return direction === 'asc' ? aVal - bVal : bVal - aVal;
            }
            
            // Handle strings
            const comparison = String(aVal || '').localeCompare(String(bVal || ''));
            return direction === 'asc' ? comparison : -comparison;
        })
    };
    
    tp('↕️ Sorted by ' + column + ' (' + direction + ')');
    displayJSONLTable(sorted);
}

/**
 * Export JSONL to CSV
 */
function exportJSONLAsCSV() {
    if (!currentJSONLData) {
        tp('❌ No JSONL data loaded', 'e');
        return;
    }
    
    let csv = currentJSONLData.headers.join(',') + '\n';
    
    currentJSONLData.rows.forEach(row => {
        const values = currentJSONLData.headers.map(h => {
            const val = row[h] || '';
            // Escape quotes and wrap if contains comma
            return typeof val === 'string' && val.includes(',') 
                ? '"' + val.replace(/"/g, '""') + '"'
                : val;
        });
        csv += values.join(',') + '\n';
    });
    
    // Copy to clipboard or trigger download
    copy(csv);
    tp('📋 CSV copied to clipboard (' + currentJSONLData.rows.length + ' rows)');
}

/**
 * Get statistics for a column
 */
function getJSONLColumnStats(column) {
    if (!currentJSONLData) {
        tp('❌ No JSONL data loaded', 'e');
        return;
    }
    
    const values = currentJSONLData.rows.map(r => r[column]);
    const numbers = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
    
    tp('📈 Statistics for "' + column + '":');
    tp('  Total: ' + values.length);
    tp('  Unique: ' + new Set(values).size);
    
    if (numbers.length > 0) {
        tp('  Min: ' + Math.min(...numbers));
        tp('  Max: ' + Math.max(...numbers));
        tp('  Avg: ' + (numbers.reduce((a,b)=>a+b,0)/numbers.length).toFixed(2));
    }
    
    tp('  Sample: ' + values.slice(0, 3).join(', '));
}

/**
 * Callback when Android loads JSONL
 */
window.__jsonlLoaded = (info) => {
    tp('✅ JSONL loaded from Android: ' + info.rows + ' rows');
    currentJSONLData = info;
};

/**
 * Terminal commands for JSONL
 * Add to terminal input handler
 */
function handleJSONLCommand(input) {
    const cmd = input.trim();
    
    if (cmd === 'help jsonl') {
        tp('JSONL Commands:');
        tp('  jsonl info - Show loaded JSONL info');
        tp('  jsonl filter column value - Filter data');
        tp('  jsonl sort column [asc|desc] - Sort data');
        tp('  jsonl stats column - Column statistics');
        tp('  jsonl export - Export as CSV');
        tp('  jsonl preview - Show preview table');
        return true;
    }
    
    if (cmd === 'jsonl info') {
        if (!currentJSONLData) tp('No JSONL loaded', 'e');
        else tp('JSONL: ' + currentJSONLData.rows.length + ' rows, ' + currentJSONLData.headers.length + ' columns');
        return true;
    }
    
    if (cmd.startsWith('jsonl filter ')) {
        const [_, col, ...val] = cmd.split(' ');
        filterJSONL(col, val.join(' '));
        return true;
    }
    
    if (cmd.startsWith('jsonl sort ')) {
        const [_, col, dir] = cmd.split(' ');
        sortJSONL(col, dir || 'asc');
        return true;
    }
    
    if (cmd.startsWith('jsonl stats ')) {
        const col = cmd.split('jsonl stats ')[1];
        getJSONLColumnStats(col);
        return true;
    }
    
    if (cmd === 'jsonl export') {
        exportJSONLAsCSV();
        return true;
    }
    
    if (cmd === 'jsonl preview') {
        if (currentJSONLData) displayJSONLTable(currentJSONLData);
        return true;
    }
    
    return false;
}

/**
 * Integrate into file input handler
 * Add to existing #fi onchange handler
 */
const originalFileHandler = document.getElementById('fi')?.onchange;
document.getElementById('fi').onchange = async function(e) {
    for (const file of e.target.files) {
        // Handle JSONL files
        if (file.name.toLowerCase().endsWith('.jsonl')) {
            await loadJSONLFile(file);
            e.target.value = '';
            return;
        }
    }
    
    // Fall through to original handler
    if (originalFileHandler) originalFileHandler.call(this, e);
};

/**
 * Add JSONL to terminal input handler
 * Modify existing #ci keydown handler
 */
const originalCIHandler = document.getElementById('ci')?.addEventListener;
if (document.getElementById('ci')) {
    const ci = document.getElementById('ci');
    ci.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const cmd = e.target.value.trim();
            if (handleJSONLCommand(cmd)) {
                e.target.value = '';
                e.preventDefault();
                return;
            }
        }
    });
}

console.log('✓ JSONL handler loaded');
