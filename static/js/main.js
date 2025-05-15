document.addEventListener('DOMContentLoaded', function() {
    // Modify the socket connection to use the correct host and port
    const socket = io(window.location.protocol + '//' + window.location.hostname + ':8080');
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const newChatButton = document.getElementById('newChatButton');

    function createMessageElement(message, isUser, timestamp) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'assistant-message'}`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = message;

        const timeDiv = document.createElement('div');
        timeDiv.className = 'timestamp';
        timeDiv.textContent = timestamp;

        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);
        return messageDiv;
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addMessage(message, isUser, timestamp) {
        const messageElement = createMessageElement(message, isUser, timestamp);
        chatMessages.appendChild(messageElement);
        scrollToBottom();
    }

    let typingIndicator = null;
    function showTypingIndicator() {
        if (!typingIndicator) {
            typingIndicator = document.createElement('div');
            typingIndicator.className = 'typing-indicator';
            typingIndicator.textContent = 'ExhaAi is typing...';
            chatMessages.appendChild(typingIndicator);
            scrollToBottom();
        }
    }

    function hideTypingIndicator() {
        if (typingIndicator) {
            typingIndicator.remove();
            typingIndicator = null;
        }
    }

    function sendMessage() {
        const message = messageInput.value.trim();
        if (message) {
            socket.emit('send_message', { message: message });
            messageInput.value = '';
            messageInput.disabled = true;
        }
    }

    // Socket event listeners
    socket.on('message', function(data) {
        addMessage(data.message, data.is_user, data.timestamp);
        if (!data.is_user) {
            messageInput.disabled = false;
            messageInput.focus();
        }
    });

    socket.on('typing', function(data) {
        if (data.is_typing) {
            showTypingIndicator();
        } else {
            hideTypingIndicator();
        }
    });

    socket.on('error', function(data) {
        addMessage('Error: ' + data.message, false, new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
        messageInput.disabled = false;
        messageInput.focus();
    });

    socket.on('clear_chat', function() {
        chatMessages.innerHTML = '';
    });

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    newChatButton.addEventListener('click', function() {
        socket.emit('new_chat');
    });
});
