from flask import Flask, render_template, request, jsonify, session
from flask_socketio import SocketIO, emit
from datetime import datetime
import requests
import secrets

app = Flask(__name__)
app.config['SECRET_KEY'] = secrets.token_hex(16)
socketio = SocketIO(app, cors_allowed_origins="*")  # Allow connections from any origin

API_BASE_URL = 'https://neo-abhinav.onrender.com/api'

@app.route('/')
def index():
    if 'chat_id' not in session:
        # Create a new chat session
        try:
            response = requests.post(f'{API_BASE_URL}/chat/new', timeout=30)
            if response.status_code == 200:
                data = response.json()
                if 'chat_id' in data:
                    session['chat_id'] = data['chat_id']
        except Exception as e:
            print(f"Error creating new chat: {e}")
    
    return render_template('chat.html')

@socketio.on('send_message')
def handle_message(data):
    message = data.get('message')
    if not message:
        return

    # Emit the user message immediately
    emit('message', {
        'message': message,
        'is_user': True,
        'timestamp': datetime.now().strftime("%H:%M")
    })

    # Show typing indicator
    emit('typing', {'is_typing': True})

    try:
        payload = {
            "msg": message,
            "model": "gpt-4o-mini"
        }
        
        if 'chat_id' in session:
            payload["id"] = session['chat_id']

        response = requests.post(f'{API_BASE_URL}/chat', json=payload, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            
            if 'chat_id' in data and 'chat_id' not in session:
                session['chat_id'] = data['chat_id']
            
            if 'response' in data and data['response']:
                # Hide typing indicator and send response
                emit('typing', {'is_typing': False})
                emit('message', {
                    'message': data['response'],
                    'is_user': False,
                    'timestamp': datetime.now().strftime("%H:%M")
                })
            else:
                emit('error', {'message': 'No response from server.'})
        else:
            emit('error', {'message': f'Server error: {response.status_code}'})
    
    except Exception as e:
        emit('error', {'message': str(e)})
    finally:
        emit('typing', {'is_typing': False})

@socketio.on('new_chat')
def handle_new_chat():
    try:
        response = requests.post(f'{API_BASE_URL}/chat/new', timeout=30)
        if response.status_code == 200:
            data = response.json()
            if 'chat_id' in data:
                session['chat_id'] = data['chat_id']
                emit('clear_chat')
                emit('message', {
                    'message': 'New chat started!',
                    'is_user': False,
                    'timestamp': datetime.now().strftime("%H:%M")
                })
            else:
                emit('error', {'message': 'No chat ID returned from server.'})
        else:
            emit('error', {'message': f'Server error: {response.status_code}'})
    except Exception as e:
        emit('error', {'message': str(e)})

if __name__ == '__main__':
    # Modified to run on 0.0.0.0:8080
    socketio.run(app, host='0.0.0.0', port=8080, debug=True)
