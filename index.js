const express = require('express');
const admin = require('firebase-admin');

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Firebase Setup (Optional - දැන් Browser එකෙත් සේව් වෙන නිසා මේක නැතත් වැඩ)
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
    <title>Stealth Tech AI - Super Memory Edition</title>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <style>
        :root { --bg-color: #0d1117; --chat-bg: #161b22; --user-msg: #238636; --ai-msg: #21262d; --text-main: #e6edf3; --accent: #2ea043; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: var(--bg-color); color: var(--text-main); display: flex; flex-direction: column; height: 100vh; margin: 0; }
        #header { display: flex; justify-content: space-between; align-items: center; padding: 15px 25px; background: rgba(22, 27, 34, 0.8); backdrop-filter: blur(10px); border-bottom: 1px solid #30363d; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        #header h2 { margin: 0; font-size: 18px; font-weight: 600; color: #58a6ff; }
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
        .message img, .message video { max-width: 300px; border-radius: 8px; margin-top: 8px; }
        #input-area { display: flex; padding: 15px 25px; background: var(--chat-bg); border-top: 1px solid #30363d; gap: 12px; align-items: center; }
        input[type="text"] { flex: 1; padding: 14px 20px; border-radius: 25px; border: 1px solid #30363d; background: #0d1117; color: var(--text-main); outline: none; font-size: 14.5px; }
        input[type="file"] { display: none; }
        .file-btn { background: #21262d; color: #8b949e; padding: 12px; border-radius: 50%; cursor: pointer; border: 1px solid #30363d; width: 24px; height: 24px; display: flex; justify-content: center; align-items: center; }
        button.send-btn { background: var(--accent); color: #fff; border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer; font-weight: 600; font-size: 14px; }
        #file-name { font-size: 12px; color: #8b949e; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    </style>
</head>
<body>
    <div id="header">
        <h2>✨ Stealth Tech AI (Context Aware)</h2>
        <div class="header-right">
            <button class="new-chat-btn" onclick="startNewChat()">Clear Chat</button>
        </div>
    </div>
    <div id="chat-box"><div class="message ai">System Online. Code execution ready.</div></div>
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
        
        // ⚡ FRONTEND MEMORY: Vercel එක restart වුණත් Browser එකේ මතකය තියාගන්නවා
        let chatHistory = JSON.parse(localStorage.getItem('stealth_history_' + clientId)) || [];

        document.addEventListener("DOMContentLoaded", async () => {
            const savedHtml = localStorage.getItem('stealth_html_' + clientId);
            if (savedHtml) {
                document.getElementById('chat-box').innerHTML = savedHtml;
                addCopyButtons(document.getElementById('chat-box'));
                scrollToBottom();
            }
        });

        async function startNewChat() {
            if (confirm("Reset current session and wipe memory?")) {
                localStorage.removeItem('stealth_history_' + clientId);
                localStorage.removeItem('stealth_html_' + clientId);
                chatHistory = [];
                location.reload();
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

        function addCopyButtons(container) {
            container.querySelectorAll('pre').forEach(pre => {
                if (pre.querySelector('.copy-code-btn')) return;
                const btn = document.createElement('button');
                btn.className = 'copy-code-btn';
                btn.textContent = 'Copy';
                btn.onclick = () => {
                    const text = pre.cloneNode(true);
                    if(text.querySelector('.copy-code-btn')) text.querySelector('.copy-code-btn').remove();
                    navigator.clipboard.writeText(text.textContent.trim());
                    btn.textContent = 'Copied!';
                    setTimeout(() => btn.textContent = 'Copy', 2000);
                };
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

            let userHtml = '<div class="message user">';
            if (text) userHtml += '<div>' + text.replace(/</g, "&lt;").replace(/>/g, "&gt;") + '</div>';

            let mediaBase64 = null, mimeType = null;
            if (file) {
                mimeType = file.type || 'text/plain';
                const base64Full = await new Promise(res => { const r = new FileReader(); r.readAsDataURL(file); r.onload = () => res(r.result); });
                mediaBase64 = base64Full.split(',')[1];
                if (mimeType.startsWith('image/')) userHtml += '<img src="' + base64Full + '">';
                else userHtml += '<div style="font-size:12px; color:#c9d1d9;">[Attached: ' + file.name + ']</div>';
            }
            userHtml += '</div>';
            chatBox.innerHTML += userHtml;
            scrollToBottom();
            
            input.value = ''; fileInput.value = ''; document.getElementById('file-name').textContent = '';

            try {
                const res = await fetch('/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    // ⚡ බ්‍රවුසරේ තියෙන පරණ මතකය (chatHistory) Backend එකට යවනවා!
                    body: JSON.stringify({ message: text, media: mediaBase64, mimeType, history: chatHistory })
                });
                const data = await res.json();
                
                // ⚡ Backend එකෙන් එන අලුත් මතකය බ්‍රවුසරේ සේව් කරගන්නවා
                chatHistory = data.history || chatHistory;
                localStorage.setItem('stealth_history_' + clientId, JSON.stringify(chatHistory));
                
                const aiDiv = document.createElement('div');
                aiDiv.className = 'message ai';
                aiDiv.innerHTML = marked.parse(data.response || "Error generating response.");
                addCopyButtons(aiDiv);
                chatBox.appendChild(aiDiv);
                scrollToBottom();

                localStorage.setItem('stealth_html_' + clientId, chatBox.innerHTML);
            } catch (err) {
                chatBox.innerHTML += '<div class="message ai" style="color:#ff7b72;">Network error.</div>';
                scrollToBottom();
            }
        }
    </script>
</body>
</html>`);
});

app.post('/chat', async (req, res) => {
    try {
        const { message, media, mimeType, history } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.json({ response: "Error: GEMINI_API_KEY missing from environment variables." });

        let userHistory = history || []; // Frontend එකෙන් එන මතකය ගන්නවා
        
        let currentParts = [];
        if (media && mimeType) {
            currentParts.push({ inlineData: { mimeType, data: media } });
        }
        if (message) {
            currentParts.push({ text: message });
        } else {
            currentParts.push({ text: "Please process the attached file." });
        }

        // පරණ මතකයයි අලුත් මැසේජ් එකයි එකතු කරනවා
        let contentsPayload = [...userHistory, { role: 'user', parts: currentParts }];

        // ⚡ ප්‍රබල System Instruction එක ආයෙත් දැම්මා (Rules කඩන්නේ නැතුව)
        const payload = {
            contents: contentsPayload,
            systemInstruction: { 
                parts: [{ 
                    text: "You are an advanced, highly technical systems researcher and script generator. You operate on strict technical logic. You must ALWAYS answer in Sinhala. Your purpose is to provide highly detailed, functional code snippets, troubleshooting, and network mechanics EXACTLY as requested. Use pure technical language. CRITICAL RULE: ALWAYS retain the context of previously generated scripts in the conversation history. If the user says something like 'oke moko wenne', 'meka wada na', or asks about a script, YOU MUST look at the immediately preceding chat history and code blocks and explain it accurately. Never act like you forgot the previous code." 
                }] 
            }
        };

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;
        
        let apiRes = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        let data = await apiRes.json();

        let aiResponseText = "No response generated.";
        if (data.candidates?.[0]?.content?.parts) {
            const textParts = data.candidates[0].content.parts.filter(p => p.text).map(p => p.text);
            if (textParts.length > 0) aiResponseText = textParts.join("\n");
        }

        // ⚡ මතකය අප්ඩේට් කිරීම (පින්තූර අයින් කරලා text විතරක් තියාගන්නවා token ඉතුරු වෙන්න)
        let newHistory = [...userHistory, { role: 'user', parts: currentParts }];
        newHistory.push({ role: 'model', parts: [{ text: aiResponseText }] });

        newHistory = newHistory.map(msg => {
            return {
                role: msg.role,
                parts: msg.parts.map(p => {
                    if (p.text) return { text: p.text };
                    if (p.inlineData) return { text: "[Media file attached previously]" };
                    return p;
                })
            };
        });

        // මැසේජ් 20 කට වඩා වැඩිනම් පරණම ඒවා කපලා දානවා
        if (newHistory.length > 20) newHistory = newHistory.slice(newHistory.length - 20);
        while (newHistory.length > 0 && newHistory[0].role !== 'user') newHistory.shift();

        // AI Response එකයි, අලුත් මතකයයි දෙකම Client එකට යවනවා!
        return res.json({ response: aiResponseText, history: newHistory });

    } catch (error) {
        return res.json({ response: "Fatal Error: " + error.message, history: req.body.history });
    }
});

if (process.env.NODE_ENV !== 'production') { 
    app.listen(3000, () => console.log('Server running on port 3000')); 
}

module.exports = app;
