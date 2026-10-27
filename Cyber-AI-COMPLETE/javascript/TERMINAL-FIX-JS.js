/* ========== FIXED TERMINAL SYSTEM ========== */

// Terminal state management
let terminalOutput = [];
let currentStatus = "stopped";
let terminalBuffer = "";

// ===== CORE TERMINAL FUNCTIONS =====

window.__sh = (text, isError) => {
    // Add to terminal output array
    terminalOutput.push({
        text: text,
        error: isError,
        timestamp: Date.now()
    });
    
    // Add to buffer
    terminalBuffer += text + '\n';
    
    // Update UI immediately
    tp(text, isError ? 'e' : 'o');
    
    // Handle shell completion marker
    const m = text.match(/^__DONE__(\d+)$/);
    if (m && shRes) {
        const o = (shBuf || []).join('\n');
        const r = shRes;
        shBuf = null;
        shRes = null;
        r({out: o, code: m[1]});
        return;
    }
    
    if (text === 'denied' && shRes) {
        const r = shRes;
        shBuf = null;
        shRes = null;
        r({out: 'denied by user', code: 'denied'});
        return;
    }
    
    if (shBuf) shBuf.push(text);
};

// Real-time status update from Android
window.__status = (status) => {
    currentStatus = status;
    updateStatusUI(status);
};

// Status UI update
function updateStatusUI(status) {
    const statusEl = document.getElementById('terminal-status');
    if (!statusEl) return;
    
    const statusMap = {
        'starting': '🟡 Starting...',
        'running': '🟢 Running',
        'executing': '⚙ Executing...',
        'stopped': '🔴 Stopped',
        'error': '❌ Error'
    };
    
    statusEl.textContent = statusMap[status] || status;
    statusEl.className = 'status-' + status;
}

// Restore terminal on page load
window.__restoreTerminal = (buffer, status) => {
    terminalBuffer = buffer;
    currentStatus = status;
    
    // Restore to #out element
    if (buffer && buffer.length > 0) {
        const lines = buffer.split('\n').slice(-100); // Last 100 lines
        const outEl = document.getElementById('out');
        if (outEl) {
            lines.forEach(line => {
                if (!line) return;
                const isError = line.startsWith('[ERR]') || line.startsWith('[E]');
                tp(line.replace(/^\[(ERR|OK|E|O)\]\s*/, ''), isError ? 'e' : 'o');
            });
        }
    }
    
    updateStatusUI(status);
};

// Display terminal line
function tp(text, cls = 'o') {
    const outEl = document.getElementById('out');
    if (!outEl) return;
    
    const d = document.createElement('div');
    d.className = cls || 'o';
    d.textContent = text;
    outEl.appendChild(d);
    outEl.scrollTop = outEl.scrollHeight;
}

// ===== TERMINAL CONTROL =====

// Start shell
function startShell(root = true) {
    if (window.Android) {
        Android.start(window.__tk || '', root);
    }
}

// Stop shell
function stopShell() {
    if (window.Android) {
        Android.stop(window.__tk || '');
    }
}

// Get current status
function getTerminalStatus() {
    if (window.Android) {
        return Android.getStatus(window.__tk || '');
    }
    return currentStatus;
}

// Get terminal buffer
function getTerminalBuffer() {
    if (window.Android) {
        return Android.getTerminalBuffer(window.__tk || '');
    }
    return terminalBuffer;
}

// Clear terminal
function clearTerminal() {
    terminalBuffer = '';
    terminalOutput = [];
    const outEl = document.getElementById('out');
    if (outEl) {
        outEl.innerHTML = '';
    }
    if (window.Android) {
        Android.clearTerminal(window.__tk || '');
    }
}

// ===== BACK NAVIGATION (PRESERVE STATE) =====

// Enhanced goBack function
window.goBack = () => {
    // Priority order for back navigation
    if (document.getElementById('tv')?.classList.contains('on')) {
        document.getElementById('tv').classList.remove('on');
        return 1;
    }
    
    if (document.getElementById('lb')?.classList.contains('on')) {
        document.getElementById('lb').click();
        return 1;
    }
    
    if (document.getElementById('modal')?.classList.contains('on')) {
        document.getElementById('modal').classList.remove('on');
        return 1;
    }
    
    // Keep terminal open, just go back to chat
    if (document.getElementById('sb')?.classList.contains('on')) {
        // Don't close sidebar, just let default back behavior happen
        document.getElementById('sb').classList.remove('on');
        return 1;
    }
    
    if (document.getElementById('drawer')?.classList.contains('on')) {
        const dr = document.getElementById('drawer');
        dr.classList.remove('on');
        document.getElementById('ov').classList.remove('on');
        return 1;
    }
    
    // Terminal output persists, navigate normally
    return 0;
};

// ===== AUTO-RUN SYSTEM (Preserve state) =====

let autoN = 0;
let autoSending = false;

// Auto-step through bash blocks
async function autoStep(txt) {
    if (!window.AUTO || !txt || txt.startsWith('⚠️')) return;
    
    if (window.__ab) {
        window.__ab = 0;
        return;
    }
    
    const blocks = [...txt.matchAll(/```(?:bash|sh|shell)\n([\s\S]*?)```/g)].map(m => m[1].trim()).filter(Boolean);
    
    if (!blocks.length) {
        autoN = 0;
        return;
    }
    
    if (++autoN > 12) {
        const w = document.querySelectorAll('.wk');
        if (w.length) {
            w[w.length - 1].style.display = '';
            w[w.length - 1].firstChild.innerHTML = '⚠️ Step 12 limit reached. Type "continue".';
        }
        autoN = 0;
        return;
    }
    
    // Show terminal while executing
    document.getElementById('sb')?.classList.add('on');
    tab('cn');
    
    let rep = '';
    for (const b of blocks) {
        tp('$ (auto)', 'c');
        const r = await runShell(b);
        rep += '$ ' + b + '\n' + r.out.slice(-3000) + '\n[exit ' + r.code + ']\n\n';
    }
    
    document.getElementById('q').value = 'Command output:\n```\n' + rep.trim() + '\n```\nContinue.';
    autoSending = true;
    send();
}

// ===== SHELL EXECUTION =====

let shBuf = null;
let shRes = null;

function runShell(cmd) {
    return new Promise(res => {
        shBuf = [];
        shRes = res;
        nat('run', cmd + '\necho __DONE__$?', true);
        
        setTimeout(() => {
            if (shRes) {
                const o = (shBuf || []).join('\n');
                shBuf = null;
                shRes = null;
                res({out: o, code: 'timeout'});
            }
        }, 180000);
    });
}

// ===== NATIVE INTEGRATION =====

const nat = (f, ...a) => window.Android ? Android[f](window.__tk || '', ...a) : tp('Android API unavailable', 'e');

// Terminal input handler
document.getElementById('ci')?.addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter') return;
    
    const v = e.target.value.trim();
    e.target.value = '';
    
    if (!v) return;
    
    tp('$ ' + v, 'c');
    
    if (v === 'clear') {
        clearTerminal();
        return;
    }
    
    if (v === 'help') {
        tp('Commands: help, clear, status, start, stop, js <expr>, py <code>, or bash command');
        return;
    }
    
    if (v === 'status') {
        tp('Status: ' + getTerminalStatus());
        return;
    }
    
    if (v === 'start') {
        startShell(true);
        return;
    }
    
    if (v === 'stop') {
        stopShell();
        return;
    }
    
    if (v.startsWith('js ')) {
        return document.getElementById('pv')?.contentWindow.postMessage({__eval: v.slice(3)}, '*');
    }
    
    if (v.startsWith('py ')) {
        return pyRun(v.slice(3));
    }
    
    // Run in shell
    nat('run', v, false);
});

// ===== TERMINAL UI BUTTONS =====

// Add to existing tab system
document.getElementById('runb')?.addEventListener('click', () => {
    const cmd = document.getElementById('code')?.value || '';
    if (cmd) {
        runCode(lang, cmd);
    }
});

// Terminal copy
document.getElementById('cpb')?.addEventListener('click', (e) => {
    const code = document.getElementById('code')?.value || '';
    copy(code);
    e.target.textContent = '✓';
    setTimeout(() => e.target.textContent = 'Copy', 1200);
});

// Preserve terminal on sidebar toggle
const originalTabFunction = window.tab;
window.tab = (id) => {
    if (originalTabFunction) originalTabFunction(id);
    
    // Ensure terminal state is preserved when switching tabs
    if (id === 'cn' && !document.getElementById('out')?.innerHTML) {
        const buf = getTerminalBuffer();
        if (buf) {
            const lines = buf.split('\n').slice(-50);
            lines.forEach(line => {
                if (line) tp(line);
            });
        }
    }
};

console.log('✓ Terminal system loaded with persistence');
