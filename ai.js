const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use(express.static(__dirname));
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Chat with AI</title>
<style>
  body { font-family: Arial, sans-serif; background:#222; color:#eee; margin:0; padding:20px; }
  #log { max-height:80vh; overflow:auto; border:1px solid #555; padding:10px; margin-bottom:10px; }
  #msgInput { width: calc(100% - 100px); padding:10px; font-size:1em; }
  button { padding:10px; font-size:1em; }
</style>
</head>
<body>
<h2>Chat with AI</h2>
<div id="log"></div>
<input id="msgInput" placeholder="Type message..." />
<button id="sendBtn">Send</button>
<div><a id="historyLink" href="#" target="_blank">View chat history</a></div>
<script>
const apiBase = 'https://ai-abhinav.onrender.com';
const apiUrl = apiBase + '/api';
const chatHistoryUrl = apiBase + '/chat/history';

let chatId = localStorage.getItem('chat_id');

async function createChat() {
  const res = await fetch(\`\${apiUrl}/chat/new\`, { method:'POST' });
  const data = await res.json();
  chatId = data.chat_id;
  localStorage.setItem('chat_id', chatId);
  document.getElementById('historyLink').href = \`\${chatHistoryUrl}?id=\${chatId}\`;
}

async function sendMessage(msg) {
  const payload = {
    id: chatId,
    msg: msg,
    model: 'reka-core'
  };
  const res = await fetch(\`\${apiUrl}/chat\`, {
    method:'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data.response;
}

function appendLog(text, isUser=false) {
  const div = document.createElement('div');
  div.textContent = (isUser ? 'You: ' : 'AI: ') + text;
  document.getElementById('log').appendChild(div);
  document.getElementById('log').scrollTop = document.getElementById('log').scrollHeight;
}

document.getElementById('sendBtn').onclick = () => {
  send();
};
document.getElementById('msgInput').onkeydown = (e) => {
  if(e.key==='Enter') { e.preventDefault(); send(); }
};

async function send() {
  const msg = document.getElementById('msgInput').value.trim();
  if(!msg) return;
  appendLog(msg, true);
  if(!chatId) await createChat();
  appendLog('...', false);
  try {
    const reply = await sendMessage(msg);
    // update last log
    const last = document.getElementById('log').lastChild;
    last.textContent = 'AI: ' + reply;
  } catch(e) {
    alert('Error: '+e.message);
  }
}

// Initialize chat link
(async ()=>{ if(!chatId) await createChat(); })();

</script>
</body>
</html>`);
});

app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
