const express = require('express');

const app = express();
app.use(express.json({ limit: '15mb' }));

app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="si">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ethical Hacking AI Bot</title>
    <style>
        body { font-family: 'Courier New', Courier, monospace; background: #0d1117; color: #58a6ff; display: flex; flex-direction: column; height: 100vh; margin: 0; justify-content: space-between; }
        #header { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background: #161b22; border-bottom: 1px solid #30363d; }
        #header h2 { margin: 0; font-size: 18px; color: #3fb950; }
        .new-chat-btn { background: #21262d; color: #c9d1d9; border: 1px solid #30363d; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; }
        .new-chat-btn:hover { background: #30363d; color: #58a6ff; }
        #chat-box { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px; }
        .message { padding: 12px 16px; border-radius: 8px; max-width: 80%; line-height: 1.5; word-break: break-word; font-size: 14px; }
        .user { background: #1f6feb; align-self: flex-end; color: white; }
        .ai { background: #161b22; align-self: flex-start; color: #c9d1d9; border: 1px solid #30363d; }
        .ai pre { background: #0d1117; padding: 10px; border-radius: 5px; overflow-x: auto; color: #7ee787; }
        .message img, .message video { max-width: 200px; border-radius: 6px; margin-top: 5px; display: block; }
        #input-area { display: flex; padding: 15px; background: #161b22; border-top: 1px solid #30363d; gap: 10px; align-items: center; }
        input[type="text"] { flex: 1; padding: 12px; border-radius: 6px; border: 1px solid #30363d; background: #0d1117; color: white; outline: none; padding-left: 15px; font-family: monospace; }
        input[type="file"] { display: none; }
        .file-btn { background: #21262d; color: #3fb950; padding: 10px 12px; border-radius: 6px; cursor: pointer; border: 1px solid #30363d; text-align: center; }
        button.send-btn { background: #238636; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; }
        button.send-btn:hover { background: #2ea043; }
        #file-name { font-size: 11px; color: #8b949e; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    </style>
</head>
<body>
    <div id="header">
        <h2>🛡️ Ethical Hacking & Security AI</h2>
        <button class="new-chat-btn" onclick="startNewChat()">⚡ Clear Session</button>
    </div>

    <div id="chat-box">
        <div class="message ai">Hello Hacker! I am your Ethical Hacking & Cybersecurity Assistant powered by Gemini 3.5 Flash-Lite. Ask me anything about network security, penetration testing, vulnerability analysis, or defensive coding. 💻🔒</div>
    </div>

    <div id="input-area">
        <label for="media-file" class="file-btn">📁</label>
        <input type="file" id="media-file" accept="image/*,video/*,.txt,.py,.js,.log" onchange="showFileName()">
        <span id="file-name"></span>
        <input type="text" id="user-input" placeholder="Enter security query or payload context..." onkeypress="if(event.key === 'Enter') sendMessage()">
        <button class="send-btn" onclick="sendMessage()">Send</button>
    </div>

    <script>
        document.addEventListener("DOMContentLoaded", () => {
            const savedHistory = localStorage.getItem('hacking_chat_history');
            if (savedHistory) {
                document.getElementById('chat-box').innerHTML = savedHistory;
                scrollToBottom();
            }
        });

        function startNewChat() {
            if (confirm("Reset current session history?")) {
                localStorage.removeItem('hacking_chat_history');
                document.getElementById('chat-box').innerHTML = '<div class="message ai">Session cleared. Ready for the next operation, Hacker! 🛡️</div>';
            }
        }

        function showFileName() {
            const fileInput = document.getElementById('media-file');
            const fileNameSpan = document.getElementById('file-name');
            if (fileInput.files.length > 0) {
                fileNameSpan.textContent = fileInput.files[0].name;
            } else {
                fileNameSpan.textContent = '';
            }
        }

        function scrollToBottom() {
            const chatBox = document.getElementById('chat-box');
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        async function sendMessage() {
            const input = document.getElementById('user-input');
            const fileInput = document.getElementById('media-file');
            const chatBox = document.getElementById('chat-box');
            const text = input.value.trim();
            const file = fileInput.files[0];

            if (!text && !file) return;

            let userHtml = '<div class="message user">';
            if (text) userHtml += \`<div>\${text}</div>\`;

            let mediaBase64 = null;
            let mimeType = null;

            if (file) {
                mimeType = file.type || 'text/plain';
                const base64Full = await toBase64(file);
                mediaBase64 = base64Full.split(',')[1];

                if (mimeType.startsWith('image/')) {
                    userHtml += \`<img src="\${base64Full}">\`;
                } else {
                    userHtml += \`<div style="font-size:12px; color:#8b949e;">[Attached: \${file.name}]</div>\`;
                }
            }
            userHtml += '</div>';
            chatBox.innerHTML += userHtml;
            scrollToBottom();

            input.value = '';
            fileInput.value = '';
            document.getElementById('file-name').textContent = '';

            try {
                const res = await fetch('/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text, media: mediaBase64, mimeType: mimeType })
                });
                const data = await res.json();
                
                chatBox.innerHTML += \`<div class="message ai">\${data.response}</div>\`;
                scrollToBottom();

                localStorage.setItem('hacking_chat_history', chatBox.innerHTML);

            } catch (err) {
                chatBox.innerHTML += \`<div class="message ai" style="color:#f85149;">Error communicating with the security server. ⚠️</div>\`;
                scrollToBottom();
            }
        }

        const toBase64 = file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    </script>
</body>
</html>`);
});

app.post('/chat', async (req, res) => {
    try {
        const { message, media, mimeType } = req.body;
        if (!message && !media) {
            return res.json({ response: "Provide a valid security query or target vector." });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.json({ response: "Error: GEMINI_API_KEY is not configured in Vercel environment variables." });
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;

        let parts = [];
        if (media && mimeType) {
            parts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: media
                }
            });
        }
        parts.push({ text: message || "Analyze this security artifact." });

        const payload = {
            contents: [{ parts: parts }],
            systemInstruction: {
                parts: [{ text: "You are an expert Ethical Hacking, Penetration Testing, and Cybersecurity AI Assistant. Your goal is to educate users on offensive and defensive security, vulnerability analysis (OWASP Top 10, SQLi, XSS, Buffer Overflow, etc.), network protocols, reverse engineering, cryptography, and secure coding practices. Provide technical accuracy, code snippets in Python/Bash/JS when relevant, and emphasize responsible disclosure and legal boundaries (authorized testing only). Answer clearly and professionally." }]
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
            ]
        };

        const apiRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await apiRes.json();

        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
            return res.json({ response: data.candidates[0].content.parts[0].text });
        } else {
            console.error("API Error Response:", JSON.stringify(data));
            return res.json({ response: "Failed to generate response from Gemini 3.5 Flash-Lite API." });
        }

    } catch (error) {
        console.error("Server Error:", error);
        return res.json({ response: "Internal Server Error occurred during security processing." });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(3000, () => console.log('Server running on port 3000'));
}

module.exports = app;

