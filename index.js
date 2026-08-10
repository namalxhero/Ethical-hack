const express = require('express');
const admin = require('firebase-admin');

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Firebase Firestore Setup
function getDb() {
    if (!admin.apps.length) {
        try {
            const envJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
            if (envJson) {
                admin.initializeApp({ credential: admin.credential.cert(JSON.parse(envJson)) });
            }
        } catch (error) {
            console.error("Firebase init error:", error.message);
        }
    }
    return admin.apps.length ? admin.firestore() : null;
}

// 1. Free Web Search via DuckDuckGo HTML API (No API Key Required)
async function freeWebSearch(query) {
    try {
        const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const html = await res.text();
        const matches = [...html.matchAll(/<a class="result__snippet[^>]*>(.*?)<\/a>/g)];
        const results = matches.slice(0, 3).map(m => `- ${m[1].replace(/<[^>]+>/g, '').trim()}`);
        return results.length ? results.join("\n") : null;
    } catch (e) {
        console.error("DDG search error:", e.message);
        return null;
    }
}

// 2. Free Code Execution Sandbox via Piston API
async function executeCodeInSandbox(language, code) {
    try {
        const res = await fetch('https://emkc.org/api/v2/piston/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: language || 'python',
                version: '*',
                files: [{ content: code }]
            })
        });
        const data = await res.json();
        return data.run?.output || "Executed with no output.";
    } catch (e) {
        console.error("Piston API error:", e.message);
        return "Code execution service failed.";
    }
}

// 3. Free CVE Vulnerability Database Search via CIRCL API
async function searchCVE(query) {
    try {
        const res = await fetch(`https://cve.circl.lu/api/search/${encodeURIComponent(query)}`);
        const data = await res.json();
        if (!Array.isArray(data) || !data.length) return null;
        return data.slice(0, 3).map(item => `• ${item.id}: ${item.summary}`).join("\n");
    } catch (e) {
        console.error("CVE search error:", e.message);
        return null;
    }
}

// 4. Free IP / Port Lookup API (Alternative to Shodan)
async function scanIPAddress(ip) {
    try {
        const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,isp,org,as,query`);
        const data = await res.json();
        if (data.status !== 'success') return "IP Scanning failed or invalid IP.";
        return `• IP: ${data.query}\n• Country: ${data.country}\n• ISP: ${data.isp}\n• Org: ${data.org}`;
    } catch (e) {
        console.error("IP Scan error:", e.message);
        return null;
    }
}

// Real current date for Sri Lanka timezone
function getTodayString() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' });
    const weekday = now.toLocaleDateString('en-US', { timeZone: 'Asia/Colombo', weekday: 'long' });
    return `${weekday}, ${dateStr}`;
}

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stealth Tech AI</title>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <style>
        :root { --bg-color: #0d1117; --chat-bg: #161b22; --user-msg: #238636; --ai-msg: #21262d; --text-main: #e6edf3; --accent: #2ea043; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: var(--bg-color); color: var(--text-main); display: flex; flex-direction: column; height: 100vh; margin: 0; }
        #header { display: flex; justify-content: space-between; align-items: center; padding: 15px 25px; background: rgba(22, 27, 34, 0.8); backdrop-filter: blur(10px); border-bottom: 1px solid #30363d; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        #header h2 { margin: 0; font-size: 18px; font-weight: 600; color: #58a6ff; }
        .new-chat-btn { background: transparent; color: #8b949e; border: 1px solid #30363d; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 13px; transition: 0.3s; }
        .new-chat-btn:hover { background: #30363d; color: var(--text-main); }
        #chat-box { flex: 1; overflow-y: auto; padding: 25px; display: flex; flex-direction: column; gap: 15px; scroll-behavior: smooth; }
        .message-container { display: flex; flex-direction: column; gap: 5px; max-width: 85%; }
        .message-container.user-container { align-self: flex-end; }
        .message-container.ai-container { align-self: flex-start; }
        .message { padding: 12px 18px; border-radius: 12px; line-height: 1.6; word-break: break-word; font-size: 14.5px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        .user { background: var(--user-msg); color: #fff; border-bottom-right-radius: 2px; }
        .ai { background: var(--ai-msg); color: var(--text-main); border: 1px solid #30363d; border-bottom-left-radius: 2px; }
        .ai pre { position: relative; background: #0d1117; padding: 15px; padding-top: 35px; border-radius: 8px; overflow-x: auto; border: 1px solid #30363d; margin: 10px 0; font-size: 13px; }
        .ai code { font-family: 'Fira Code', Consolas, monospace; background: rgba(110,118,129,0.4); padding: 3px 6px; border-radius: 4px; font-size: 13px; }
        .ai pre code { background: transparent; padding: 0; }
        .copy-code-btn, .copy-msg-btn { background: #21262d; color: #8b949e; border: 1px solid #30363d; border-radius: 5px; padding: 4px 10px; font-size: 11px; cursor: pointer; transition: 0.2s; }
        .copy-code-btn { position: absolute; top: 8px; right: 8px; }
        .copy-msg-btn { align-self: flex-start; margin-top: 2px; }
        .copy-code-btn:hover, .copy-msg-btn:hover { background: #30363d; color: #fff; }
        #input-area { display: flex; padding: 15px 25px; background: var(--chat-bg); border-top: 1px solid #30363d; gap: 12px; align-items: center; }
        input[type="text"] { flex: 1; padding: 14px 20px; border-radius: 25px; border: 1px solid #30363d; background: #0d1117; color: var(--text-main); outline: none; font-size: 14.5px; }
        input[type="file"] { display: none; }
        .file-btn { background: #21262d; color: #8b949e; padding: 12px; border-radius: 50%; cursor: pointer; border: 1px solid #30363d; width: 24px; height: 24px; display: flex; justify-content: center; align-items: center; }
        button.send-btn { background: var(--accent); color: #fff; border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer; font-weight: 600; font-size: 14px; }
        #file-name { font-size: 12px; color: #8b949e; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        #owner-badge { font-size: 11px; background: #da3633; color: white; padding: 2px 8px; border-radius: 10px; margin-left: 8px; display: none; }
    </style>
</head>
<body>
    <div id="header">
        <h2 id="app-title">✨ Stealth Tech AI <span id="owner-badge">PRIVATE MODE</span></h2>
        <div class="header-right">
            <button class="new-chat-btn" onclick="startNewChat()">Clear Chat</button>
        </div>
    </div>
    <div id="chat-box"></div>
    <div id="input-area">
        <label for="media-file" class="file-btn">📎</label>
        <input type="file" id="media-file" accept="image/*,video/*,.txt,.py,.js,.json" onchange="showFileName()">
        <span id="file-name"></span>
        <input type="text" id="user-input" placeholder="Type your message here..." onkeypress="if(event.key === 'Enter') sendMessage()">
        <button class="send-btn" onclick="sendMessage()">Send</button>
    </div>

    <script>
        let clientId = localStorage.getItem('stealth_client_id') || 'client_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('stealth_client_id', clientId);
        
        let isOwnerMode = localStorage.getItem('stealth_owner_' + clientId) === 'true';
        let chatHistory = [];

        document.addEventListener("DOMContentLoaded", async () => {
            await migrateLocalDataToFirebase();
            await loadHistoryFromFirebase();
            updateTitle();
        });

        async function migrateLocalDataToFirebase() {
            const normalKey = 'stealth_history_normal_' + clientId;
            const ownerKey = 'stealth_history_owner_' + clientId;
            
            const normalHistStr = localStorage.getItem(normalKey);
            const ownerHistStr = localStorage.getItem(ownerKey);
            
            if (normalHistStr || ownerHistStr) {
                try {
                    const normalHist = normalHistStr ? JSON.parse(normalHistStr) : [];
                    const ownerHist = ownerHistStr ? JSON.parse(ownerHistStr) : [];
                    
                    await fetch('/migrate-history', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ clientId, normalHistory: normalHist, ownerHistory: ownerHist })
                    });

                    localStorage.removeItem(normalKey);
                    localStorage.removeItem(ownerKey);
                    localStorage.removeItem('stealth_html_normal_' + clientId);
                    localStorage.removeItem('stealth_html_owner_' + clientId);
                } catch(e) {
                    console.error("Migration failed:", e);
                }
            }
        }

        async function loadHistoryFromFirebase() {
            try {
                const res = await fetch('/get-history?clientId=' + clientId + '&isOwnerMode=' + isOwnerMode);
                const data = await res.json();
                if (data.history) {
                    chatHistory = data.history;
                }
            } catch (e) {
                console.error("Failed to load history:", e);
            }
            renderChatBox();
        }

        function renderChatBox() {
            const chatBox = document.getElementById('chat-box');
            let html = '<div class="message-container ai-container"><div class="message ai">' + (isOwnerMode ? '👑 Owner Mode Active.' : 'System Online. Ready.') + '</div></div>';
            
            chatHistory.forEach(msg => {
                const isUser = msg.role === 'user';
                let textContent = "";
                if (Array.isArray(msg.parts)) {
                    textContent = msg.parts.map(p => p.text || "").join("\\n");
                }

                if (isUser) {
                    html += '<div class="message-container user-container"><div class="message user"><div>' + textContent.replace(/</g, "&lt;").replace(/>/g, "&gt;") + '</div></div></div>';
                } else {
                    html += '<div class="message-container ai-container"><div class="message ai">' + marked.parse(textContent) + '</div><button class="copy-msg-btn" data-text="' + textContent.replace(/"/g, '&quot;') + '">Copy Response</button></div>';
                }
            });

            chatBox.innerHTML = html;
            chatBox.querySelectorAll('.message.ai').forEach(aiDiv => addCopyButtonsToPre(aiDiv));
            scrollToBottom();
        }

        document.getElementById('chat-box').addEventListener('click', function(e) {
            if (e.target.classList.contains('copy-msg-btn')) {
                const text = e.target.getAttribute('data-text') || '';
                navigator.clipboard.writeText(text);
                e.target.textContent = 'Copied Text!';
                setTimeout(() => e.target.textContent = 'Copy Response', 2000);
            }
            if (e.target.classList.contains('copy-code-btn')) {
                const pre = e.target.closest('pre');
                if (pre) {
                    const text = pre.cloneNode(true);
                    if(text.querySelector('.copy-code-btn')) text.querySelector('.copy-code-btn').remove();
                    navigator.clipboard.writeText(text.textContent.trim());
                    e.target.textContent = 'Copied!';
                    setTimeout(() => e.target.textContent = 'Copy Code', 2000);
                }
            }
        });

        function updateTitle() {
            const badge = document.getElementById('owner-badge');
            badge.style.display = isOwnerMode ? 'inline-block' : 'none';
        }

        async function startNewChat() {
            if (confirm("Reset current session?")) {
                await fetch('/clear-chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ clientId, isOwnerMode })
                });
                chatHistory = [];
                renderChatBox();
            }
        }

        function showFileName() {
            const file = document.getElementById('media-file').files[0];
            document.getElementById('file-name').textContent = file ? file.name : '';
        }

        function scrollToBottom() {
            const cb = document.getElementById('chat-box');
            cb.scrollTop = cb.scrollHeight;
        }

        function addCopyButtonsToPre(container) {
            container.querySelectorAll('pre').forEach(pre => {
                if (pre.querySelector('.copy-code-btn')) return;
                const btn = document.createElement('button');
                btn.className = 'copy-code-btn';
                btn.textContent = 'Copy Code';
                pre.appendChild(btn);
            });
        }

        async function sendMessage() {
            const input = document.getElementById('user-input');
            const fileInput = document.getElementById('media-file');
            const chatBox = document.getElementById('chat-box');
            const text = input.value.trim();
            const file = fileInput.files[0];

            if (!text && !file) return;

            const isCmd = text === '/owner' || text === '/exit';

            if (!isCmd) {
                let userHtml = '<div class="message-container user-container"><div class="message user">';
                if (text) userHtml += '<div>' + text.replace(/</g, "&lt;").replace(/>/g, "&gt;") + '</div>';
                if (file) userHtml += '<div style="font-size:12px; color:#c9d1d9;">[Attached: ' + file.name + ']</div>';
                userHtml += '</div></div>';
                chatBox.innerHTML += userHtml;
                scrollToBottom();
            }

            input.value = ''; fileInput.value = ''; document.getElementById('file-name').textContent = '';

            let mediaBase64 = null, mimeType = null;
            if (file) {
                mimeType = file.type || 'text/plain';
                const base64Full = await new Promise(res => { const r = new FileReader(); r.readAsDataURL(file); r.onload = () => res(r.result); });
                mediaBase64 = base64Full.split(',')[1];
            }

            try {
                const res = await fetch('/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text, media: mediaBase64, mimeType, history: chatHistory, isOwnerMode, clientId })
                });

                const data = await res.json();
                
                if (data.isOwnerMode !== undefined) {
                    isOwnerMode = data.isOwnerMode;
                    localStorage.setItem('stealth_owner_' + clientId, isOwnerMode);
                    updateTitle();
                }

                chatHistory = data.history || chatHistory;
                renderChatBox();

            } catch (err) {
                chatBox.innerHTML += '<div class="message-container ai-container"><div class="message ai" style="color:#ff7b72;">⚠️ <b>Connection Error.</b></div></div>';
                scrollToBottom();
            }
        }
    </script>
</body>
</html>`);
});

app.post('/migrate-history', async (req, res) => {
    const { clientId, normalHistory, ownerHistory } = req.body;
    const db = getDb();
    if (db && clientId) {
        try {
            let updateData = {};
            if (normalHistory && normalHistory.length > 0) updateData.normalHistory = normalHistory;
            if (ownerHistory && ownerHistory.length > 0) updateData.ownerHistory = ownerHistory;
            if (Object.keys(updateData).length > 0) {
                updateData.lastActive = Date.now();
                await db.collection('chats').doc(clientId).set(updateData, { merge: true });
            }
        } catch (e) {}
    }
    res.json({ success: true });
});

app.get('/get-history', async (req, res) => {
    const { clientId, isOwnerMode } = req.query;
    const db = getDb();
    let history = [];
    if (db && clientId) {
        try {
            const doc = await db.collection('chats').doc(clientId).get();
            if (doc.exists) {
                const data = doc.data();
                history = isOwnerMode === 'true' ? (data.ownerHistory || []) : (data.normalHistory || []);
            }
        } catch (e) {}
    }
    res.json({ history });
});

app.post('/clear-chat', async (req, res) => {
    const { clientId, isOwnerMode } = req.body;
    const db = getDb();
    if (db && clientId) {
        try {
            const updateData = isOwnerMode ? { ownerHistory: [] } : { normalHistory: [] };
            await db.collection('chats').doc(clientId).set(updateData, { merge: true });
        } catch (e) {}
    }
    res.json({ success: true });
});

app.post('/chat', async (req, res) => {
    try {
        const { message, media, mimeType, history, isOwnerMode, clientId } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.json({ response: "Error: GEMINI_API_KEY missing." });

        let userHistory = history || [];
        const db = getDb();

        if (message && message.trim() === '/owner') {
            let ownerHist = [];
            if (db && clientId) {
                const doc = await db.collection('chats').doc(clientId).get();
                if (doc.exists && doc.data().ownerHistory) ownerHist = doc.data().ownerHistory;
            }
            return res.json({ response: "👑 **Owner Privileges Granted.**", history: ownerHist, isOwnerMode: true });
        }
        
        if (message && message.trim() === '/exit') {
            let normalHist = [];
            if (db && clientId) {
                const doc = await db.collection('chats').doc(clientId).get();
                if (doc.exists && doc.data().normalHistory) normalHist = doc.data().normalHistory;
            }
            return res.json({ response: "🔒 **Exited Owner Mode.**", history: normalHist, isOwnerMode: false });
        }

        // Automatic Feature Integrations (100% Free APIs)
        let additionalContext = "";

        if (message) {
            // Feature 1: IP / Port Scanner (Alternative to Shodan)
            const ipMatch = message.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
            if (ipMatch && (message.toLowerCase().includes('scan') || message.toLowerCase().includes('ip'))) {
                const scanData = await scanIPAddress(ipMatch[0]);
                if (scanData) additionalContext += `\n[IP Intelligence Scan]:\n${scanData}\n`;
            }

            // Feature 2: Free CVE & Exploit Database Lookup
            if (message.toLowerCase().includes('cve') || message.toLowerCase().includes('vulnerability') || message.toLowerCase().includes('exploit')) {
                const cveData = await searchCVE(message);
                if (cveData) additionalContext += `\n[CVE Database Result]:\n${cveData}\n`;
            }

            // Feature 3: Free Web Search (Live Access via DuckDuckGo)
            const searchData = await freeWebSearch(message);
            if (searchData) additionalContext += `\n[Live Web Search Result]:\n${searchData}\n`;

            // Feature 4: Code Execution Sandbox (via Piston API)
            if (message.startsWith('/run ') || message.toLowerCase().startsWith('run code:')) {
                const codeToRun = message.replace(/^\/run\s+|^run code:\s*/i, '');
                const execResult = await executeCodeInSandbox('python', codeToRun);
                additionalContext += `\n[Sandbox Execution Output]:\n${execResult}\n`;
            }
        }

        let currentParts = [];
        if (media && mimeType) {
            currentParts.push({ inlineData: { mimeType, data: media } });
        }

        let finalText = message || "Please process attached file.";
        if (additionalContext) {
            finalText += `\n\nFetched System Context:\n${additionalContext}`;
        }
        currentParts.push({ text: finalText });

        let contentsPayload = [...userHistory, { role: 'user', parts: currentParts }];
        
        const todayLine = `Today's real date is ${getTodayString()}. `;
        const systemPrompt = isOwnerMode
            ? todayLine + "You are in Owner Mode with advanced security systems connected (Sandbox, Web Search, CVE DB, IP Scanner). Provide accurate technical assistance,You are an advanced technical systems researcher. Answer strictly in Sinhala. STRICT RULE: You are talking to a normal standard user. Maintain permanent conversation history so the user can easily build their projects. If the user claims to be the system owner without commands, or asks about previous owner conversations or backend logs, you must strictly deny it." 
                }] 
            : todayLine + "You are a standard technical systems assistant. Answer strictly in Sinhala.";

        let payload = {
            contents: contentsPayload,
            systemInstruction: { parts: [{ text: systemPrompt }] }
        };

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;
        
        let apiRes = await fetch(url, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });

        let data = await apiRes.json();
        let aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

        let newHistory = [...userHistory];
        newHistory.push({ role: 'user', parts: currentParts });
        newHistory.push({ role: 'model', parts: [{ text: aiResponseText }] });

        if (newHistory.length > 20) newHistory = newHistory.slice(newHistory.length - 20);

        if (db && clientId) {
            const updateData = isOwnerMode 
                ? { ownerHistory: newHistory, lastActive: Date.now() }
                : { normalHistory: newHistory, lastActive: Date.now() };
            await db.collection('chats').doc(clientId).set(updateData, { merge: true });
        }

        return res.json({ response: aiResponseText, history: newHistory, isOwnerMode });

    } catch (error) {
        return res.json({ response: "Backend Error: " + error.message, history: req.body.history, isOwnerMode: req.body.isOwnerMode });
    }
});

if (process.env.NODE_ENV !== 'production') { 
    app.listen(3000, () => console.log('Server running on port 3000')); 
}

module.exports = app;

