const fetch = require('node-fetch');
const readlineSync = require('readline-sync');

const BASE_URL = 'https://ai-abhinav.onrender.com';
const API_URL = `${BASE_URL}/api`;
const CHAT_HISTORY_URL = `${BASE_URL}/chat/history`;

async function createNewChat() {
    const res = await fetch(`${API_URL}/chat/new`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to create chat: ${res.statusText}`);
    const data = await res.json();
    return data.chat_id;
}

async function sendMessage(chat_id, message) {
    const payload = {
        id: chat_id,
        msg: message,
        model: 'reka-core'
    };
    const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Failed to send message: ${res.statusText}`);
    const data = await res.json();
    return data.response;
}

async function main() {
    console.log('Starting a new chat session...');
    const chatId = await createNewChat();
    console.log(`Your chat ID: ${chatId}`);
    console.log(`View chat history at: ${CHAT_HISTORY_URL}?id=${chatId}`);
    console.log("Type 'exit' to quit.\n");

    while (true) {
        const message = readlineSync.question('You: ');
        if (message.trim().toLowerCase() === 'exit') break;
        try {
            const response = await sendMessage(chatId, message);
            console.log('AI:', response);
        } catch (error) {
            console.error('Error:', error.message);
        }
    }

    console.log('Goodbye!');
}

main();
