const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fetch = require('node-fetch');
const path = require('path');

const marked = require('marked');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const API_BASE_URL = 'https://ai-abhinav.onrender.com/api';

const sessions = new Set();

// Serve static files (index.html)
app.use(express.static(__dirname));

app.get('/', async (req, res) => {
  const cookies = req.headers.cookie || '';
  const chatIdMatch = cookies.match(/chat_id=([^;]+)/);
  let chatId = chatIdMatch ? chatIdMatch[1] : null;

  if (!chatId || !sessions.has(chatId)) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/new`, { method: 'POST' });
      const data = await response.json();
      if (data.chat_id) {
        chatId = data.chat_id;
        sessions.add(chatId);
        res.setHeader('Set-Cookie', `chat_id=${chatId}; HttpOnly; Path=/`);
      } else {
        return res.status(500).send('Failed to create chat session');
      }
    } catch (err) {
      console.error(err);
      return res.status(500).send('Error creating chat session');
    }
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  const cookies = socket.handshake.headers.cookie || '';
  const chatIdMatch = cookies.match(/chat_id=([^;]+)/);
  const chatId = chatIdMatch ? chatIdMatch[1] : null;

  socket.on('send_message', async ({ message, model }) => {
    if (!message) return;

    // Validate selected model, default fallback
    const allowedModels = ['gpt-4', 'gpt-4o', 'gpt-40-mini'];
    const selectedModel = allowedModels.includes(model) ? model : 'gpt-4';

    // Special handling for image prompts
    if (message.toLowerCase().startsWith('image:')) {
      const promptText = message.slice(6).trim();
      const encodedPrompt = encodeURIComponent(promptText);

      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=832&height=480&model=flux&nologo=true&private=false&enhance=false&safe=false&seed=2190881960`;

      socket.emit('message', {
        message: `<img src="${imageUrl}" alt="Generated Image" style="max-width:100%; height:auto;">`,
        is_user: false,
        timestamp: new Date().toLocaleTimeString()
      });
      return;
    }

    try {
      const payload = {
        msg: message,
        model: 'blackboxai',
      };
      if (chatId && sessions.has(chatId)) {
        payload.id = chatId;
      }

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (data.response) {
        const html = marked.parse(data.response, { breaks: true });
        socket.emit('message', {
          message: html,
          is_user: false,
          timestamp: new Date().toLocaleTimeString()
        });
      }
    } catch (err) {
      socket.emit('error', { message: err.toString() });
    }
  });

  // Optionally, handle 'generate_image' event sent from frontend image button:
  socket.on('generate_image', ({ prompt, model }) => {
    // For demo, simply reuse the 'image:' logic
    if (!prompt) return;
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=832&height=480&model=flux&nologo=true&private=false&enhance=false&safe=false&seed=2190881960`;
    socket.emit('image_generated', { url: imageUrl });
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
