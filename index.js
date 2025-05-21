// index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fetch = require('node-fetch');
const marked = require('marked');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const API_BASE_URL = 'https://ai-abhinav.onrender.com/api';

// Simple in-memory sessions keyed by chat_id
const sessions = new Set();

const HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>ExhaAI</title>
<style>
  :root {
    --primary-bg: #121212;
    --secondary-bg: #1e1e1e;
    --text-color: #e0e0e0;
    --user-msg-bg: #4caf50;
    --assistant-msg-bg: #333333;
    --input-bg: #262626;
    --button-bg: #6200ea;
    --button-text-color: #fff;
    --border-color: #333333;
    --hover-bg: #3700b3;
    --font-family: 'Inter', sans-serif;
  }
  body {
    margin: 0; padding: 0;
    font-family: var(--font-family);
    background-color: var(--primary-bg);
    color: var(--text-color);
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }
  .main-container {
    width: 100%;
    max-width: 800px;
    height: 90vh;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
  .header {
    display: flex;
    align-items: center;
    padding: 20px 20px;
    background-color: var(--secondary-bg);
    border-bottom: 1px solid var(--border-color);
    justify-content: center;
  }
  .logo {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    margin-right: 10px;
    background: url('data:image/x-icon;base64,AAABAAEAEBAAAAEAIAAAACABAAZAEAAEAGAAA...') no-repeat center;
    background-size: contain;
  }
  .brand-title {
    font-size: 28px;
    font-weight: bold;
  }
  .chat-container {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background-color: var(--primary-bg);
  }
  .message {
    max-width: 80%;
    padding: 10px;
    border-radius: 10px;
    word-wrap: break-word;
  }
  .user-message {
    background-color: var(--user-msg-bg);
    color: #fff;
    align-self: flex-end;
  }
  .assistant-message {
    background-color: var(--assistant-msg-bg);
    color: var(--text-color);
    align-self: flex-start;
  }
  .assistant-message b {
    font-weight: bold;
  }
  .assistant-message i,
  .assistant-message em {
    font-style: italic;
  }
  .input-container {
    display: flex;
    padding: 10px;
    background-color: var(--secondary-bg);
    border-top: 1px solid var(--border-color);
  }
  #messageInput {
    flex: 1;
    padding: 10px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background-color: var(--input-bg);
    color: var(--text-color);
    font-size: 16px;
  }
  #messageInput:focus {
    outline: none;
  }
  .send-button {
    margin-left: 10px;
    border: none;
    background-color: var(--button-bg);
    color: var(--button-text-color);
    border-radius: 4px;
    padding: 10px 20px;
    cursor: pointer;
  }
  .send-button:hover {
    background-color: var(--hover-bg);
  }
</style>
</head>
<body>
<div class="main-container">
  <div class="header">
    <div class="logo"></div>
    <span class="brand-title">ExhaAI</span>
  </div>
  <div class="chat-container" id="chatContainer"></div>
  <div class="input-container">
    <input type="text" id="messageInput" placeholder="Ask anything..." autocomplete="off" />
    <button id="sendButton" class="send-button">Send</button>
  </div>
</div>

<script src="/socket.io/socket.io.js"></script>
<script>
  const socket = io();
  const chatContainer = document.getElementById('chatContainer');
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');

  function addMessage(message, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', isUser ? 'user-message' : 'assistant-message');
    messageDiv.innerHTML = message;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    addMessage(message, true);
    socket.emit('send_message', { message });
    messageInput.value = '';
  }

  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', event => {
    if (event.key === 'Enter') sendMessage();
  });

  socket.on('message', data => {
    addMessage(data.message, false);
  });

  socket.on('error', data => {
    addMessage('<b>Error:</b> ' + data.message, false);
  });
</script>
</body>
</html>
`;

app.get('/', async (req, res) => {
  // Try to get chat_id from cookie header
  const cookies = req.headers.cookie || '';
  const chatIdMatch = cookies.match(/chat_id=([^;]+)/);
  let chatId = chatIdMatch ? chatIdMatch[1] : null;

  if (!chatId || !sessions.has(chatId)) {
    // Create new chat session with API
    try {
      const response = await fetch(`${API_BASE_URL}/chat/new`, { method: 'POST' });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      if (data.chat_id) {
        chatId = data.chat_id;
        sessions.add(chatId);
        // Set cookie header manually 
        res.setHeader('Set-Cookie', `chat_id=${chatId}; HttpOnly; Path=/`);
      } else {
        return res.status(500).send('Failed to create chat session');
      }
    } catch (error) {
      console.error(error);
      return res.status(500).send('Error creating chat session');
    }
  }

  res.send(HTML_TEMPLATE);
});

io.on('connection', (socket) => {
  const cookie = socket.handshake.headers.cookie || '';
  const chatIdMatch = cookie.match(/chat_id=([^;]+)/);
  const chatId = chatIdMatch ? chatIdMatch[1] : null;

  socket.on('send_message', async (data) => {
    const message = data.message && data.message.trim();
    if (!message) return;

    if (message.toLowerCase().startsWith('image:')) {
      const prompt = message.slice('image:'.length).trim();
      const encodedPrompt = encodeURIComponent(prompt);
      const imageUrl = `https://text.pollinations.ai/${encodedPrompt}`;
      socket.emit('message', {
        message: `<img src="${imageUrl}" alt="Generated Image" style="max-width:100%; height:auto;">`,
        is_user: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      return;
    }

    try {
      const payload = {
        msg: message,
        model: 'blackboxai'
      };
      if (chatId && sessions.has(chatId)) {
        payload.id = chatId;
      }

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        timeout: 30000
      });

      if (!response.ok) {
        socket.emit('error', { message: `Server error: ${response.status}` });
        return;
      }

      const responseData = await response.json();
      if ('response' in responseData) {
        const formatted = formatAiResponse(responseData.response);
        socket.emit('message', {
          message: formatted,
          is_user: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    } catch (err) {
      socket.emit('error', { message: err.toString() });
    }
  });
});

function formatAiResponse(response) {
  let html = marked.parse(response, { breaks: true });
  html = html.replace(/  \n/g, '<br>\n');
  return html;
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
