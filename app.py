from flask import Flask, request, send_from_directory, make_response
from flask_socketio import SocketIO, emit
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import html
import datetime

# Initialize Flask app
app = Flask(__name__, static_folder='.')
socketio = SocketIO(app, cors_allowed_origins='*')

# Load fast model (DistilGPT-2)
model_name = 'distilgpt2'
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)

# Use GPU if available for faster inference
if torch.cuda.is_available():
    model = model.to('cuda')
    model.half()  # use float16 for speed

@app.route('/')
def index():
    chat_id = request.cookies.get('chat_id')
    if not chat_id:
        # For demo, use a static chat_id. For real use, generate UUID.
        chat_id = 'session'
        response = make_response(send_from_directory('.', 'index.html'))
        response.set_cookie('chat_id', chat_id)
        return response
    else:
        return send_from_directory('.', 'index.html')

@socketio.on('send_message')
def handle_send_message(data):
    message = data.get('message')
    model_choice = data.get('model', 'gpt-2')

    # Handle image prompt
    if message and message.lower().startswith('image:'):
        prompt_text = message[6:].strip()
        encoded_prompt = html.escape(prompt_text)
        image_url = (
            f"https://image.pollinations.ai/prompt/"
            f"{encoded_prompt}?width=832&height=480&model=flux&nologo=true&private=false&enhance=false&safe=false&seed=2190881960"
        )
        emit('message', {
            'message': f'<img src="{image_url}" alt="Generated Image" style="max-width:100%; height:auto;">',
            'is_user': False,
            'timestamp': datetime.datetime.now().strftime("%H:%M:%S")
        })
        return

    # Generate Fortnite response (fast GPT-2)
    try:
        inputs = tokenizer.encode(message, return_tensors='pt')
        if torch.cuda.is_available():
            inputs = inputs.to('cuda')
        output_ids = model.generate(
            inputs,
            max_length=100,
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            top_k=50
        )
        response_text = tokenizer.decode(output_ids[0], skip_special_tokens=True)
        # Basic formatting
        html_response = response_text.replace('\n', '<br>')
        emit('message', {
            'message': html_response,
            'is_user': False,
            'timestamp': datetime.datetime.now().strftime("%H:%M:%S")
        })
    except Exception as e:
        emit('error', {'message': str(e)})

@socketio.on('generate_image')
def handle_generate_image(data):
    prompt = data.get('prompt')
    if not prompt:
        return
    encoded_prompt = html.escape(prompt)
    image_url = (
        f"https://image.pollinations.ai/prompt/"
        f"{encoded_prompt}?width=832&height=480&model=flux&nologo=true&private=false&enhance=false&safe=false&seed=2190881960"
    )
    emit('image_generated', {'url': image_url})

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8080)
