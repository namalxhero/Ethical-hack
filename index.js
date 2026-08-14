const express = require('express');
const admin = require('firebase-admin');

const app = express();

const fetchFn = global.fetch || ((...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args)));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

function getDb() {
    try {
        if (!admin.apps.length) {
            const envJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
            if (!envJson) return null;

            const serviceAccount = JSON.parse(envJson);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }
        return admin.firestore();
    } catch (error) {
        console.error("Firebase init error:", error.message);
        return null;
    }
}

function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
    return Promise.race([
        fetchFn(url, options),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeoutMs))
    ]);
}

// Web Search Function
async function freeWebSearch(query) {
    let results = [];
    try {
        const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const ddgRes = await fetchWithTimeout(ddgUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        }, 4000);

        if (ddgRes.ok) {
            const htmlText = await ddgRes.text();
            const snippetRegex = /<a class="result__snippet[^">]*">([\s\S]*?)<\/a>/g;
            let match;
            let count = 0;
            while ((match = snippetRegex.exec(htmlText)) !== null && count < 3) {
                const cleanSnippet = match[1].replace(/<[^>]*>/g, '').trim();
                if (cleanSnippet) {
                    results.push(`- ${cleanSnippet}`);
                    count++;
                }
            }
        }
    } catch (err) {
        console.error("DuckDuckGo error:", err.message);
    }

    if (results.length > 0) return results.join("\n");

    // Wikipedia Fallback
    try {
        const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json`;
        const wikiRes = await fetchWithTimeout(wikiUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, 3000);
        const wikiData = await wikiRes.json();
        if (wikiData?.query?.search && wikiData.query.search.length > 0) {
            wikiData.query.search.slice(0, 2).forEach(item => {
                results.push(`- ${item.title}: ${item.snippet.replace(/<[^>]*>/g, '')}`);
            });
        }
    } catch (e) {
        console.error("Wikipedia error:", e.message);
    }

    return results.length > 0 ? results.join("\n") : null;
}

async function executeCodeInSandbox(language, code) {
    try {
        const res = await fetchWithTimeout('https://emkc.org/api/v2/piston/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: language || 'python', version: '*', files: [{ content: code }] })
        }, 4000);
        const data = await res.json();
        return data?.run?.output || data?.run?.stderr || "Executed with no output.";
    } catch (e) {
        return "Code execution service failed.";
    }
}

async function searchCVE(query) {
    try {
        const res = await fetchWithTimeout(`https://cve.circl.lu/api/search/${encodeURIComponent(query)}`, {}, 4000);
        const data = await res.json();
        if (!Array.isArray(data) || !data.length) return null;
        return data.slice(0, 3).map(item => `• ${item.id}: ${item.summary || ''}`).join("\n");
    } catch (e) { return null; }
}

async function scanIPAddress(ip) {
    try {
        const res = await fetchWithTimeout(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,isp,org,as,query`, {}, 3000);
        const data = await res.json();
        if (data.status !== 'success') return null;
        return `• IP: ${data.query}\n• Country: ${data.country}\n• ISP: ${data.isp}`;
    } catch (e) { return null; }
}

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
        
        /* Live Status Indicator for Search */
        #status-bar { padding: 6px 20px; font-size: 12.5px; color: #58a6ff; background: #161b22; border-top: 1px solid #30363d; display: none; align-items: center; gap: 8px; }
        .spinner { width: 12px; height: 12px; border: 2px solid #58a6ff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

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
    <div id="status-bar"><div class="spinner"></div><span id="status-text">Searching the web...</span></div>
    <div id="input-area">
        <label for="media-file" class="file-btn">📎</label>
        <input type="file" id="media-file" accept="image/*,video/*,.txt,.py,.js,.json" onchange="showFileName()">
        <span id="file-name"></span>
        <input type="text" id="user-input" placeholder="Type your message here..." onkeydown="if(event.key === 'Enter'){ sendMessage(); }">
        <button class="send-btn" onclick="sendMessage()">Send</button>
    </div>

    <script>
        let clientId = localStorage.getItem('stealth_client_id') || 'client_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('stealth_client_id', clientId);
        let isOwnerMode = localStorage.getItem('stealth_owner_' + clientId) === 'true';
        let chatHistory = [];

        document.addEventListener("DOMContentLoaded", async () => {
            await loadHistoryFromFirebase();
            updateTitle();
        });

        async function loadHistoryFromFirebase() {
            try {
                const res = await fetch('/get-history?clientId=' + encodeURIComponent(clientId) + '&isOwnerMode=' + isOwnerMode);
                const data = await res.json();
                if (data.history && Array.isArray(data.history)) chatHistory = data.history;
            } catch (e) { console.error(e); }
            renderChatBox();
        }

        function escapeHtml(str) {
            return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }

        function renderChatBox() {
            const chatBox = document.getElementById('chat-box');
            let html = '<div class="message-container ai-container"><div class="message ai">' + (isOwnerMode ? '👑 Owner Mode Active.' : 'System Online. Ready.') + '</div></div>';

            chatHistory.forEach(msg => {
                const isUser = msg.role === 'user';
                let textContent = "";
                if (Array.isArray(msg.parts)) {
                    textContent = msg.parts.map(p => p.text || "").filter(Boolean).join("\\n");
                }
                if (isUser) {
                    html += '<div class="message-container user-container"><div class="message user"><div>' + escapeHtml(textContent) + '</div></div></div>';
                } else {
                    html += '<div class="message-container ai-container"><div class="message ai">' + marked.parse(textContent || '') + '</div><button class="copy-msg-btn" data-text="' + escapeHtml(textContent) + '">Copy Response</button></div>';
                }
            });

            chatBox.innerHTML = html;
            chatBox.querySelectorAll('.message.ai').forEach(aiDiv => addCopyButtonsToPre(aiDiv));
            scrollToBottom();
        }

        document.getElementById('chat-box').addEventListener('click', function(e) {
            if (e.target.classList.contains('copy-msg-btn')) {
                navigator.clipboard.writeText(e.target.getAttribute('data-text') || '');
                e.target.textContent = 'Copied Text!';
                setTimeout(() => e.target.textContent = 'Copy Response', 2000);
            }
            if (e.target.classList.contains('copy-code-btn')) {
                const pre = e.target.closest('pre');
                if (pre) {
                    const clone = pre.cloneNode(true);
                    if (clone.querySelector('.copy-code-btn')) clone.querySelector('.copy-code-btn').remove();
                    navigator.clipboard.writeText(clone.textContent.trim());
                    e.target.textContent = 'Copied!';
                    setTimeout(() => e.target.textContent = 'Copy Code', 2000);
                }
            }
        });

        function updateTitle() {
            document.getElementById('owner-badge').style.display = isOwnerMode ? 'inline-block' : 'none';
        }

        async function startNewChat() {
            if (confirm("Reset current session?")) {
                await fetch('/clear-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId, isOwnerMode }) });
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

        function showStatus(text) {
            document.getElementById('status-text').textContent = text;
            document.getElementById('status-bar').style.display = 'flex';
        }

        function hideStatus() {
            document.getElementById('status-bar').style.display = 'none';
        }

        async function sendMessage() {
            const input = document.getElementById('user-input');
            const fileInput = document.getElementById('media-file');
            const chatBox = document.getElementById('chat-box');
            const text = input.value.trim();
            const file = fileInput.files[0];

            if (!text && !file) return;

            let mediaBase64 = null, mimeType = null;
            if (file) {
                if (file.size > 4 * 1024 * 1024) return alert("File size too large! Max 4MB.");
                mimeType = file.type || 'text/plain';
                const base64Full = await new Promise(res => {
                    const r = new FileReader();
                    r.readAsDataURL(file);
                    r.onload = () => res(r.result);
                    r.onerror = () => res(null);
                });
                if (!base64Full) return alert("Failed to read the file.");
                mediaBase64 = base64Full.split(',')[1];
            }

            let currentParts = [];
            if (mediaBase64 && mimeType) currentParts.push({ inline_data: { mime_type: mimeType, data: mediaBase64 } });
            
            let finalText = text || "Please process attached file.";
            if (file) finalText += " [Attached: " + file.name + "]";
            currentParts.push({ text: finalText });

            input.value = '';
            fileInput.value = '';
            document.getElementById('file-name').textContent = '';

            let historyToSend = [...chatHistory];   
            chatHistory.push({ role: 'user', parts: currentParts });
            renderChatBox();

            // Show live status indicator if looking like a search query
            showStatus("Processing query...");

            try {
                const res = await fetch('/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text, media: mediaBase64, mimeType, history: historyToSend, isOwnerMode, clientId })
                });

                const data = await res.json();
                hideStatus();

                if (data.isOwnerMode !== undefined) {
                    isOwnerMode = data.isOwnerMode;
                    localStorage.setItem('stealth_owner_' + clientId, String(isOwnerMode));
                    updateTitle();
                }

                if (data.response && data.response.startsWith("Backend Error")) {
                    chatBox.innerHTML += '<div class="message-container ai-container"><div class="message ai" style="color:#ff7b72;">⚠️ <b>' + escapeHtml(data.response) + '</b></div></div>';
                    scrollToBottom();
                    chatHistory.pop();
                    return;
                }

                if (Array.isArray(data.history)) chatHistory = data.history;
                renderChatBox();
            } catch (err) {
                hideStatus();
                chatBox.innerHTML += '<div class="message-container ai-container"><div class="message ai" style="color:#ff7b72;">⚠️ <b>Connection Error: ' + escapeHtml(err.message) + '</b></div></div>';
                chatHistory.pop();
                scrollToBottom();
            }
        }
    </script>
</body>
</html>`);
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

        if (!apiKey) return res.json({ response: "Backend Error: GEMINI_API_KEY missing.", history: history || [], isOwnerMode });

        const userHistory = Array.isArray(history) ? history : [];
        const db = getDb();

        if (message && message.trim() === '/owner') {
            let ownerHist = [];
            if (db && clientId) {
                const doc = await db.collection('chats').doc(clientId).get();
                if (doc.exists && Array.isArray(doc.data().ownerHistory)) ownerHist = doc.data().ownerHistory;
            }
            return res.json({ response: "👑 Owner Privileges Granted.", history: ownerHist, isOwnerMode: true });
        }

        if (message && message.trim() === '/exit') {
            let normalHist = [];
            if (db && clientId) {
                const doc = await db.collection('chats').doc(clientId).get();
                if (doc.exists && Array.isArray(doc.data().normalHistory)) normalHist = doc.data().normalHistory;
            }
            return res.json({ response: "🔒 Exited Owner Mode.", history: normalHist, isOwnerMode: false });
        }

        let additionalContext = "";
        if (message) {
            const msgLower = message.toLowerCase();
            const tasks = [];

            const ipMatch = message.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
            if (ipMatch && (msgLower.includes('scan') || msgLower.includes('ip'))) {
                tasks.push(scanIPAddress(ipMatch[0]).then(res => res ? "\n[IP Info]:\n" + res + "\n" : ""));
            }
            if (msgLower.includes('cve') || msgLower.includes('vulnerability')) {
                tasks.push(searchCVE(message).then(res => res ? "\n[CVE DB]:\n" + res + "\n" : ""));
            }
            if (msgLower.startsWith('/run ') || msgLower.startsWith('run code:')) {
                tasks.push(executeCodeInSandbox('python', message.replace(/^\/run\s+|^run code:\s*/i, '')).then(res => res ? "\n[Sandbox Out]:\n" + res + "\n" : ""));
            }

            // SMART TRIGGER: Only web search if the query explicitly needs current facts, news, latest details, or is an informational question that needs web data
            const needsSearch = /search|what is|who is|latest|news|today|how to|aluth|mokakda|kohomada|price|version|release|current|weather|who|when|where/i.test(msgLower) || message.length > 15;
            
            if (needsSearch && !msgLower.startsWith('hi') && !msgLower.startsWith('hello') && !msgLower.startsWith('ela')) {
                const searchRes = await freeWebSearch(message);
                if (searchRes) additionalContext += "\n[Live Web Search Result]:\n" + searchRes + "\n";
            }
        }

        const currentParts = [];
        if (media && mimeType) currentParts.push({ inline_data: { mime_type: mimeType, data: media } });
        
        let finalText = message || "Please process attached file.";
        if (additionalContext) finalText += "\n\nVerified External Data:\n" + additionalContext;
        currentParts.push({ text: finalText });

        const sanitizedHistory = userHistory.map(item => {
            if (!item || !Array.isArray(item.parts)) return null;
            const cleanParts = item.parts.map(part => {
                if (part.text) return { text: part.text };
                if (part.inline_data && part.inline_data.data) return { inline_data: { mime_type: part.inline_data.mime_type, data: part.inline_data.data } };
                return null;
            }).filter(Boolean);
            return cleanParts.length ? { role: item.role, parts: cleanParts } : null;
        }).filter(Boolean);

        const contentsPayload = [...sanitizedHistory, { role: 'user', parts: currentParts }];
        const todayLine = "Today's real date is " + getTodayString() + ". ";

        const systemPrompt = isOwnerMode
            ? todayLine + "You are in Owner Mode. Advanced technical systems and tactical guide. Do not rush to write code unless asked."
            : todayLine + "You are a technical assistant. Answer strictly in Sinhala based on verified data.";

        const payload = {
            contents: contentsPayload,
            systemInstruction: { parts: [{ text: systemPrompt }] },
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
        };

        const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=" + apiKey;

        const apiRes = await fetchFn(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await apiRes.json();
        if (!apiRes.ok) throw new Error(data.error?.message || "Gemini API failed");

        let aiResponseText = "No response generated.";
        const parts = data?.candidates?.[0]?.content?.parts;
        if (Array.isArray(parts) && parts.length) {
            aiResponseText = parts.map(p => p.text || "").join("").trim();
        }

        let newHistory = [...userHistory];
        newHistory.push({ role: 'user', parts: currentParts });
        newHistory.push({ role: 'model', parts: [{ text: aiResponseText }] });
        if (newHistory.length > 20) newHistory = newHistory.slice(newHistory.length - 20);

        if (db && clientId) {
            const updateData = isOwnerMode ? { ownerHistory: newHistory, lastActive: Date.now() } : { normalHistory: newHistory, lastActive: Date.now() };
            await db.collection('chats').doc(clientId).set(updateData, { merge: true });
        }

        return res.json({ response: aiResponseText, history: newHistory, isOwnerMode });

    } catch (error) {
        return res.json({ response: "Backend Error: " + error.message, history: req.body.history || [], isOwnerMode: req.body.isOwnerMode });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(3000, () => console.log('Server running on port 3000'));
}

module.exports = app;
