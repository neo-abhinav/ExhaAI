from flask import Flask, render_template_string, request, jsonify, session
from flask_socketio import SocketIO, emit
from datetime import datetime
import requests
import secrets
import re

app = Flask(__name__)
app.config['SECRET_KEY'] = secrets.token_hex(16)
socketio = SocketIO(app, cors_allowed_origins="*")

API_BASE_URL = 'https://neo-abhinav.onrender.com/api'

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
            margin: 0;
            padding: 0;
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
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
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
            color: #ffffff;
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
        .assistant-message i {
            font-style: italic;
        }
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
            <img src="{{ url_for('static', filename='img/exhaai.ico') }}" alt="Logo" class="logo">
            <span class="brand-title">ExhaAI</span>
        </div>
        <div class="chat-container" id="chatContainer">
            <!-- Chat messages will appear here -->
        </div>
        <div class="input-container">
            <input type="text" id="messageInput" placeholder="Ask anything...">
            <button id="sendButton" class="send-button">Send</button>
        </div>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.0.1/socket.io.js"></script>
    <script>
        const socket = io();
        const chatContainer = document.getElementById('chatContainer');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');

        function addMessage(message, isUser) {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message', isUser ? 'user-message' : 'assistant-message');
            messageDiv.innerHTML = message; // Allow formatted HTML for AI responses
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        function sendMessage() {
            const message = messageInput.value.trim();
            if (message) {
                addMessage(message, true); // Add user message
                socket.emit('send_message', { message: message }); // Emit only once
                messageInput.value = ''; // Clear input
            }
        }

        sendButton.addEventListener('click', sendMessage);

        messageInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        });

        socket.on('message', function(data) {
            addMessage(data.message, false); // Add AI response
        });

        socket.on('error', function(data) {
            addMessage('<b>Error:</b> ' + data.message, false);
        });
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    if 'chat_id' not in session:
        try:
            response = requests.post(f'{API_BASE_URL}/chat/new', timeout=30)
            if response.status_code == 200:
                data = response.json()
                if 'chat_id' in data:
                    session['chat_id'] = data['chat_id']
        except Exception as e:
            print(f"Error creating new chat: {e}")
    return render_template_string(HTML_TEMPLATE)

@socketio.on('send_message')
def handle_message(data):
    message = data.get('message')
    if not message:
        return

    # Do not emit user message back to the client
    try:
        payload = {
            "msg": message,
            "model": "gpt-4o-mini"
        }
        if 'chat_id' in session:
            payload["id"] = session['chat_id']

        # Get AI response
        response = requests.post(f'{API_BASE_URL}/chat', json=payload, timeout=30)
        if response.status_code == 200:
            data = response.json()
            if 'response' in data:
                formatted_response = format_ai_response(data['response'])
                emit('message', {
                    'message': formatted_response,
                    'is_user': False,
                    'timestamp': datetime.now().strftime("%H:%M")
                })
        else:
            emit('error', {'message': f"Server error: {response.status_code}"})
    except Exception as e:
        emit('error', {'message': str(e)})

def format_ai_response(response):
    """
    Converts plain text responses into HTML with styles (e.g., bold, italic).
    """
    response = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', response)  # Bold
    response = re.sub(r'\*(.*?)\*', r'<i>\1</i>', response)      # Italic
    response = re.sub(r'__(.*?)__', r'<em>\1</em>', response)    # Emphasis
    return response

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8080, debug=True)