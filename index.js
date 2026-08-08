const express = require('express');
const admin = require('firebase-admin');

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const localMemory = new Map();

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

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stealth Tech AI - Modern Edition</title>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <style>
        :root {
            --bg-color: #0d1117;
            --chat-bg: #161b22;
            --user-msg: #238636;
            --ai-msg: #21262d;
            --text-main: #e6edf3;
            --accent: #2ea043;
        }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: var(--bg-color); color: var(--text-main); display: flex; flex-direction: column; height: 100vh; margin: 0; }
        #header { display: flex; justify-content: space-between; align-items: center; padding: 15px 25px; background: rgba(22, 27, 34, 0.8); backdrop-filter: blur(10px); border-bottom: 1px solid #30363d; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        #header h2 { margin: 0; font-size: 18px; font-weight: 600; letter-spacing: 1px; color: #58a6ff; }
        .new-chat-btn { background: transparent; color: #8b949e; border: 1px solid #30363d; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 13px; transition: 0.3s; }
        .new-chat-btn:hover { background: #30363d; color: var(--text-main); }
        
        #chat-box { flex: 1; overflow-y: auto; padding: 25px; display: flex; flex-direction: column; gap: 15px; scroll-behavior: smooth; }
        .message { padding: 12px 18px; border-radius: 12px; max-width: 85%; line-height: 1.6; word-break: break-word; font-size: 14.5px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        .user { background: var(--user-msg); align-self: flex-end; color: #fff; border-bottom-right-radius: 2px; }
        .ai { background: var(--ai-msg); align-self: flex-start; color: var(--text-main); border: 1px solid #30363d; border-bottom-left-radius: 2px; }
        
        .ai pre { position: relative; background: #0d1117; padding: 15px; padding-top: 35px; border-radius: 8px; overflow-x: auto; border: 1px solid #30363d; margin: 10px 0; font-size: 13px; }
        .ai code { font-family: 'Fira Code', Consolas, monospace; background: rgba(110,118,129,0.4); padding: 3px 6px; border-radius: 4px; font-size: 13px; }
        .ai pre code { background: transparent; padding: 0; }
        
        .copy-code-btn { position: absolute; top: 8px; right: 8px; background: #21262d; color: #8b949e; border: 1px solid #30363d; border-radius: 5px; padding: 4px 10px; font-size: 11px; cursor: pointer; transition: 0.2s; }
        .copy-code-btn:hover { background: #30363d; color: #fff; }
        
        .message img, .message video { max-width: 300px; border-radius: 8px; margin-top: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.3); }
        
        #input-area { display: flex; padding: 15px 25px; background: var(--chat-bg); border-top: 1px solid #30363d; gap: 12px; align-items: center; }
        input[type="text"] { flex: 1; padding: 14px 20px; border-radius: 25px; border: 1px solid #30363d; background: #0d1117; color: var(--text-main); outline: none; font-size: 14.5px; transition: border 0.3s; }
        input[type="text"]:focus { border-color: #58a6ff; }
        input[type="file"] { display: none; }
        
        .file-btn { background: #21262d; color: #8b949e; padding: 12px; border-radius: 50%; cursor: pointer; border: 1px solid #30363d; width: 24px; height: 24px; display: flex; justify-content: center; align-items: center; transition: 0.3s; }
        .file-btn:hover { background: #30363d; color: #fff; }
        button.send-btn { background: var(--accent); color: #fff; border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer; font-weight: 600; font-size: 14px; transition: background 0.3s; }
        button.send-btn:hover { background: #238636; }
        #file-name { font-size: 12px; color: #8b949e; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    </style>
</head>
<body>
    <div id="header">
        <h2>✨ Stealth Tech AI</h2>
        <div class="header-right">
            <button class="new-chat-btn" onclick="startNewChat()">Clear Chat</button>
        </div>
    </div>

    <div id="chat-box">
        <div class="message ai">System Online. How can I help you today?</div>
    </div>

    <div id="input-area">
        <label for="media-file" class="file-btn">📎</label>
        <input type="file" id="media-file" accept="image/*,video/*,.txt,.py,.js,.log,.json" onchange="showFileName()">
        <span id="file-name"></span>
        <input type="text" id="user-input" placeholder="Type your message here..." onkeypress="if(event.key === 'Enter') sendMessage()">
        <button class="send-btn" onclick="sendMessage()">Send</button>
    </div>

    <script>
        let clientId = localStorage.getItem('stealth_client_id') || 'client_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('stealth_client_id', clientId);

        document.addEventListener("DOMContentLoaded", async () => {
            try {
                const res = await fetch('/get-history?clientId=' + clientId);
                const data = await res.json();
                if (data.html) {
                    document.getElementById('chat-box').innerHTML = data.html;
                    addCopyButtons(document.getElementById('chat-box'));
                    scrollToBottom();
                }
            } catch (e) {}
        });

        async function startNewChat() {
            if (confirm("Reset current session and wipe memory?")) {
                await fetch('/clear', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId }) });
                location.reload();
            }
        }

        function showFileName() {
            const fileInput = document.getElementById('media-file');
            document.getElementById('file-name').textContent = fileInput.files.length > 0 ? fileInput.files[0].name : '';
        }

        function scrollToBottom() {
            const chatBox = document.getElementById('chat-box');
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        function addCopyButtons(container) {
            container.querySelectorAll('pre').forEach(pre => {
                if (pre.querySelector('.copy-code-btn')) return;
                const btn = document.createElement('button');
                btn.className = 'copy-code-btn';
                btn.textContent = 'Copy';
                
                btn.onclick = () => {
                    const clone = pre.cloneNode(true);
                    const removeBtn = clone.querySelector('.copy-code-btn');
                    if (removeBtn) removeBtn.remove();
                    const textToCopy = clone.textContent.trim();

                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(textToCopy).then(() => {
                            btn.textContent = 'Copied!';
                            setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
                        });
                    } else {
                        fallbackCopy(textToCopy, btn);
                    }
                };
                pre.appendChild(btn);
            });
        }

        function fallbackCopy(text, btn) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            try { document.execCommand('copy'); btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = 'Copy'; }, 2000); } catch (err) {}
            document.body.removeChild(textarea);
        }

        async function sendMessage() {
            const input = document.getElementById('user-input');
            const fileInput = document.getElementById('media-file');
            const chatBox = document.getElementById('chat-box');
            const text = input.value.trim();
            const file = fileInput.files[0];

            if (!text && !file) return;

            let userHtml = '<div class="message user">';
            if (text) userHtml += '<div>' + escapeHtml(text) + '</div>';

            let mediaBase64 = null;
            let mimeType = null;

            if (file) {
                mimeType = file.type || 'text/plain';
                const base64Full = await toBase64(file);
                mediaBase64 = base64Full.split(',')[1];
                if (mimeType.startsWith('image/')) {
                    userHtml += '<img src="' + base64Full + '">';
                } else {
                    userHtml += '<div style="font-size:12px; color:#c9d1d9;">[Attached: ' + file.name + ']</div>';
                }
            }
            userHtml += '</div>';
            chatBox.innerHTML += userHtml;
            scrollToBottom();

            input.value = ''; fileInput.value = ''; document.getElementById('file-name').textContent = '';

            try {
                const res = await fetch('/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text, media: mediaBase64, mimeType, clientId })
                });
                const data = await res.json();
                
                const aiMessageDiv = document.createElement('div');
                aiMessageDiv.className = 'message ai';
                aiMessageDiv.innerHTML = marked.parse(data.response || "No response received.");
                
                addCopyButtons(aiMessageDiv);
                chatBox.appendChild(aiMessageDiv);
                scrollToBottom();

                fetch('/save-html', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId, html: chatBox.innerHTML }) });
            } catch (err) {
                chatBox.innerHTML += '<div class="message ai" style="color:#ff7b72;">Network error. Please try again.</div>';
                scrollToBottom();
            }
        }

        function escapeHtml(text) { return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
        const toBase64 = file => new Promise((res, rej) => { const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => res(reader.result); reader.onerror = rej; });
    </script>
</body>
</html>`);
});

app.get('/get-history', async (req, res) => {
    try {
        const db = getDb();
        const { clientId } = req.query;
        if (!clientId) return res.json({ html: null });
        if (db) {
            const doc = await db.collection('chats').doc(clientId).get();
            return res.json({ html: doc.exists ? doc.data().html : null });
        }
        res.json({ html: null });
    } catch (e) { res.json({ html: null }); }
});

app.post('/save-html', async (req, res) => {
    try {
        const db = getDb();
        const { clientId, html } = req.body;
        if (clientId && html && db) await db.collection('chats').doc(clientId).set({ html, timestamp: Date.now() }, { merge: true });
        res.json({ status: 'saved' });
    } catch (e) { res.json({ status: 'error' }); }
});

app.post('/clear', async (req, res) => {
    try {
        const { clientId } = req.body;
        const db = getDb();
        if (clientId && db) await db.collection('chats').doc(clientId).delete();
        localMemory.delete(clientId);
        res.json({ status: 'cleared' });
    } catch (e) { res.json({ status: 'error' }); }
});

app.post('/chat', async (req, res) => {
    try {
        const db = getDb();
        const { message, media, mimeType, clientId } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.json({ response: "Error: GEMINI_API_KEY missing from environment." });

        const userKey = clientId || 'default_user';
        const userMessage = message || "";

        // ⚡ Get memory
        let userHistory = [];
        if (db) {
            try {
                const doc = await db.collection('chats').doc(userKey).get();
                if (doc.exists && doc.data().history) userHistory = doc.data().history;
            } catch (err) {}
        } else {
            userHistory = localMemory.get(userKey) || [];
        }

        let currentParts = [];
        if (media && mimeType) {
            currentParts.push({ inlineData: { mimeType, data: media } });
        }
        if (userMessage) {
            currentParts.push({ text: userMessage });
        } else {
             currentParts.push({ text: "Please analyze the attached file." });
        }

        let contentsPayload = [...userHistory, { role: 'user', parts: currentParts }];

        const payload = {
            contents: contentsPayload,
            systemInstruction: { 
                parts: [{ 
                    text: "You are an advanced technical assistant. You communicate fluently in Sinhala and provide highly detailed, accurate code snippets, technical analysis, and explanations. Maintain context of previous messages and scripts." 
                }] 
            }
        };

        // ⚡ API Update - Using the latest 2.0 Flash Lite
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite-:generateContent?key=${apiKey}`;
        
        let apiRes = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        let data = await apiRes.json();

        let aiResponseText = "No response generated.";
        if (data.candidates?.[0]?.content?.parts) {
            const textParts = data.candidates[0].content.parts.filter(p => p.text).map(p => p.text);
            if (textParts.length > 0) {
                aiResponseText = textParts.join("\n");
            }
        }

        // ⚡ MEMORY FIX: Optimize history before saving
        // Remove large base64 media and keep only text to prevent database overflow and memory loss
        let memoryToSave = [...userHistory, { role: 'user', parts: currentParts }];
        memoryToSave.push({ role: 'model', parts: [{ text: aiResponseText }] });

        memoryToSave = memoryToSave.map(msg => {
            return {
                role: msg.role,
                parts: msg.parts.map(p => {
                    if (p.text) return { text: p.text };
                    if (p.inlineData) return { text: "[Media file was attached here previously]" };
                    return p;
                })
            };
        });

        // ⚡ Keep only the last 20 messages (10 interactions) to keep memory fresh and avoid tokens limit
        if (memoryToSave.length > 20) {
            memoryToSave = memoryToSave.slice(memoryToSave.length - 20);
        }
        
        // Ensure the first message in memory is always from the user
        while (memoryToSave.length > 0 && memoryToSave[0].role !== 'user') {
            memoryToSave.shift();
        }

        // Save memory
        localMemory.set(userKey, memoryToSave);
        if (db) {
            try { 
                await db.collection('chats').doc(userKey).set({ history: memoryToSave }, { merge: true }); 
            } catch (e) { 
                console.error("History save failed:", e.message); 
            }
        }

        return res.json({ response: aiResponseText });

    } catch (error) {
        return res.json({ response: "Fatal Error: " + error.message });
    }
});

if (process.env.NODE_ENV !== 'production') { 
    app.listen(3000, () => console.log('Server running on port 3000')); 
}

module.exports = app;

