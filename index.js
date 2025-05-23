// index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files like logo.png and index.html
app.use(express.static(path.join(__dirname)));

// Serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Websocket backend code
const chats = {};

io.on('connection', (socket) => {
  console.log('User  connected');
  chats[socket.id] = null;
  
  socket.on('send_message', async (data) => {
    const payload = {
      id: chats[socket.id],
      msg: data.message,
      model: "reka-core",
      system_prompt: null,
    };
    try {
      const response = await fetch('https://ai-abhinav.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('API error');

      const json = await response.json();
      chats[socket.id] = json.chat_id || chats[socket.id];
      socket.emit('message', { message: json.response || 'No response from AI' });
    } catch (err) {
      console.error('Error:', err);
      socket.emit('message', { message: 'Failed to get AI response' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User  disconnected');
    delete chats[socket.id];
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
